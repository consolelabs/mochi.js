import { mochiApi } from "adapters";
import { Context } from "telegraf";
import {
  ChartType,
  ChartViewTimeOption,
  DominanceChartViewTimeOption,
} from "./type";
import renderSingle from "./render-single";
import { stringUtils } from "utils";
import { parseTickerQuery } from "utils/defi";

async function render(base: string) {
  const [baseCoin] = await Promise.all(
    [base].filter(Boolean).map(async (symbol) => {
      const isDominanceChart = symbol.endsWith(".d");
      let ticker = symbol;
      if (isDominanceChart) {
        ticker = symbol.slice(0, -2);
      }
      const coins = await mochiApi.defi.searchCoin(ticker);
      if (!coins || !coins.length) {
        return null;
      }

      let coin = coins.find((coin: any) => coin.most_popular);
      if (!coin) {
        coin = coins.at(0);
      }

      if (!coins || !coins.length) {
        return null;
      }

      const data = mochiApi.defi.getCoin(coin.id, isDominanceChart);
      if (!data) {
        return null;
      }

      return data;
    })
  );
  if (!baseCoin || baseCoin?.error)
    return {
      text: [
        "Unsupported token/fiat",
        "",
        "Please choose a token that is listed on [CoinGecko](https://www.coingecko.com)",
      ].join("\n"),
      photo: undefined,
    };

  const isDominanceChart = base.endsWith(".d");

  const type = isDominanceChart ? ChartType.Dominance : ChartType.Single;
  const days = isDominanceChart
    ? DominanceChartViewTimeOption.Y1
    : ChartViewTimeOption.M1;

  return renderSingle({ baseCoin, days, type });
}

export default {
  ticker: async function (ctx: Context) {
    const args = ctx.state.command.args;
    if (!args.length) {
      await ctx.replyWithMarkdownV2(
        "Please input a token e\\.g\\. `/tick eth`"
      );
      return;
    }
    const defer = ctx.replyWithMarkdownV2("Loading chart, please wait 3\\-4s");
    const query = `${args[0]}${args[1] ? `/${args[1]}` : ""}`;
    const { base } = parseTickerQuery(query);

    const { text, photo } = await render(base);

    if (text) {
      await ctx.replyWithMarkdownV2(stringUtils.escape(text));
    }
    if (photo) {
      ctx
        .replyWithPhoto(photo)
        .then(() => defer)
        .then((msg) => ctx.deleteMessage(msg.message_id));
    } else {
      defer.then((msg) => ctx.deleteMessage(msg.message_id));
    }
  },
};
