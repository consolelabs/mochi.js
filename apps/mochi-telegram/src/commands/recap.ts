import { PageSize, Platform, utils } from "@consolelabs/mochi-formatter";
import { payApi, profileApi } from "adapters";
import { APPROX } from "constant";
import { formatUnits } from "ethers";
import { chunk } from "lodash";
import { Context } from "telegraf";
import { stringUtils } from "utils";
import { fmt } from "utils/formatter";
import {
  MachineConfig,
  RouterSpecialAction,
  paginationButtons,
  route,
} from "utils/router";

const machineConfig: (ctx: any) => MachineConfig = (ctx) => ({
  id: "recap",
  initial: "recap",
  context: {
    renderer: {
      recap: (tgCtx, _ev, ctx) => render(tgCtx, ctx.page),
    },
    page: 0,
    totalPage: 0,
    ...ctx,
  },
  states: {
    recap: {
      on: {
        [RouterSpecialAction.JUMP_START]: "recap",
        [RouterSpecialAction.JUMP_END]: "recap",
        [RouterSpecialAction.PREV_PAGE]: "recap",
        [RouterSpecialAction.NEXT_PAGE]: "recap",
      },
    },
  },
});

async function mostSpend(stats: any) {
  const topSpendToken = [
    `*Top ${stats.spending.length} spent token${
      stats.spending.length > 1 ? "s" : ""
    }*`,
    utils.mdTable(
      stats.spending.map((spend: any) => ({
        token: `${utils.formatTokenDigit(
          formatUnits(spend.amount, spend.token.decimal)
        )} ${spend.token.symbol}`,
        amount: utils.formatUsdDigit(spend.usd_amount),
      })),
      {
        cols: ["token", "amount"],
        separator: [` ${APPROX} `],
      }
    ),
  ];

  const [to] = await fmt.account(
    Platform.Telegram,
    stats.most_send?.other_profile_id
  );

  const empty = !stats.spending.length && !to?.value;

  return {
    highlight: `🔹 You sent the most *${stats.most_send?.token.symbol}*${
      to?.value ? ` to ${to.value}` : ""
    }`,
    text: [
      ...(stats.spending.length ? topSpendToken : []),
      ...(empty
        ? [
            "\nMochi couldn't query the data, please contact the team for further support",
          ]
        : []),
    ].join("\n"),
  };
}

async function mostReceive(stats: any) {
  const topReceiveToken = [
    `*Top ${stats.receive.length} received token${
      stats.receive.length > 1 ? "s" : ""
    }*`,
    utils.mdTable(
      stats.receive.map((receive: any) => ({
        token: `${utils.formatTokenDigit(
          formatUnits(receive.amount, receive.token.decimal)
        )} ${receive.token.symbol}`,
        amount: utils.formatUsdDigit(receive.usd_amount),
      })),
      {
        cols: ["token", "amount"],
        separator: [` ${APPROX} `],
      }
    ),
  ];

  const [from] = await fmt.account(
    Platform.Telegram,
    stats.most_receive?.other_profile_id
  );

  const empty = !stats.receive.length && !from?.value;

  return {
    highlight: `🔸 You received most *${stats.most_receive?.token.symbol}*${
      from?.value ? ` from ${from.value}` : ""
    }`,
    text: [
      ...(stats.receive.length ? topReceiveToken : []),
      ...(empty
        ? [
            "\nMochi couldn't query the data, please contact the team for further support",
          ]
        : []),
    ].join("\n"),
  };
}

async function history(stats: any, page: number) {
  const empty = stats.history.length === 0;

  const chunks = chunk(stats.history, PageSize.Standard);
  const { text, totalPage } = await fmt.components.txns({
    on: Platform.Telegram,
    txns: chunks[page] as any[],
    page,
    total: chunks.length,
    withTitle: true,
  });

  return {
    text: [
      ...(empty
        ? [
            "Mochi couldn't query the data, please contact the team for further support",
          ]
        : [stringUtils.escape(text)]),
    ].join("\n"),
    totalPage,
  };
}

async function render(ctx: Context, page: number) {
  const p = await profileApi.getByTelegram(ctx.from?.id.toString() ?? "");
  const stats = await payApi.profile.stats(p.id);
  const isNeg = Math.sign(stats.total_volume) < 0;
  const isPos = Math.sign(stats.total_volume) > 0;

  const { text: spending, highlight: hlSpend } = await mostSpend(stats);
  const { text: receive, highlight: hlReceive } = await mostReceive(stats);
  const { text: historyText, totalPage } = await history(stats, page);

  return {
    context: {
      totalPage,
    },
    text: [
      `*Your last 30 days recap*`,
      "",
      isNeg
        ? "🔴 You spend more than you receive"
        : isPos
        ? "🟢 You receive more than you spend"
        : "Your spend \\= your receive",
      hlSpend,
      hlReceive,
      "",
      "*🔍 Details*",
      utils.mdTable(
        [
          {
            label: "Spending",
            value: utils.formatUsdDigit(+stats.total_spending * -1),
          },
          {
            label: "Receive",
            value: utils.formatUsdDigit(stats.total_receive),
          },
          {
            label: "Net",
            value: utils.formatUsdDigit(stats.total_volume),
          },
        ],
        {
          cols: ["label", "value"],
        }
      ),
      "",
      spending,
      "",
      receive,
      "",
      historyText,
    ].join("\n"),
    options: {
      footer: [
        "/profile to view your Mochi profile",
        "/balance to check assets and recent transactions",
      ],
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [paginationButtons(page, totalPage, true)],
      },
    },
  };
}

function handler() {
  return async function (ctx: Context) {
    const { context, text, options } = await render(ctx, 0);

    const msg = await ctx.replyWithMarkdownV2(text, options);

    route(ctx, msg, machineConfig(context));
  };
}

export default {
  recap: handler(),
};
