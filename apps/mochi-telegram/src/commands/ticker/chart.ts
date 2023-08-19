import { mochiApi } from "adapters";
import { ChartViewTimeOption, DominanceChartViewTimeOption } from "./type";
import { getChartColorConfig, renderChartImage } from "utils/chart";
import { Input } from "telegraf";

export async function renderSingleChart({
  coinId,
  days,
  isDominanceChart,
}: {
  coinId: string;
  days: ChartViewTimeOption | DominanceChartViewTimeOption;
  isDominanceChart: boolean;
}) {
  const currency = "usd";
  const data = await mochiApi.defi.getHistoricalMarketData(
    coinId,
    currency,
    days,
    isDominanceChart
  );
  // if (discordId) {
  //   community.updateQuestProgress({ userId: discordId, action: "ticker" });
  // }
  if (!data) return null;
  const { times, prices, from, to } = data;

  // draw chart
  const chartLabel = `${
    isDominanceChart
      ? "Market cap percentage (%)"
      : `Price (${currency.toUpperCase()})`
  } | ${from} - ${to}`;
  const chart = await renderChartImage({
    chartLabel,
    labels: times,
    data: prices,
    colorConfig: getChartColorConfig(coinId),
  });
  return Input.fromBuffer(chart);
  // if (!getChance(20)) return new MessageAttachment(chart, "chart.png");
  //
  // const container: RectangleStats = {
  //   x: { from: 0, to: 900 },
  //   y: { from: 0, to: 600 },
  //   w: 900,
  //   h: 600,
  //   radius: 0,
  //   bgColor: "rgba(0, 0, 0, 0)",
  // };
  // const canvas = createCanvas(container.w, container.h);
  // const ctx = canvas.getContext("2d");
  // drawRectangle(ctx, container, container.bgColor);
  // // chart
  // const chartImg = await loadImage(chart);
  // ctx.drawImage(
  //   chartImg,
  //   container.x.from,
  //   container.y.from,
  //   container.w - 75,
  //   container.h,
  // );
  //
  // // bull/bear
  // const isAsc = prices[prices.length - 1] >= prices[0];
  // const leftObj = await loadImage(
  //   `assets/images/${isAsc ? "blul" : "bera"}1.png`,
  // );
  // ctx.drawImage(leftObj, container.x.from, container.y.to - 230, 130, 230);
  // const rightObj = await loadImage(
  //   `assets/images/${isAsc ? "blul" : "bera"}2.png`,
  // );
  // ctx.drawImage(rightObj, container.x.to - 130, container.y.to - 230, 130, 230);
  //
  // return new MessageAttachment(canvas.toBuffer(), "chart.png");
}
