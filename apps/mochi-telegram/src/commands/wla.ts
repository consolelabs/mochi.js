import { mochiApi, profileApi } from "adapters";
import { Context } from "telegraf";
import { errorUtils, stringUtils } from "utils";
import { VERTICAL_BAR } from "constant";
import { MachineConfig, route } from "utils/router";
import { parseTickerQuery } from "utils/defi";
import {
  ModelCoingeckoSupportedTokens,
  ResponseAddToWatchlistResponseData,
} from "types/api";
import { utils } from "@consolelabs/mochi-formatter";

export const machineConfig: MachineConfig = {
  id: "wla",
  initial: "wla",
  context: {
    renderer: {
      wla: (tgCxt) => render(tgCxt),
      selectedToken: (tgCxt, ev) =>
        renderSelectedToken(tgCxt, ev.replace("WLA_", "")),
    },
  },
  states: {
    wla: {
      on: [
        {
          event: "*",
          target: "selectedToken",
          cond: (_ctx, ev) => (ev.type || "").startsWith("WLA_"),
        },
      ],
    },
    selectedToken: {},
  },
};

export async function addUserWatchlist(
  profileId: string,
  symbol: string,
  coinId = ""
) {
  const { isFiat, base, target } = parseTickerQuery(symbol);
  if (isFiat) symbol = `${base}/${target}`;

  const res = await mochiApi.users.trackToken({
    profile_id: profileId,
    symbol: symbol.toLowerCase(),
    coin_gecko_id: coinId.toLowerCase(),
    is_fiat: isFiat,
  });
  return res;
}

export async function addWatchlistToken({
  symbols,
  originSymbols,
  profileId,
}: {
  originSymbols: string[];
  symbols: string[];
  profileId: string;
}) {
  const symbolString = (symbols: string[]) => {
    return symbols
      .map(function (s) {
        return s.toUpperCase();
      })
      .join(" ");
  };

  const tables = [] as string[];

  for (const [, symbol] of symbols.entries()) {
    let res = await addUserWatchlist(profileId, symbol);
    if (!res.ok) return errorUtils.replyData(res.error.message);
    let data = res.data as ResponseAddToWatchlistResponseData;
    if (!data.base_coin) {
      res = await addUserWatchlist(
        profileId,
        symbol,
        data.base_suggestions?.find((c) => c.most_popular)?.id
      );
      if (!res.ok) return errorUtils.replyData(res.error.message);
      data = res.data as ResponseAddToWatchlistResponseData;
    }
    const priceChangePercentage =
      data.base_coin?.market_data?.price_change_percentage_24h ?? 0;
    const isUp = Math.sign(priceChangePercentage) === 1;
    const price = data.base_coin?.market_data?.current_price?.usd ?? 0;

    const text = utils.mdTable(
      [
        {
          symbol: (symbol || "").toUpperCase(),
          priceChange: utils.formatPercentDigit(priceChangePercentage),
          usd: utils.formatUsdDigit(price),
        },
      ],
      {
        cols: ["symbol", "usd", "priceChange"],
        separator: [VERTICAL_BAR, VERTICAL_BAR],
        row: (f) => `${f} ${isUp ? "🟢" : "🔴"}`,
      }
    );

    tables.push(text);

    const { base_suggestions, target_suggestions } = data;
    if (!base_suggestions && !target_suggestions) continue;
    if (!(base_suggestions || []).length && !(target_suggestions || []).length)
      continue;

    // allow selection
    let tokens = [];
    if (!target_suggestions) {
      tokens = (base_suggestions || []).map(
        (b: ModelCoingeckoSupportedTokens, i: number) => ({
          index: i + 1,
          name: b.name || "",
          symbol: (b.symbol || "").toUpperCase(),
          value: `wla_${b.symbol}_${b.id}_${profileId}`,
        })
      );
    } else {
      tokens = (base_suggestions || [])
        .map((b: ModelCoingeckoSupportedTokens, bi: number) =>
          target_suggestions.map(
            (t: ModelCoingeckoSupportedTokens, ti: number) => ({
              index: bi * target_suggestions.length + ti + 1,
              name: `${b?.name || ""}/${t.name}`,
              symbol: `${(b?.symbol || "").toUpperCase()}/${(
                t.symbol || ""
              ).toUpperCase()}`,
              value: `wla_${b?.symbol || ""}/${t.symbol}_${b?.id || ""}/${
                t.id
              }_${profileId}`,
            })
          )
        )
        .flat();
    }

    const tokenJoined = utils.mdTable(tokens, {
      cols: ["index", "name", "symbol"],
      separator: [VERTICAL_BAR, VERTICAL_BAR],
    });

    return {
      text: stringUtils.escape(
        [
          `*Multiple results found*`,
          `We're not sure which \`${symbol.toUpperCase()}\`, select one:`,
          tokenJoined,
        ].join("\n")
      ),
      options: {
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            tokens.map((t: any) => ({
              text: t.index,
              callback_data: t.value,
            })),
          ],
        },
      },
    };
  }

  return {
    text: stringUtils.escape(
      [
        `✅ *${symbolString(originSymbols)} has been added to the watchlist*`,
        `👉 View watchlist with /wlv`,
        `👉 To remove, use \`/wlr ${symbolString(originSymbols)}\`\n`,
        tables.join("\n"),
      ].join("\n")
    ),
  };
}

async function render(ctx: Context) {
  let symbols = ctx.state.command.args;
  if (symbols.length === 0) {
    return {
      text: stringUtils.escape(
        "Please provide a token symbol. Example: `/wla btc` or `/wla eth/btc`"
      ),
      options: {},
    };
  }
  const profile = await profileApi.getByTelegram(ctx.from?.id.toString() ?? "");
  if (profile.err) throw new Error("Couldn't get profile data");

  const { text, options } = await addWatchlistToken({
    symbols,
    originSymbols: symbols,
    profileId: profile.id,
  });

  return {
    text,
    options,
  };
}

async function renderSelectedToken(ctx: Context, selectedToken: string) {
  const profile = await profileApi.getByTelegram(ctx.from?.id.toString() ?? "");
  if (profile.err) throw new Error("Couldn't get profile data");

  const [symbol, coinId, profileId] = selectedToken.split("_");
  try {
    await addUserWatchlist(profileId, symbol, coinId);
  } catch (_error) {
  } finally {
    return {
      text: stringUtils.escape(
        [
          `✅ *${symbol.toUpperCase()} has been added to the watchlist*`,
          `👉 View watchlist with /wlv`,
          `👉 To remove, use \`/wlr ${symbol.toUpperCase()}\`\n`,
        ].join("\n")
      ),
      options: {},
    };
  }
}

export default {
  wla: async function (ctx: Context) {
    const { text, options } = await render(ctx);

    const msg = await ctx.replyWithMarkdownV2(text, options);

    route(ctx, msg, machineConfig);
  },
};
