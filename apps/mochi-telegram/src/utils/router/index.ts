import {
  BaseActionObject,
  StateNodesConfig,
  StatesConfig,
  createMachine,
  interpret,
} from "xstate";
import { isArray, isNumber, isString, isUndefined, merge } from "lodash";
import {
  InlineKeyboardButton,
  Message,
} from "telegraf/typings/core/types/typegram";
import { logger } from "logger";
import { MachineConfig, MachineOptions } from "./type";
import { Context, Telegraf } from "telegraf";
import { stringUtils } from "utils";
import { commandStore } from "async-storage";

export { MachineConfig, MachineOptions };
export default { init };

const routerCache = new Map<string, Record<string, unknown>>();

function decorateWithActions(
  states?: StatesConfig<any, any, any, BaseActionObject>
) {
  if (!states) return;
  for (const state of Object.values(states)) {
    decorateWithActions(state.states);

    // we only add actions to leaf state, not compound state
    if (state.states) continue;
    // decorate
    state.entry = ["transition"];
  }
}

function getAllDelayedStateTargets(
  set: Set<string>,
  states?: StatesConfig<any, any, any, BaseActionObject>
) {
  if (!states) return;
  for (const state of Object.values(states)) {
    getAllDelayedStateTargets(set, state.states);

    if (state.states || !state.after) continue;
    if (isArray(state.after))
      throw new Error(
        "Mochi router - delayed array target is not yet supported"
      );
    Object.values(state.after).forEach((target) => {
      if (isString(target)) {
        set.add(target);
      }
    });
  }
}

function aggregateContext(states: StateNodesConfig<any, any, any>) {
  if (!states) return {};
  let context = {};

  for (const s of Object.values(states)) {
    context = merge(context, s.context, aggregateContext(s.states));
  }

  return context;
}

export enum RouterSpecialAction {
  PREV_PAGE = "PREV_PAGE",
  NEXT_PAGE = "NEXT_PAGE",
  JUMP_START = "JUMP_START",
  JUMP_END = "JUMP_END",
  BACK = "BACK",
}

const PAGE_MAP = new Proxy<Record<string, number>>(
  {},
  {
    get(_, prop) {
      if (prop === RouterSpecialAction.PREV_PAGE) return -1;
      if (prop === RouterSpecialAction.NEXT_PAGE) return 1;
      return 0;
    },
  }
);

export function paginationButtons(
  page: number,
  totalPage: number,
  enableJump = false
) {
  if (totalPage <= 1) return [];
  const actionRow: Array<InlineKeyboardButton> = [];
  if (page !== 0) {
    if (enableJump) {
      actionRow.push({
        text: "⏪",
        callback_data: RouterSpecialAction.JUMP_START,
      });
    }
    actionRow.push({
      text: "◀️",
      callback_data: RouterSpecialAction.PREV_PAGE,
    });
  }

  if (page !== totalPage - 1) {
    actionRow.push({
      text: "▶️",
      callback_data: RouterSpecialAction.NEXT_PAGE,
    });

    if (enableJump) {
      actionRow.push({
        text: "⏩",
        callback_data: RouterSpecialAction.JUMP_END,
      });
    }
  }
  return actionRow;
}

// we need to clear old handler after some time to preserve memory
function scheduleClear(id: string) {
  const timeoutId = setTimeout(() => {
    handler.delete(id);
  }, 5 * 60 * 1000);

  timeout.set(String(id), timeoutId);
}

// negative chat id == group (prefer editing messag)
// positive id = direct message (prefer reply message)
function getId(ctx: Context, msg?: Message) {
  if (isUndefined(msg)) {
    const chatId = ctx.chat?.id;
    if (!chatId || !("callback_query" in ctx.update)) return "";
    return Math.sign(chatId) < 0
      ? [
          Math.abs(chatId),
          ctx.update.callback_query.message?.message_id,
          ctx.from?.id,
        ].map(String)
      : [chatId].map(String);
  } else {
    return Math.sign(msg.chat.id) < 0
      ? [Math.abs(msg.chat.id), msg.message_id, ctx.from?.id].map(String)
      : [msg.chat.id].map(String);
  }
}

function init(bot: Telegraf) {
  bot.action(/.*/, async (ctx) => {
    if (!ctx.chat?.id) return;
    const [chatId, msgId, authorId] = getId(ctx);
    const id = [chatId, msgId, authorId].filter(Boolean).join("-");
    const h = handler.get([chatId, msgId].filter(Boolean).join("-"));
    const isFromAuthor =
      !authorId || stringUtils.equal(h?.authorId ?? "", authorId);

    if (h?.h && (isFromAuthor || h.allowAnyone)) {
      h.h(ctx);

      if (id) {
        const timeoutId = timeout.get(String(id));

        // refresh
        clearTimeout(timeoutId);
        scheduleClear(id);
      }
    }

    let text;
    if (!h?.h) {
      text = "Message timed out, please run command again";
    } else if (!isFromAuthor) {
      text = "Cannot interact with other's message";
    }

    await ctx.answerCbQuery(text).catch(() => null);
  });
}

function transition(cacheKey: string, msgId: string) {
  return async function (context: any, event: any) {
    let {
      tgCtx,
      canBack = false,
      dry,
      state,
      context: oldContext = context,
    } = event;

    if (!state || dry || state === "steps") return;
    const renderer = context.renderer?.[state];

    if (!renderer) return;
    try {
      // handle pagination for user
      if (
        [
          RouterSpecialAction.PREV_PAGE,
          RouterSpecialAction.NEXT_PAGE,
          RouterSpecialAction.JUMP_START,
          RouterSpecialAction.JUMP_END,
        ].includes(event.type as RouterSpecialAction) &&
        isNumber(oldContext.page)
      ) {
        oldContext.page += PAGE_MAP[event.type];
        if (event.type === RouterSpecialAction.JUMP_START) {
          oldContext.page = 0;
        } else if (event.type === RouterSpecialAction.JUMP_END) {
          if (isNumber(oldContext.totalPage)) {
            oldContext.page = oldContext.totalPage - 1;
          }
        }
        oldContext.page = Math.max(oldContext.page, 0);
      }

      tgCtx.state = oldContext._internalState;

      // run renderer
      await commandStore.run(
        {
          data: {
            user_id: tgCtx.from?.id,
            command: tgCtx.state?.command?.command ?? "",
          },
          start: performance.now(),
        },
        async () => {
          const result = await renderer(tgCtx, event.type, oldContext);
          if (!result) return;
          let { context = {}, text, options = {}, photo } = result;
          const newContext = {
            ...oldContext,
            ...context,
          };

          routerCache.set(cacheKey, newContext);

          if (!text) return;

          if (canBack) {
            if (options.reply_markup?.inline_keyboard) {
              options.reply_markup.inline_keyboard.push([
                {
                  text: "Back",
                  callback_data: RouterSpecialAction.BACK,
                },
              ]);
            } else {
              options = {
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "Back",
                        callback_data: RouterSpecialAction.BACK,
                      },
                    ],
                  ],
                },
              };
            }
          }

          const chatId = tgCtx.chat.id;

          if (chatId < 0) {
            const p = photos.get(msgId);
            if (p) {
              await tgCtx.deleteMessage(p);
              photos.delete(msgId);
            }
            if (photo) {
              const newPhoto = await tgCtx.replyWithPhoto(photo);
              photos.set(msgId, newPhoto.message_id);
            }

            await tgCtx.telegram
              .editMessageText(
                tgCtx.chat.id,
                newContext.msgId,
                undefined,
                text,
                {
                  ...options,
                  parse_mode: "MarkdownV2",
                }
              )
              .catch(() => null);
          } else {
            if (photo) {
              await tgCtx.telegram.sendPhoto(chatId, photo);
            }

            await tgCtx.telegram.sendMessage(chatId, text, {
              ...options,
              parse_mode: "MarkdownV2",
            });
          }
        }
      );
    } catch (e: any) {
      context.steps?.push(e.name);

      if (context.steps) {
        logger.error(context.steps?.toString());
      }

      throw e;
    }
  };
}

const handler = new Map<
  string,
  { allowAnyone: boolean; authorId: string; h: (ctx: Context) => void }
>();
const photos = new Map<string, string>();
const timeout = new Map<string, any>();

export function route(
  tgCtx: Context,
  msg: Message,
  config: MachineConfig,
  options: MachineOptions = {}
) {
  const [chatId, msgId, authorId] = getId(tgCtx, msg);
  const id = [chatId, msgId, authorId].filter(Boolean).join("-");

  const { renderer } = (config.context ?? {}) as any;

  // manually add action to each state and child states
  decorateWithActions(config.states);

  const allDelayedStateTargets = new Set<string>();
  getAllDelayedStateTargets(allDelayedStateTargets, config.states);

  let machine = createMachine(
    {
      ...config,
      context: {
        ...config.context,
        id: config.id,
        msgId: msg.message_id,
        renderer,
        _internalState: tgCtx.state,
      },
      predictableActionArguments: true,
    },
    {
      ...options,
      guards: options.guards,
      actions: {
        ...options.actions,
        transition: transition(id, String(msg.message_id)),
      },
    }
  );

  const aggregatedContext = aggregateContext(machine.states);
  machine = machine.withContext(merge(machine.context, aggregatedContext));

  const { button: b, select: s, steps: _s, ...userData } = machine.context;
  routerCache.set(id, userData);

  const machineService = interpret(machine);
  machineService.onTransition((s) => {
    if (isString(s.value) && allDelayedStateTargets.has(s.value)) {
      const prevState = s.toStrings().at(-1)?.split(".").at(-1);

      transition(id, String(msg.message_id))(config.context, {
        type: s.value,
        tgCtx,
        prevState,
        state: s.value,
        canBack: false,
        context: routerCache.get(id),
      });
    }
  });
  machineService.start();

  handler.set([chatId, msgId].filter(Boolean).join("-"), {
    allowAnyone: ["airdrop"].includes(config.id),
    authorId: authorId ?? chatId,
    h: (ctx: Context) => {
      let { data: event } = (ctx.update as any).callback_query;

      event = event.toUpperCase();

      const context = routerCache.get(id) ?? {};
      const currentState = machineService.getSnapshot();
      const nextState = machineService.nextState({
        type: event,
        tgCtx: ctx,
        dry: true,
        context,
      });

      const can = currentState.can({
        type: event,
        tgCtx: ctx,
        context,
        dry: true,
      });
      if (can) {
        const transitionData = machine
          .getTransitionData(currentState, event)
          ?.transitions.at(0);
        const prevState = currentState.toStrings().at(-1)?.split(".").at(-1);
        const state = nextState.toStrings().at(-1)?.split(".").at(-1) ?? "";

        const data = {
          type: event,
          tgCtx: ctx,
          prevState,
          state,
          canBack: nextState.can(RouterSpecialAction.BACK),
          context,
        };

        machineService.send(data);

        if (transitionData?.internal) {
          transition(id, String(id))(routerCache.get(id), data);
        }
      }
    },
  });

  scheduleClear(id);
}
