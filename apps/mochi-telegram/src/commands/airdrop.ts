import { utils } from "@consolelabs/mochi-formatter";
import { mochiApi, profileApi } from "adapters";
import { APPROX } from "constant";
import ms from "ms";
import { Sentry } from "services/sentry";
import { Context } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { errorUtils, stringUtils } from "utils";
import {
  parseAmount,
  parseDuration,
  parseMaxEntries,
  parseSymbol,
  validateSymbol,
  checkBalance,
  checkTokenDecimal,
} from "utils/defi";
import { pipe } from "utils/functions";
import { MachineConfig, route } from "utils/router";

// currently airdrops that are happening
const airdrops = new Map<
  string,
  {
    users: Map<string, string>;
    author_id: string;
  }
>();

// this is to prevent case where airdrop for N people
// and when the max entries is reach the button is still clickable
// so that the transfer function can be called multiple time
const lockEndAirdrop = new Set<string>();

const machineConfig: (ctx: any) => MachineConfig = (ctx) => ({
  id: "airdrop",
  initial: "confirm",
  context: {
    renderer: {
      renderAirdrop,
      endAirdrop,
      cancelAirdrop,
    },
    ...ctx,
  },
  states: {
    confirm: {
      on: {
        START_AIRDROP: "renderAirdrop",
        CANCEL_AIRDROP: "cancelAirdrop",
      },
    },
    renderAirdrop: {
      after: {
        DURATION: "endAirdrop",
      },
      on: {
        ENTER_AIRDROP: {
          target: "renderAirdrop",
          internal: true,
        },
      },
    },
    cancelAirdrop: {
      type: "final",
    },
    endAirdrop: {
      type: "final",
    },
  },
});

function renderInfo(
  title: string,
  ctx: {
    author: string;
    amount: number;
    symbol: string;
    maxEntries: number;
    endAt?: number;
    durationMs: number;
    users?: Map<string, string>;
    amount_each?: string;
    all: boolean;
  },
  state: "start" | "running" | "end"
) {
  const lines = [];
  lines.push(title);
  lines.push("⎯".repeat(5));
  lines.push(`\`Author.      \`${ctx.author ? `@${ctx.author}` : "anonymous"}`);
  const amountStr = `*${
    ctx.all ? "all" : ctx.amount
  } ${ctx.symbol.toUpperCase()}*`;
  lines.push(`\`Amount.      \`${amountStr}`);
  const users = Array.from(ctx.users?.values() ?? []);
  if (stringUtils.equal(state, "running")) {
    lines.push(
      `\`Ends.        \`in ${ms(Math.max((ctx.endAt ?? 0) - Date.now(), 0), {
        long: true,
      })}`
    );
  } else if (stringUtils.equal(state, "start")) {
    lines.push(`\`Duration.    \`${ms(ctx.durationMs, { long: true })}`);
  } else {
    lines.push(`\`Duration.    \`${ms(ctx.durationMs, { long: true })}`);
    if (users.length) {
      lines.push(`\`Winners.     \`${users.map((u) => `@${u}`).join(", ")}`);
    } else {
      lines.push(`\`Winners.     \`No one joined`);
    }
  }

  if (ctx.maxEntries > 0) {
    lines.push(`\`Max entries. \`${ctx.maxEntries}`);
    if (stringUtils.equal(state, "running")) {
      lines.push("");
      lines.push(
        "🔹 airdrop ends when either time runs out or no more people can join"
      );
    }
  }

  if (stringUtils.equal(state, "end") && users.length) {
    lines.push("");
    lines.push(
      `🔸 each received ${APPROX} *${utils.formatTokenDigit(
        ctx.amount_each ?? "0"
      )} ${ctx.symbol.toUpperCase()}*`
    );
  }

  return stringUtils.escape(lines.join("\n"));
}

async function cancelAirdrop(_tgCtx: Context, _ev: string, ctx: any) {
  return {
    text: renderInfo("🤷 *Airdrop canceled*", ctx, "start"),
  };
}

async function endAirdrop(tgCtx: Context, _ev: string, ctx: any) {
  const airdrop = airdrops.get(ctx.msgId);
  let users = Array.from(airdrop?.users.entries() ?? []);

  const context = ctx;

  if (context.maxEntries > 0) {
    users = users.slice(0, context.maxEntries);
  }

  context.users = airdrop?.users;

  const [authorProfile, ...joinerProfiles] = await Promise.all([
    profileApi.getByTelegram(airdrop?.author_id ?? ""),
    ...users.map(async (user) => profileApi.getByTelegram(user[0])),
  ]);
  let data;

  if (joinerProfiles.length) {
    data = await mochiApi.tip.transferV2({
      sender: String(authorProfile.id),
      recipients: joinerProfiles.map((p) => String(p.id)),
      amount: context.amount,
      amount_string: utils.formatDigit({
        value: String(context.amount),
        fractionDigits: context.token?.decimal ?? 0,
      }),
      token: context.symbol,
      token_price: context.token?.price,
      each: false,
      all: context.all,
      transfer_type: "airdrop",
      chain_id: context.token?.chain?.chain_id,
      decimal: context.token?.decimal ?? 0,
      platform: "telegram",
    });

    context.amount_each = data.amount_each;
  }

  const text = renderInfo("🛬 *Airdrop has ended*", context, "end");

  airdrops.delete(context.msgId);
  lockEndAirdrop.delete(context.msgId);

  if (airdrop?.author_id) {
    tgCtx.telegram
      .sendMessage(
        airdrop?.author_id,
        tgCtx.state.chat?.username
          ? `Hello, your airdrop in [${stringUtils.escape(
              tgCtx.state.chat.username
            )}](https://t.me/${stringUtils.escape(tgCtx.state.chat.username)}/${
              context.msgId
            }) has just ended`
          : `Hello, one of your airdrop has just ended`,
        { parse_mode: "MarkdownV2", disable_web_page_preview: true }
      )
      .catch((e) =>
        Sentry.captureException(e, {
          tags: {
            command: tgCtx.state.command.raw,
          },
        })
      );
  }

  Promise.allSettled(
    users.map((u) => {
      return tgCtx.telegram.sendMessage(
        u[0],
        stringUtils.escape(
          `Hi, you just got ${APPROX} *${utils.formatTokenDigit(
            context.amount_each
          )} ${context.symbol.toUpperCase()}* from an airdrop${
            tgCtx.state.chat?.username
              ? ` in [${stringUtils.escape(
                  tgCtx.state.chat.username
                )}](https://t.me/${stringUtils.escape(
                  tgCtx.state.chat.username
                )}/${context.msgId})`
              : ""
          }`
        ),
        { parse_mode: "MarkdownV2", disable_web_page_preview: true }
      );
    })
  ).then((results) => {
    for (let res of results) {
      if (res.status === "fulfilled") continue;
      Sentry.captureException(new Error(res.reason), {
        tags: {
          command: tgCtx.state.command.raw,
        },
      });
    }
  });

  return {
    text,
  };
}

async function renderAirdrop(tgCtx: Context, ev: string, ctx: any) {
  const update = tgCtx.update as Update.CallbackQueryUpdate;
  let airdrop = airdrops.get(ctx.msgId);
  if (stringUtils.equal(ev, "enter_airdrop")) {
    const joiner = update.callback_query.from;
    if (
      airdrop &&
      !stringUtils.equal(joiner.id.toString(), airdrop.author_id)
    ) {
      if (
        ctx.maxEntries <= 0 ||
        (ctx.maxEntries > 0 && airdrop.users.size < ctx.maxEntries)
      ) {
        if (!airdrop.users.has(joiner.id.toString())) {
          tgCtx.reply(`@${joiner.username} joined!`);
        }
        // valid user
        airdrop.users.set(joiner.id.toString(), joiner.username ?? "");
      }
    }
  } else if (stringUtils.equal(ev, "start_airdrop")) {
    airdrop = {
      users: new Map<string, string>(),
      author_id: update.callback_query.from.id.toString(),
    };
    airdrops.set(ctx.msgId, airdrop);
  }

  const limit = ctx.maxEntries;
  const hasLimit = limit > 0;

  const context = {
    ...ctx,
    ...(ctx.endAt ? {} : { endAt: Date.now() + ctx.durationMs }),
  };

  if (
    ctx.maxEntries > 0 &&
    (airdrop?.users.size ?? 0) >= ctx.maxEntries &&
    !lockEndAirdrop.has(context.msgId)
  ) {
    lockEndAirdrop.add(context.msgId);
    return endAirdrop(tgCtx, "", context);
  }

  return {
    context,
    text: renderInfo("🛫 *New airdrop*", context, "running"),
    options: {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `Join${
                hasLimit
                  ? ` (${limit - (airdrop?.users.size ?? 0)} slots left)`
                  : ""
              }`,
              callback_data: "enter_airdrop",
            },
          ],
        ],
      },
    },
  };
}

async function confirm(
  author: string,
  amount: number,
  symbol: string,
  durationMs: number,
  // -1 == unlimited, ends when time runs out
  maxEntries = -1,
  all = false
) {
  const context = {
    author,
    amount,
    durationMs,
    maxEntries,
    symbol,
    all,
  };

  return {
    context,
    text: renderInfo("❔ *Confirm airdrop*", context, "start"),
    options: {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "✅ Confirm",
              callback_data: "start_airdrop",
            },
            {
              text: "❌ Cancel",
              callback_data: "cancel_airdrop",
            },
          ],
        ],
      },
    },
  };
}

export default {
  airdrop: async function (ctx: Context) {
    const args = ctx.state.command.args;
    const amount = args[0];
    const symbol = String(args[1]);
    const rest = args.slice(2) as string[];

    if ((ctx.chat?.id ?? 0) >= 0) {
      await ctx.replyWithMarkdownV2(
        "🦗 You've gotta be kidding right? \\*cricket\\*"
      );
      return;
    }

    if (!amount || !symbol) {
      await ctx.replyWithMarkdownV2(
        [
          "Please enter full command e\\.g\\. `/airdrop 1 eth`",
          "_`in` \\= how long, `for` \\= how many people can join this airdrop_ e\\.g\\. `/airdrop 1 eth in 10m for 20`",
        ].join("\n")
      );
      return;
    }

    // validation
    pipe(
      {
        amount,
        symbol,
        maxEntries: -1,
        durationMs: 5 * 60 * 1000,
        rest,
        token: {} as Record<string, any>,
        all: false,
      },
      validateSymbol(), // is there a token?
      // +==============+
      parseAmount(ctx), // is the amount within decimal range?
      parseSymbol(), // is this token supported by Mochi?
      parseDuration(), // is the duration valid?
      parseMaxEntries(), // is the max entries valid?
      // +==============+
      checkBalance(ctx), // does the author have enough balance of this token?
      checkTokenDecimal() // check token decimal within allow range
    )
      .then(async (payload) => {
        // all params validated, proceed
        const { context, text, options } = await confirm(
          ctx.from?.username ?? "",
          payload.amount,
          payload.symbol,
          payload.durationMs,
          payload.maxEntries,
          payload.all
        );

        const msg = await ctx.replyWithMarkdownV2(text, options);

        route(ctx, msg, machineConfig({ ...payload, ...context }), {
          delays: {
            DURATION: (ctx) => ctx.durationMs,
          },
        });
      })
      .catch((e) => {
        const { text, options } = errorUtils.replyData(e.message);
        ctx.reply(text, options);
      });
  },
};
