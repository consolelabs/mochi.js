import { utils } from "@consolelabs/mochi-formatter";
import { mochiApi } from "adapters";
import { APPROX, VERTICAL_BAR } from "constant";
import { chunk } from "lodash";
import { Context } from "telegraf";
import {
  MachineConfig,
  RouterSpecialAction,
  paginationButtons,
  route,
} from "utils/router";

const machineConfig: MachineConfig = {
  id: "monikerlist",
  initial: "list",
  context: {
    renderer: {
      list: (_tgCtx, _ev, ctx) => render(ctx.page),
    },
    page: 0,
  },
  states: {
    list: {
      on: {
        [RouterSpecialAction.NEXT_PAGE]: "list",
        [RouterSpecialAction.PREV_PAGE]: "list",
      },
    },
  },
};

async function render(page: number) {
  const { data = [] } = await mochiApi.configDefi.getDefaultMonikers();
  if (!data.length) {
    return {
      text: "No moniker found",
      options: {},
    };
  }

  const paginatedMoniker = chunk(data, 10);
  const monikers = paginatedMoniker[page].map((m) => ({
    moniker: m.moniker?.moniker ?? "NA",
    value: `${
      m.moniker?.amount
    } ${m.moniker?.token?.token_symbol?.toUpperCase()}`,
    price: utils.formatUsdDigit(m.value ?? 0),
  }));

  const text = utils.mdTable(monikers, {
    cols: ["moniker", "value", "price"],
    alignment: ["left", "left", "left"],
    separator: [VERTICAL_BAR, ` ${APPROX} `],
  });

  return {
    text,
    options: {
      reply_markup: {
        inline_keyboard: [paginationButtons(page, paginatedMoniker.length)],
      },
    },
  };
}

export default {
  monikerlist: async function (ctx: Context) {
    const { text, options } = await render(0);

    const msg = await ctx.replyWithMarkdownV2(text, options);

    route(ctx, msg, machineConfig);
  },
};
