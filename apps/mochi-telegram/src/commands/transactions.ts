import { Platform } from "@consolelabs/mochi-formatter";
import { payApi, profileApi } from "adapters";
import { Context } from "telegraf";
import { stringUtils } from "utils";
import { fmt } from "utils/formatter";
import {
  MachineConfig,
  RouterSpecialAction,
  paginationButtons,
  route,
} from "utils/router";

const machineConfig: (ctx: any) => MachineConfig = (ctx) => ({
  id: "transactions",
  initial: "txns",
  context: {
    renderer: {
      txns: (tgCtx, _ev, ctx) => render(tgCtx, ctx.action, ctx.page),
    },
    page: 0,
    ...ctx,
  },
  states: {
    txns: {
      on: {
        [RouterSpecialAction.PREV_PAGE]: "txns",
        [RouterSpecialAction.NEXT_PAGE]: "txns",
        [RouterSpecialAction.JUMP_START]: "txns",
        [RouterSpecialAction.JUMP_END]: "txns",
      },
    },
  },
});

async function render(ctx: Context, action: string, page = 0) {
  const from = ctx.from?.id.toString();
  const p = await profileApi.getByTelegram(from ?? "");

  const txns = await payApi.profile.getOffchainTxns(p.id, action, page);

  const { text, totalPage } = await fmt.components.txns({
    txns: txns.data as any[],
    on: Platform.Telegram,
    total: txns.pagination.totalPage,
    page,
    groupDate: true,
    withTitle: true,
  });

  return {
    context: { action, totalPage },
    text: stringUtils.escape(text),
    options: {
      footer: [
        "Use `/tx tip` to filter by actions, other available actions are",
        "`withdraw`, `deposit`",
      ],
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [paginationButtons(page, totalPage, true)],
      },
    },
  };
}

const argToActionMap = {
  tip: "transfer",
  transfer: "transfer",
  deposit: "deposit",
  withdraw: "withdraw",
  airdrop: "airdrop",
};

async function dispatch(ctx: Context) {
  const arg = ctx.state.command.args.at(0) as keyof typeof argToActionMap;
  const action = argToActionMap[arg] ?? "";

  const { context, text, options } = await render(ctx, action);

  const msg = await ctx.replyWithMarkdownV2(text, options);

  route(ctx, msg, machineConfig(context));
}

export default {
  transactions: dispatch,
  transaction: dispatch,
  tx: dispatch,
  txn: dispatch,
  txns: dispatch,
  history: dispatch,
};
