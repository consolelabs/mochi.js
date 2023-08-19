import { mochiApi } from "adapters";
import { Context } from "telegraf";
import { VERTICAL_BAR } from "constant";
import { stringUtils, truncate } from "utils";

import {
  route,
  paginationButtons,
  MachineConfig,
  RouterSpecialAction,
} from "utils/router";

import { ModelToken, ResponseGetSupportedTokensResponse } from "types/api";
import { PageSize, utils } from "@consolelabs/mochi-formatter";
import { fmt } from "utils/formatter";

const machineConfig: MachineConfig = {
  id: "tokens",
  initial: "tokens",
  context: {
    renderer: {
      tokens: (_tgCtx, _ev, ctx) => render(ctx.page),
    },
    page: 0,
  },
  states: {
    tokens: {
      on: {
        [RouterSpecialAction.PREV_PAGE]: "tokens",
        [RouterSpecialAction.NEXT_PAGE]: "tokens",
      },
    },
  },
};

async function render(page: number) {
  const res = await mochiApi.defi.getSupportTokens(page, PageSize.Medium);

  const lines = [];
  lines.push("✅ *Supported token list*\n");

  if (!res) {
    lines.push("There is no supported token.");
    return {
      text: stringUtils.escape(lines.join("\n")),
    };
  }

  // Build data supported tokens
  const data = await populateData(res);
  const text = utils.mdTable(data, {
    cols: ["symbol", "address"],
    separator: [VERTICAL_BAR, VERTICAL_BAR],
    alignment: ["left", "left", "left"],
  });

  const totalPage = Math.ceil((res.metadata.total ?? 0) / PageSize.Medium);
  if (text.length == 0) {
    lines.push("There is no supported tokens.");
  } else {
    lines.push("⎯".repeat(5));
    lines.push(stringUtils.escape(text));
    const { text: pager } = await fmt.components.pageIndicator({
      page,
      totalPage,
    });
    lines.push(...pager);
  }

  return {
    text: lines.join("\n"),
    options: {
      reply_markup: {
        inline_keyboard: [
          paginationButtons(page, totalPage),
          [
            {
              text: "Add support for your token",
              callback_data: "ADD_SUPPORT_TOKEN",
            },
          ],
        ],
      },
    },
  };
}

async function populateData(res: ResponseGetSupportedTokensResponse) {
  const dt = res.data || [];
  const tokens = dt.map(async (t: ModelToken) => {
    let symbol = `${t.symbol}`;
    let address = `${t.address}`;
    return {
      symbol: symbol ?? "",
      address: truncate(address ?? ""),
    };
  });

  return Promise.all(tokens);
}

export default {
  tokens: async function (ctx: Context) {
    const { text, options } = await render(0);

    const msg = await ctx.replyWithMarkdownV2(text, options);

    route(ctx, msg, machineConfig);
  },
};
