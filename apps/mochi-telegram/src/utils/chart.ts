import { utils } from "@consolelabs/mochi-ui";
import { CanvasGradient, createCanvas } from "canvas";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";

const chartCanvas = new ChartJSNodeCanvas({
  width: 700,
  height: 450,
  backgroundColour: "#181925",
});

export function getGradientColor(
  fromColor: string,
  toColor: string
): CanvasGradient {
  const canvas = createCanvas(100, 100);
  const ctx = canvas.getContext("2d");
  const backgroundColor = ctx.createLinearGradient(0, 0, 0, 400);
  backgroundColor.addColorStop(0, fromColor);
  backgroundColor.addColorStop(1, toColor);
  return backgroundColor;
}

export function getChartColorConfig(id?: string) {
  let gradientFrom, gradientTo, borderColor;
  switch (id) {
    case "bitcoin":
      borderColor = "#ffa301";
      gradientFrom = "rgba(159,110,43,0.9)";
      gradientTo = "rgba(76,66,52,0.5)";
      break;
    case "ethereum":
    case "ethereum-pow-iou":
      borderColor = "#a996f2";
      gradientFrom = "rgba(108,136,217,0.9)";
      gradientTo = "rgba(74,93,148,0.5)";
      break;
    case "tether":
      borderColor = "#22a07a";
      gradientFrom = "rgba(46,78,71,0.9)";
      gradientTo = "rgba(48,63,63,0.5)";
      break;
    case "binancecoin" || "terra":
      borderColor = "#f5bc00";
      gradientFrom = "rgba(172,136,41,0.9)";
      gradientTo = "rgba(73,67,55,0.5)";
      break;
    case "solana":
      borderColor = "#9945ff";
      gradientFrom = "rgba(116,62,184,0.9)";
      gradientTo = "rgba(61,53,83,0.5)";
      break;
    default:
      borderColor = "#009cdb";
      gradientFrom = "rgba(53,83,192,0.9)";
      gradientTo = "rgba(58,69,110,0.5)";
  }

  return {
    borderColor,
    backgroundColor: getGradientColor(gradientFrom, gradientTo),
  };
}

export async function renderChartImage({
  chartLabel,
  labels,
  data = [],
  colorConfig,
  lineOnly,
}: {
  chartLabel?: string;
  labels: string[];
  data: number[];
  colorConfig?: {
    borderColor: string;
    backgroundColor: string | CanvasGradient;
  };
  lineOnly?: boolean;
}) {
  if (!colorConfig) {
    colorConfig = {
      borderColor: "#009cdb",
      backgroundColor: getGradientColor(
        "rgba(53,83,192,0.9)",
        "rgba(58,69,110,0.5)"
      ),
    };
  }
  if (lineOnly) {
    colorConfig.backgroundColor = "rgba(0, 0, 0, 0)";
  }
  const xAxisConfig = {
    ticks: {
      font: {
        size: 16,
      },
      color: colorConfig.borderColor,
    },
    grid: {
      borderColor: colorConfig.borderColor,
    },
  };
  const yAxisConfig = {
    ticks: {
      font: {
        size: 16,
      },
      color: colorConfig.borderColor,
      callback: (value: string | number) => {
        const rounded = Number(value).toPrecision(2);
        return rounded.includes("e") && Number(value) < 1
          ? rounded
          : Number(rounded) < 0.01 || Number(rounded) > 1000000
          ? Number(rounded).toExponential()
          : utils.formatUsdDigit(value);
      },
    },
    grid: {
      borderColor: colorConfig.borderColor,
    },
  };
  return await chartCanvas.renderToBuffer({
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: chartLabel,
          data,
          borderWidth: lineOnly ? 10 : 3,
          pointRadius: 0,
          fill: true,
          ...colorConfig,
          tension: 0.2,
        },
      ],
    },
    options: {
      font: {
        family: "Noto Sans",
      },
      scales: {
        y: yAxisConfig,
        x: xAxisConfig,
      },
      plugins: {
        legend: {
          labels: {
            // This more specific font property overrides the global property
            font: {
              family: "Noto Sans",
              size: 18,
            },
          },
        },
      },
      ...(lineOnly && {
        scales: {
          x: {
            grid: {
              display: false,
            },
            display: false,
          },
          y: {
            grid: {
              display: false,
            },
            display: false,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      }),
    },
  });
}
