import { Context } from "telegraf";
import { stringUtils } from "utils";
import { MachineConfig, RouterSpecialAction, route } from "utils/router";
import { getOnchainAssets, renderData } from "./balance/processor";
import { mochiApi, profileApi } from "adapters";
import { utils } from "@consolelabs/mochi-formatter";

export const machineConfig: (address?: string) => MachineConfig = (
  address = ""
) => ({
  id: "walletview",
  initial: "walletview",
  context: {
    renderer: {
      walletview: (tgCtx, _ev, ctx) => render(tgCtx, ctx.page, address),
    },
    page: 0,
  },
  states: {
    walletview: {
      on: {
        [RouterSpecialAction.PREV_PAGE]: "walletview",
        [RouterSpecialAction.NEXT_PAGE]: "walletview",
      },
    },
  },
});

async function render(ctx: Context, page: number, address: string) {
  const profile = await profileApi.getByTelegram(ctx.from?.id.toString() ?? "");
  if (profile.err) {
    throw new Error("Couldn't get profile data");
  }
  const resolvedAddress = await utils.address.resolve(address, {
    waitFor: 5000,
  });
  const { valid, chainType } = utils.address.isAddress(resolvedAddress);
  if (!valid) {
    return {
      text: stringUtils.escape(
        `The address: ${address} is invalid, please input the valid one!`
      ),
      options: {},
    };
  }
  const [assets, txnsRes] = await Promise.all([
    getOnchainAssets(profile.id, resolvedAddress, chainType),
    mochiApi.users.getWalletTransactions(
      profile.id,
      resolvedAddress,
      chainType
    ),
  ]);

  const wallets = [
    {
      chain: chainType,
      address,
    },
  ];

  const txns =
    txnsRes.data?.filter((tx) => tx.has_transfer && tx.successful).flat() ?? [];

  return await renderData(ctx, page, false, {
    profile,
    wallets,
    assets,
    txns,
    onchain: true,
  });
}

export default {
  walletview: async (ctx: Context) => {
    const [address] = ctx.state.command.args;
    if (!address) {
      await ctx.replyWithMarkdownV2(
        stringUtils.escape(
          "Please provide an address to view e.g. `/walletview 0x1234567890abcdef1234567890abcdef12345678`\n`/walletview vitalik.eth`"
        )
      );
      return;
    }
    const { text, options } = await render(ctx, 0, address);
    const msg = await ctx.replyWithMarkdownV2(text, options);
    route(ctx, msg, machineConfig(address));
  },
};
