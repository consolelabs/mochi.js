import { PageSize, utils } from "@consolelabs/mochi-formatter";
import { payApi } from "adapters";
import { chunk } from "lodash";
import { Context } from "telegraf";
import { stringUtils } from "utils";
import { fmt } from "utils/formatter";
import {
  MachineConfig,
  RouterSpecialAction,
  paginationButtons,
  route,
} from "utils/router";

const machineConfig: MachineConfig = {
  id: "chains",
  initial: "chains",
  context: {
    renderer: {
      chains: (_tgCtx, _ev, ctx) => render(ctx.page),
    },
    page: 0,
  },
  states: {
    chains: {
      on: {
        [RouterSpecialAction.PREV_PAGE]: "chains",
        [RouterSpecialAction.NEXT_PAGE]: "chains",
      },
    },
  },
};

async function render(page: number) {
  const res = await payApi.getChains();

  const lines = [];
  lines.push("✅ *Supported chain list*\n");

  if (!res) {
    lines.push("There is no supported chain.");
    return {
      text: stringUtils.escape(lines.join("\n")),
    };
  }
  const chunks = chunk(res.data, PageSize.Medium);

  // Build data supported chains
  const text = utils.mdTable(
    chunks[page].map((c: any) => ({
      symbol: c.symbol || "",
      name: c.name || "",
    })),
    {
      cols: ["symbol", "name"],
      wrapCol: [true, false],
      alignment: ["left", "left"],
    }
  );

  if (text.length == 0) {
    lines.push("There is no supported chains");
  } else {
    lines.push("⎯".repeat(5));
    lines.push(stringUtils.escape(text));
    const { text: pager } = await fmt.components.pageIndicator({
      page,
      totalPage: chunks.length,
    });
    lines.push(...pager);
  }

  const totalPage = chunks.length;
  return {
    text: lines.join("\n"),
    options: {
      reply_markup: {
        inline_keyboard: [
          paginationButtons(page, totalPage),
          [
            {
              text: "Vote for new chain",
              callback_data: "TODO",
            },
          ],
        ],
      },
    },
  };
}

export default {
  chains: async function (ctx: Context) {
    const { text, options } = await render(0);

    const msg = await ctx.replyWithMarkdownV2(text, options);

    route(ctx, msg, machineConfig);
  },
};
