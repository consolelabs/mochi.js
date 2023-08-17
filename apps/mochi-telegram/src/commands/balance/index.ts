import { payApi, profileApi } from "adapters";
import { Context } from "telegraf";
import { MachineConfig, RouterSpecialAction, route } from "utils/router";
import { getOffchainAssets, renderData } from "./processor";

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
  const profile = await profileApi.getByTelegram(ctx.from?.id.toString() ?? "");
  if (profile.err) throw new Error("Couldn't get profile data");

  const [inAppWallets, assets, txns] = await Promise.all([
    payApi.getUserWallets(profile.id),
    getOffchainAssets(profile.id),
    payApi.profile.getOffchainTxns(profile.id),
  ]);

  const wallets = inAppWallets.map((w: any) => ({
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
