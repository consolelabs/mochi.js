import { mochiApi } from "adapters";
import { Context } from "telegraf";
import { stringUtils } from "utils";
import { VERTICAL_BAR } from "constant";
import { MachineConfig, route } from "utils/router";
import { utils } from "@consolelabs/mochi-formatter";

export enum TimeRange {
  H1 = "1h",
  D1 = "24h",
  W1 = "7d",
  Y1 = "1y",
}

const timeRangePropertyMap = {
  [TimeRange.H1]: "usd_1h_change",
  [TimeRange.D1]: "usd_24h_change",
  [TimeRange.W1]: "usd_7d_change",
  [TimeRange.Y1]: "usd_1y_change",
};

const enum Tab {
  Gainer = "gainer",
  Loser = "loser",
}

export const machineConfig: MachineConfig = {
  id: "gainer_loser",
  initial: "gainer_loser",
  context: {
    renderer: {
      gainer_loser: (_tgCxt, ev, ctx) => {
        if (ev === "H1") {
          ctx.timeRange = TimeRange.H1;
        }

        if (ev === "D1") {
          ctx.timeRange = TimeRange.D1;
        }

        if (ev === "W1") {
          ctx.timeRange = TimeRange.W1;
        }

        if (ev === "Y1") {
          ctx.timeRange = TimeRange.Y1;
        }

        if (ev === "GAINER") {
          ctx.tab = "gainer";
        }

        if (ev === "LOSER") {
          ctx.tab = "loser";
        }

        return render(ctx.timeRange, ctx.tab);
      },
    },
    tab: "",
    timeRange: TimeRange.D1,
  },
  states: {
    gainer_loser: {
      on: {
        GAINER: "gainer_loser",
        LOSER: "gainer_loser",
        H1: "gainer_loser",
        D1: "gainer_loser",
        W1: "gainer_loser",
        Y1: "gainer_loser",
      },
    },
  },
};

async function render(timeRange: TimeRange, tab: Tab) {
  const gainerLosers = await mochiApi.defi.getTopGainerLoser(timeRange);

  if (gainerLosers.err) throw new Error("Couldn't get gainerlosers data");
  let data = [];
  if (tab === Tab.Gainer) {
    data = gainerLosers.top_gainers;
  } else {
    data = gainerLosers.top_losers;
  }

  data = data.slice(0, 10);

  data = data.map((d: any) => ({
    ...d,
    symbol: d.symbol.toUpperCase(),
    usd: utils.formatUsdDigit(d.usd),
    usd_1h_change: utils.formatPercentDigit(d.usd_1h_change),
    usd_24h_change: utils.formatPercentDigit(d.usd_24h_change),
    usd_7d_change: utils.formatPercentDigit(d.usd_7d_change),
    usd_1y_change: utils.formatPercentDigit(d.usd_1y_change),
  }));
  const text = utils.mdTable(data, {
    cols: ["name", "symbol", "usd", timeRangePropertyMap[timeRange] as any],
    separator: [VERTICAL_BAR, VERTICAL_BAR, VERTICAL_BAR],
  });

  const lines = [];
  lines.push(
    `_📊 Top ${tab}s \\-\\ viewing in timeframe ${Object.entries(TimeRange)
      .find((e) => e[1] === timeRange)
      ?.at(0)}\\._`
  );
  lines.push("⎯".repeat(5));
  lines.push("");

  if (text.length == 0) {
    lines.push("Not have data\\.");
  } else {
    lines.push(stringUtils.escape(text));
  }

  return {
    text: lines.join("\n"),
    options: {
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🟢 Gainer",
              callback_data: "GAINER",
            },
            {
              text: "🔴 Loser",
              callback_data: "LOSER",
            },
          ],
          [
            {
              text: "H1",
              callback_data: "H1",
            },
            {
              text: "D1",
              callback_data: "D1",
            },
            {
              text: "W1",
              callback_data: "W1",
            },
            {
              text: "Y1",
              callback_data: "Y1",
            },
          ],
        ],
      },
    },
  };
}

export default {
  gainer: async function (ctx: Context) {
    const { text, options } = await render(TimeRange.D1, Tab.Gainer);

    const msg = await ctx.replyWithMarkdownV2(text, options);
    return route(ctx, msg, machineConfig);
  },
  loser: async function (ctx: Context) {
    const { text, options } = await render(TimeRange.D1, Tab.Loser);

    const msg = await ctx.replyWithMarkdownV2(text, options);
    return route(ctx, msg, machineConfig);
  },
};
