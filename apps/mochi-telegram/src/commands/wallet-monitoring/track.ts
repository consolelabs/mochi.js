import { mochiApi, profileApi } from "adapters";
import { Context } from "telegraf";

import { WalletTrackingType } from "./enums";
import { utils } from "@consolelabs/mochi-formatter";

export default {
  follow: async (ctx: Context) => {
    ctx.replyWithMarkdownV2(await render(ctx, WalletTrackingType.Follow));
  },
  track: async (ctx: Context) => {
    ctx.replyWithMarkdownV2(await render(ctx, WalletTrackingType.Track));
  },
  trackwallet: async (ctx: Context) => {
    ctx.replyWithMarkdownV2(await render(ctx, WalletTrackingType.Track));
  },
  copy: async (ctx: Context) => {
    ctx.replyWithMarkdownV2(await render(ctx, WalletTrackingType.Copy));
  },
};

async function render(ctx: Context, type: WalletTrackingType) {
  const args = ctx.state.command.args || [];
  const [address, alias] = args;
  const resolvedAddress = await utils.address.resolve(address);

  const { valid, chainType } = utils.address.isAddress(resolvedAddress);
  if (!valid) {
    return [
      "Please input a valid address e\\.g\\.",
      "`/follow vitalik.eth`\n`/follow 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`",
    ].join("\n");
  }

  const profile = await profileApi.getByTelegram(ctx.from?.id.toString() ?? "");
  const { ok, status } = await mochiApi.users.trackWallet({
    profileId: profile.id,
    address: resolvedAddress,
    type,
    alias,
    chainType,
  });

  if (!ok && status === 409) {
    return "This alias has been used for another address!";
  }

  switch (type) {
    case WalletTrackingType.Follow:
      return [
        `Followed wallet \`${address}\`\nYou can also:`,
        `\`/track ${address}${
          alias ? ` ${alias}` : ""
        }\` \\(follow \\+ get txn notifications\\)`,
        `\`/copy ${address}${
          alias ? ` ${alias}` : ""
        }\` \\(track \\+ auto\\-copy txn moves\\)`,
      ].join("\n");
    case WalletTrackingType.Track:
      return [
        `Tracked wallet \`${address}\`\nyou can also:`,
        `\`/copy ${address}${
          alias ? ` ${alias}` : ""
        }\` \\(track \\+ auto\\-copy txn moves\\)`,
      ].join("\n");
    case WalletTrackingType.Copy:
      return [
        `Copied wallet \`${address}\`, all wallet movements will be copied \\(if all the conditions are met\\)`,
      ].join("\n");
    default:
      throw new Error("Invalid wallet tracking type");
  }
}
