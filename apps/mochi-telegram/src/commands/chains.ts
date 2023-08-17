import { PageSize, utils } from "@consolelabs/mochi-formatter";
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
import { rest } from "../../api";

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
  const { ok, data } = await rest.pay.chains.getSupported();

  const lines = [];
  lines.push("✅ *Supported chain list*\n");

  if (!ok) {
    lines.push("There is no supported chain.");
    return {
      text: stringUtils.escape(lines.join("\n")),
    };
  }
  const chunks = chunk(data, PageSize.Medium);

  // Build data supported chains
  const text = utils.mdTable(
    chunks[page].map((c: any) => ({
      symbol: c.symbol || "",
      name: c.name || "",
    })),
    {
      cols: ["symbol", "name"],
      wrapLastCol: false,
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
