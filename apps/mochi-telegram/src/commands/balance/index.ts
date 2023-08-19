import { Context } from "telegraf";
import { MachineConfig, RouterSpecialAction, route } from "utils/router";
import { getOffchainAssets, renderData } from "./processor";
import api from "api";

export const machineConfig: (initial?: string) => MachineConfig = (
  initial = "balance"
) => ({
  id: "balance",
  initial,
  context: {
    renderer: {
      balance: (tgCtx, _ev, ctx) => render(tgCtx, ctx.page, !!ctx.initial),
    },
    page: 0,
    initial,
  },
  states: {
    askConnect: {
      on: {
        PROCEED: "balance",
      },
    },
    balance: {
      on: {
        [RouterSpecialAction.PREV_PAGE]: "balance",
        [RouterSpecialAction.NEXT_PAGE]: "balance",
      },
    },
  },
});

async function render(ctx: Context, page: number, force = false) {
  const profile = await api.profile.telegram.getById({
    telegramId: ctx.from?.id.toString() ?? "",
  });
  if (!profile.ok) throw new Error("Couldn't get profile data");

  const [inAppWallets, assets, txns] = await Promise.all([
    api.pay.mochiWallet.getWallets(profile.data.id),
    getOffchainAssets(profile.data.id),
    api.pay.profile.getTransactions({ profileId: profile.data.id }),
  ]);
  if (!inAppWallets.ok) throw new Error("Cannot get list wallets");
  if (!txns.ok) throw new Error("Cannot get list transactions");

  const wallets = inAppWallets.data.map((w: any) => ({
    address: w.wallet_address,
    chain: w.chain.symbol,
  }));

  return await renderData(ctx, page, force, {
    profile,
    wallets,
    assets,
    txns: txns.data,
    onchain: false,
  });
}

export default {
  balance: async (ctx: Context) => {
    const { initial, text, options } = await render(ctx, 0);

    const msg = await ctx.replyWithMarkdownV2(text, options);

    route(ctx, msg, machineConfig(initial));
  },
};
