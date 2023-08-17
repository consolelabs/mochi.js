import { mochiApi, profileApi } from "adapters";
import { Context, Format } from "telegraf";
import { errorUtils, stringUtils } from "utils";
import {
  MachineConfig,
  paginationButtons,
  route,
  RouterSpecialAction,
} from "utils/router";
import reply from "utils/reply";
import { ModelUserFeedback } from "types/api";
import { getAllCommandName } from "commands";
import { chunk } from "lodash";
import { fmt } from "utils/formatter";

export const machineConfig: (ctx: any) => MachineConfig = (ctx = {}) => ({
  id: "feedback",
  initial: "feedback",
  context: {
    renderer: {
      feedback: (tgCxt, ev, ctx) => {
        if (ev === "TOGGLE_FEEDBACK") {
          return render(tgCxt, 0, !ctx.isMyFeedback);
        }
        return render(tgCxt, ctx.page, ctx.isMyFeedback);
      },
      addFeedback: async (tgCtx: Context, _ev, ctx) => {
        const from = tgCtx.from?.id;
        if (!from) return;

        reply.addHandler(from, async (msgCtx) => {
          const replyMsg = (msgCtx.message as any).text as string;
          if (!ctx.content) {
            const { text, options } = await renderAskCommand();
            await tgCtx.telegram.sendMessage(msgCtx.chat?.id || "", text, {
              ...options,
              parse_mode: "MarkdownV2",
              // @ts-ignore
              reply_to_message_id: msgCtx.update.message?.message_id,
            });
            ctx.content = replyMsg;
          } else {
            const { text } = await sendFeedback(tgCtx, replyMsg, ctx.content);

            await tgCtx.telegram.sendMessage(msgCtx.chat?.id || "", text, {
              reply_markup: {
                selective: true,
                remove_keyboard: true,
              },
              // @ts-ignore
              reply_to_message_id: msgCtx.update.message?.message_id,
            });
            return true;
          }
        });

        return renderAskFeedback();
      },
    },
    page: 0,
    isMyFeedback: true,
    content: null,
    feedback: null,
    ...ctx,
  },
  states: {
    feedback: {
      on: {
        [RouterSpecialAction.NEXT_PAGE]: "feedback",
        [RouterSpecialAction.PREV_PAGE]: "feedback",
        [RouterSpecialAction.JUMP_START]: "feedback",
        [RouterSpecialAction.JUMP_END]: "feedback",
        TOGGLE_FEEDBACK: "feedback",
        ADD_FEEDBACK: "addFeedback",
      },
    },
    addFeedback: {
      type: "final",
    },
  },
});

const PAGE_SIZE = 5;

async function sendFeedback(
  ctx: Context,
  command: string | undefined,
  feedback: string
) {
  const profile = await profileApi.getByTelegram(ctx.from?.id.toString() ?? "");
  if (profile.err) throw new Error("Couldn't get profile data");

  const res = await mochiApi.community.sendFeedback({
    profile_id: profile.id,
    command,
    feedback,
  });
  if (!res.ok) return errorUtils.replyData(res.error.message);

  return {
    text: "Thank you for your feedback 🙇",
  };
}

async function renderAskCommand() {
  const commands = getAllCommandName();
  const keyboard = chunk(
    [{ text: "skip" }, ...commands.map((c) => ({ text: c }))],
    3
  );

  return {
    text: [
      "Got it, which command are you giving feedback for?",
      "e\\.g\\. `profile`, `balance`, etc\\.\\.\\.",
      "_Hint: enter `skip` if this feedback is general_",
    ].join("\n"),

    options: {
      disable_web_page_preview: true,
      reply_markup: {
        resize_keyboard: true,
        one_time_keyboard: true,
        input_field_placeholder: 'Choose a command or "skip"',
        selective: true,
        keyboard,
      },
    },
  };
}

async function renderAskFeedback() {
  return {
    text: [
      "Please express your thought, we're listening 🙏",
      "_Hint: use /cancel if you need to start from scratch_",
      "👇 start typing",
    ].join("\n"),
  };
}

const statusMap = {
  none: {
    icon: "⚪",
    desc: "Submitted",
  },
  confirmed: {
    icon: "🟡",
    desc: "The team has acknowleded and is working on it",
  },
  completed: {
    icon: "🟢",
    desc: "Resolved",
  },
};

async function render(ctx: Context, page: number, isMyFeedback: boolean) {
  const profile = await profileApi.getByTelegram(ctx.from?.id.toString() ?? "");
  if (profile.err) throw new Error("Couldn't get profile data");

  const res = await mochiApi.community.listFeedback(
    isMyFeedback ? profile.id : undefined,
    page,
    PAGE_SIZE
  );
  if (!res.ok) return errorUtils.replyData(res.error.message);

  const feedbacks = res.data.data as ModelUserFeedback[];
  const total = res.data.total || 0;

  const lines = [] as string[];
  const title = isMyFeedback ? "📤 *Your feedbacks*" : "📤 *All feedbacks*";
  lines.push(title);
  lines.push("");
  lines.push(
    Object.values(statusMap)
      .map((st) => `${st.icon}: ${st.desc}`)
      .join("\n")
  );
  lines.push("⎯".repeat(5));

  feedbacks.forEach((f: ModelUserFeedback) => {
    let command = f.command || "general";
    command = stringUtils.equal(command, "skip") ? "general" : `/${command}`;
    command = command.replaceAll(/\/+/g, "/");
    command = command.toLowerCase();
    lines.push(
      `${
        statusMap[f.status as keyof typeof statusMap].icon
      } \`${command}\` \\- ${stringUtils.escapeAll(f.feedback ?? "")}`
    );
  });

  const totalPage = Math.ceil(total / PAGE_SIZE);
  const { text: pager } = await fmt.components.pageIndicator({
    page,
    totalPage,
  });
  lines.push(...pager);

  return {
    text: lines.join("\n"),
    options: {
      reply_markup: {
        inline_keyboard: [
          paginationButtons(page, totalPage, true),
          [
            { text: "📝 Add", callback_data: "add_feedback" },
            {
              text: isMyFeedback ? "📥 View All" : "📥 View My Feedbacks",
              callback_data: "TOGGLE_FEEDBACK",
            },
          ],
        ],
      },
    },
    context: {
      page,
      totalPage,
      isMyFeedback,
    },
  };
}

export default {
  feedback: async function (ctx: Context) {
    const { text, context, options } = await render(ctx, 0, true);

    const msg = await ctx.reply(Format.fmt`${text}`, {
      ...options,
      parse_mode: "MarkdownV2",
    });

    route(ctx, msg, machineConfig(context));
  },
};
