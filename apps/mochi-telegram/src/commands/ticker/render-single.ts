import { ChartType, TickerCommandContext } from "./type";
import { renderSingleChart } from "./chart";
import { utils } from "@consolelabs/mochi-formatter";

const CURRENCY = "usd" as const;

export default async function renderSingle({
  baseCoin: coin,
  type,
  days,
}: TickerCommandContext) {
  days = days ?? (type === ChartType.Dominance ? 365 : 30);

  const {
    market_cap,
    total_market_cap,
    current_price,
    price_change_percentage_1h_in_currency,
    price_change_percentage_24h_in_currency,
    price_change_percentage_7d_in_currency,
  } = coin.market_data;
  const current =
    type === ChartType.Dominance
      ? utils.formatPercentDigit(
          (market_cap[CURRENCY] * 100) / total_market_cap[CURRENCY]
        )
      : utils.formatUsdDigit(current_price[CURRENCY]);
  const marketCap = +market_cap[CURRENCY];

  const chartPhoto = await renderSingleChart({
    coinId: coin.id,
    days,
    isDominanceChart: type === ChartType.Dominance,
  });
  // const selectRow = composeDaysSelectMenu(
  //   "change_time_option",
  //   Object.values(
  //     type === ChartType.Dominance
  //       ? DominanceChartViewTimeOption
  //       : ChartViewTimeOption,
  //   ).filter((opt) => typeof opt === "number"),
  //   days,
  // );

  // const wlAdded = await isTickerAddedToWl(coin.id, interaction.user.id);
  // const buttonRow = buildSwitchViewActionRow("ticker", wlAdded);

  const changes = [
    price_change_percentage_1h_in_currency[CURRENCY],
    price_change_percentage_24h_in_currency[CURRENCY],
    price_change_percentage_7d_in_currency[CURRENCY],
  ];
  return {
    photo: chartPhoto,
    text: [
      `*${coin.name}*`,
      `\`Market cap.  \`$${utils.formatDigit({
        value: marketCap,
        shorten: true,
      })} (#${coin.market_cap_rank})`,
      `${
        type === ChartType.Dominance ? `\`Cap (%).     \`` : `\`Price.       \``
      }${current}`,
      `\`Chain.       \`${
        coin.asset_platform?.name || coin.asset_platform?.shortname || coin.name
      }`,
      "⎯".repeat(5),
      utils.mdTable(
        [
          {
            text: "H1",
            val: utils.formatPercentDigit(
              price_change_percentage_1h_in_currency[CURRENCY]
            ),
          },
          {
            text: "D1",
            val: utils.formatPercentDigit(
              price_change_percentage_24h_in_currency[CURRENCY]
            ),
          },
          {
            text: "W1",
            val: utils.formatPercentDigit(
              price_change_percentage_7d_in_currency[CURRENCY]
            ),
          },
        ],
        {
          cols: ["text", "val"],
          row: (f, i) =>
            `${f}${changes[i] === 0 ? "" : changes[i] > 0 ? " 🟢" : " 🔴"}`,
        }
      ),
    ]
      .join("\n")
      .replaceAll("#", "\\#")
      .replaceAll("(", "\\(")
      .replaceAll(")", "\\)"),
  };
}
