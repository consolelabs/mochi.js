import { utils } from "@consolelabs/mochi-formatter";
import { mochiApi, profileApi } from "adapters";
import { Context } from "telegraf";

async function render(ctx: Context) {
  const args = ctx.state.command.args || [];
  const [address, alias = ""] = args;
  const resolvedAddress = await utils.address.resolve(address);

  const { valid } = utils.address.isAddress(resolvedAddress);
  if (!valid) {
    return {
      text: [
        "Please input a valid address e\\.g\\.",
        "`/copy vitalik.eth`\n`/copy 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`",
      ].join("\n"),
    };
  }

  const profile = await profileApi.getByTelegram(ctx.from?.id.toString() ?? "");
  await mochiApi.users.untrackWallet({
    profileId: profile.id,
    address: resolvedAddress,
    alias,
  });

  return {
    text: `Removed \`${address}\``,
  };
}

export default {
  untrack: async function (ctx: Context) {
    const { text } = await render(ctx);

    await ctx.replyWithMarkdownV2(text);
  },
};
