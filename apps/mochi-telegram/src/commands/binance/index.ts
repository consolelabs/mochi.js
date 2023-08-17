import { mochiApi, profileApi } from "adapters";
import { Context } from "telegraf";
import { errorUtils, stringUtils } from "utils";
import {
  MachineConfig,
  RouterSpecialAction,
  paginationButtons,
  route,
} from "utils/router";
import {
  ResponseBinanceFuturePositionInformation,
  ResponseBinanceFuturePositionInfo,
} from "types/api";
import { VERTICAL_BAR } from "constant";
import { chunk } from "lodash";
import { utils } from "@consolelabs/mochi-formatter";
import { fmt } from "utils/formatter";

function filterPositions(
  positions: ResponseBinanceFuturePositionInfo[] | undefined
) {
  if (!positions) return [];
  return positions.filter((i) => parseFloat(i.positionAmt || "0") !== 0);
}

function formatBinanceAmount(val: string | undefined | number) {
  if (!val) return "$0";
  return utils.formatUsdDigit(val);
}

export const machineConfig: (ctx: any) => MachineConfig = (ctx = {}) => ({
  id: "binance",
  initial: "binance",
  context: {
    renderer: {
      binance: (tgCxt) => render(tgCxt),
      selectedAccount: (tgCxt, ev, ctx) => {
        if (ev.startsWith("BA_")) {
          return renderSelectedAccount(
            tgCxt,
            ev.replace("BA_", ""),
            ctx.page,
            ctx.isShowLiquidationPrice
          );
        }
        if (ev === "TOGGLE_LIQUIDATION_PRICE") {
          return renderSelectedAccount(
            tgCxt,
            ctx.selectedApiKey,
            ctx.page,
            !ctx.isShowLiquidationPrice
          );
        }

        return renderSelectedAccount(
          tgCxt,
          ctx.selectedApiKey,
          ctx.page,
          ctx.isShowLiquidationPrice
        );
      },
    },
    page: 0,
    selectedApiKey: null,
    isShowLiquidationPrice: false,
    ...ctx,
  },
  states: {
    binance: {
      on: [
        {
          event: "*",
          target: "selectedAccount",
          cond: (_ctx, ev) => (ev.type || "").startsWith("BA_"),
        },
      ],
    },
    selectedAccount: {
      on: {
        [RouterSpecialAction.BACK]: "binance",
        [RouterSpecialAction.NEXT_PAGE]: "selectedAccount",
        [RouterSpecialAction.PREV_PAGE]: "selectedAccount",
        TOGGLE_LIQUIDATION_PRICE: "selectedAccount",
      },
    },
  },
});

const PAGE_SIZE = 10 as const;

async function render(ctx: Context) {
  const profile = await profileApi.getByTelegram(ctx.from?.id.toString() ?? "");
  if (profile.err) throw new Error("Couldn't get profile data");

  const res = await mochiApi.users.cex.binance.futurePositions(profile.id);
  if (!res.ok) return errorUtils.replyData(res.error.message);

  const binanceAccounts =
    res.data as ResponseBinanceFuturePositionInformation[];

  const lines = [] as string[];
  const title = "👤 *Your Binance Accounts*\n";
  lines.push(title);

  const accountData = [
    { apiKey: "API Key", positionCount: "Position Count" },
    ...binanceAccounts.map((account) => ({
      apiKey: account.apiKey || "",
      positionCount: filterPositions(account.positions).length ?? 0,
    })),
  ];

  const text = utils.mdTable(accountData, {
    cols: ["apiKey", "positionCount"],
    separator: [VERTICAL_BAR],
  });

  lines.push(text);
  lines.push(`\n👇 Click button to view position details`);

  return {
    text: stringUtils.escape(lines.join("\n")),
    options: {
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          binanceAccounts.map(
            (a: ResponseBinanceFuturePositionInformation) => ({
              text: a.apiKey || "",
              callback_data: "ba_" + (a.apiKey || ""),
            })
          ),
        ],
      },
    },
    context: {},
  };
}

async function renderSelectedAccount(
  ctx: Context,
  selectedApiKey: string,
  page = 0,
  isShowLiquidationPrice = false
) {
  const profile = await profileApi.getByTelegram(ctx.from?.id.toString() ?? "");
  if (profile.err) throw new Error("Couldn't get profile data");

  const res = await mochiApi.users.cex.binance.futurePositions(profile.id);
  if (!res.ok) return errorUtils.replyData(res.error.message);

  const lines = [];

  const binanceAccounts =
    res.data as ResponseBinanceFuturePositionInformation[];

  const selectedAccount = binanceAccounts.find(
    (a: ResponseBinanceFuturePositionInformation) =>
      a.apiKey?.toLowerCase() === selectedApiKey?.toLowerCase()
  );

  if (!selectedAccount) {
    return {
      text: stringUtils.escape(`No Binance account found!`),
      options: {},
      context: {
        page,
      },
    };
  }

  lines.push(`💵 *${selectedAccount.apiKey} Position Details*`);

  const positions = await Promise.all(
    filterPositions(selectedAccount.positions).map(
      async (p: ResponseBinanceFuturePositionInfo) => {
        const volume =
          parseFloat(p.positionAmt || "0") * parseFloat(p.entryPrice || "0");
        const { text: pnl } = await fmt.components.pnl({
          pnl: (parseFloat(p.unRealizedProfit || "0") / Math.abs(volume)) * 100,
        });
        return {
          volume: `${formatBinanceAmount(volume)} (x${p.leverage})`,
          liquidationPrice: formatBinanceAmount(p.liquidationPrice),
          symbol: p.symbol || "",
          pnlIcon: pnl,
          pnl: formatBinanceAmount(p.unRealizedProfit),
        };
      }
    )
  );

  if (positions.length === 0) {
    return {
      text: stringUtils.escape(
        `No position in *${selectedAccount.apiKey}* found!`
      ),
      options: {},
      context: {
        page,
      },
    };
  }

  const paginatedPositions = chunk(positions, PAGE_SIZE)[page];

  const positionData = [
    {
      symbol: "Symbol",
      volume: "Volume",
      pnl: "PnL",
      liquidationPrice: "Liq. price",
    },
    ...paginatedPositions,
  ];

  const text = utils.mdTable(positionData, {
    cols: isShowLiquidationPrice
      ? ["symbol", "liquidationPrice", "pnl"]
      : ["symbol", "volume", "pnl"],
    separator: [VERTICAL_BAR, VERTICAL_BAR],
    alignment: ["left", "right", "right"],
    row: (f, i) => {
      if (i === 0) return f;
      return `${f} ${paginatedPositions[i - 1].pnlIcon}`.trim();
    },
  });

  lines.push(text);

  return {
    text: stringUtils.escape(lines.join("\n")),
    options: {
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          paginationButtons(
            page,
            Math.ceil((positions.length || 0) / PAGE_SIZE)
          ),
          [
            {
              text: isShowLiquidationPrice
                ? "View Volume"
                : "View Liquidation Price",
              callback_data: "TOGGLE_LIQUIDATION_PRICE",
            },
          ],
        ],
      },
    },
    context: {
      page,
      selectedApiKey,
      isShowLiquidationPrice,
    },
  };
}

export default {
  binance: async function (ctx: Context) {
    const { text, context, options } = await render(ctx);

    const msg = await ctx.replyWithMarkdownV2(text, options);

    route(ctx, msg, machineConfig(context));
  },
};
