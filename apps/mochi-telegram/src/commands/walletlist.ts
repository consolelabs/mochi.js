import { utils } from "@consolelabs/mochi-formatter";
import { mochiApi, profileApi } from "adapters";
import { VERTICAL_BAR } from "constant";
import { Context } from "telegraf";
import {
  ModelUserWalletWatchlist,
  ModelUserWalletWatchlistItem,
} from "types/api";
import { MachineConfig, route } from "utils/router";

const machineConfig: MachineConfig = {
  id: "walletlist",
  initial: "walletlist",
  context: {
    renderer: {
      walletlist: render,
    },
  },
  states: {
    walletlist: {},
  },
};

async function render(ctx: Context) {
  // 1. Prepare data

  // 1.1 Fetch profile by telegram id -> profile ID
  const profile = await profileApi.getByTelegram(ctx.from?.id.toString() ?? "");
  if (profile.err) {
    throw new Error("Couldn't get profile data");
  }

  // Check if profile id is empty, this case actually should not happen
  if (profile.id === "") {
    throw new Error("Profile id not found");
  }

  // 1.2 Fetch list tracking wallets by profile ID -> list tracking wallet
  const { data: trackingWallets } = await mochiApi.users.getListTrackingWallets(
    profile.id
  );

  if (!trackingWallets) {
    return {
      text: "Mochi couldn't get your tracking list. Please try again later 😢.",
    };
  }
  // 2. Build text message
  const text = await retrieveMessage(ctx, trackingWallets);

  return {
    text,
  };
}

async function retrieveMessage(
  _ctx: Context,
  watchlist: ModelUserWalletWatchlist
) {
  const { following, tracking, copying } = watchlist;

  const [formattedFollowing, formattedTracking, formattedCopying] =
    await Promise.all([
      formatTrackingList(following ?? []),
      formatTrackingList(tracking ?? []),
      formatTrackingList(copying ?? []),
    ]);
  let text = [
    `⭐ *Your favorite wallets*`,
    `/follow \\<address\\> to add a wallet to favorite list\\.`,
    `/track \\<address\\> to be notified of the wallet's transactions\\.`,
    `/copy \\<address\\> to copy every move the wallet makes\\.`,
    `/walletview \\<address\\> to view a wallet's details\\.`,
    ``,
    `📌 *Following*`,
    !formattedFollowing
      ? "You are not following any wallets"
      : formattedFollowing,
    ``,
    `👀 *Tracking*`,
    !formattedTracking ? "You are not tracking any wallets" : formattedTracking,
    ``,
    `📋 *Copying*`,
    !formattedCopying ? "You are not copying any wallets" : formattedCopying,
    ``,
  ];

  return text.join("\n");
}

async function formatTrackingList(data: ModelUserWalletWatchlistItem[]) {
  if (!data.length) {
    return "";
  }

  const list = await Promise.all(
    data
      .sort((a: any, b: any) => {
        return (b.net_worth || 0) - (a.net_worth || 0);
      })
      .map(async (i: any) => ({
        chain_type: i.chain_type,
        address: await utils.address.lookup(i.address),
        alias: i.alias,
        net_worth: utils.formatUsdDigit(i.net_worth),
      }))
  );

  return utils.mdTable(list, {
    cols: ["chain_type", "address", "alias", "net_worth"],
    alignment: ["left", "left", "left", "right"],
    separator: [VERTICAL_BAR, VERTICAL_BAR, VERTICAL_BAR],
  });
}

export default {
  walletlist: async (ctx: Context) => {
    const { text } = await render(ctx);
    const msg = await ctx.replyWithMarkdownV2(text);
    route(ctx, msg, machineConfig);
  },
};
