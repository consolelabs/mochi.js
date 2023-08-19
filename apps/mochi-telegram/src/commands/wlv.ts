import { mochiApi, profileApi } from "adapters";
import { Context } from "telegraf";
import { groupBy } from "lodash";
import { stringUtils } from "utils";
import { VERTICAL_BAR } from "constant";
import {
  MachineConfig,
  RouterSpecialAction,
  paginationButtons,
  route,
} from "utils/router";
import { utils } from "@consolelabs/mochi-formatter";

function sortPrice(dir: 1 | -1 = 1) {
  return function (a: any, b: any) {
    const result =
      Math.abs(b.price_change_percentage_24h ?? 0) -
      Math.abs(a.price_change_percentage_24h ?? 0);

    return (result >= 0 ? 1 : -1) * dir;
  };
}

const PAGE_SIZE = 16 as const;

export const machineConfig: MachineConfig = {
  id: "watchlist",
  initial: "watchlist",
  context: {
    renderer: {
      watchlist: (tgCxt, _ev, ctx) => render(tgCxt, ctx.page),
    },
    page: 0,
  },
  states: {
    watchlist: {
      on: {
        [RouterSpecialAction.NEXT_PAGE]: "watchlist",
        [RouterSpecialAction.PREV_PAGE]: "watchlist",
      },
    },
  },
};

async function render(ctx: Context, page: number) {
  const profile = await profileApi.getByTelegram(ctx.from?.id.toString() ?? "");
  if (profile.err) throw new Error("Couldn't get profile data");

  const data = await mochiApi.users.getUserWatchlist(profile.id, page);

  let { data: tokenData, metadata } = data;

  const group = groupBy(tokenData, (t) =>
    Math.sign(t.price_change_percentage_24h ?? 0)
  );
  group[1] = group[1]?.sort(sortPrice(1)) ?? [];
  group["-1"] = group["-1"]?.sort(sortPrice(-1)) ?? [];

  tokenData = [...group[1], ...(group[0] ?? []), ...group[-1]];
  const text = utils.mdTable(
    tokenData.map((t: any) => {
      const price = t.current_price ?? 0;
      const priceChange = t.price_change_percentage_24h ?? 0;
      return {
        symbol: (t.symbol ?? "").toUpperCase(),
        priceChange: utils.formatPercentDigit(priceChange),
        usd: utils.formatUsdDigit(price),
      };
    }),
    {
      cols: ["symbol", "usd", "priceChange"],
      separator: [VERTICAL_BAR, VERTICAL_BAR],
      row: (f, i) =>
        `${f} ${
          (tokenData[i].price_change_percentage_24h ?? 0) < 0 ? "🔴" : "🟢"
        }`,
    }
  );

  const lines = [];
  lines.push("📊 *Watchlist*");
  lines.push("_All changes are in D1, sorted by price change_");
  lines.push("");

  lines.push(stringUtils.escape(text));

  return {
    text: lines.join("\n"),
    options: {
      reply_markup: {
        inline_keyboard: [
          paginationButtons(
            page,
            Math.ceil((metadata?.total || 0) / PAGE_SIZE)
          ),
        ],
      },
    },
  };
}

export default {
  wlv: async function (ctx: Context) {
    const { text, options } = await render(ctx, 0);

    const msg = await ctx.replyWithMarkdownV2(text, options);

    route(ctx, msg, machineConfig);
  },
};
