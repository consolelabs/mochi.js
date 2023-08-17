import { mochiApi, profileApi } from "adapters";
import { Context } from "telegraf";
import { errorUtils, stringUtils } from "utils";

async function render(ctx: Context) {
  const [symbol] = ctx.state.command.args;
  if (!symbol) {
    return {
      text: stringUtils.escape(
        "Please provide a token symbol. Example: `/wlr btc` or `/wla eth/btc`"
      ),
      options: {},
    };
  }
  const profile = await profileApi.getByTelegram(ctx.from?.id.toString() ?? "");
  const { error } = await mochiApi.users.untrackToken({
    profileId: profile.id,
    symbol: symbol,
  });

  if (error) return errorUtils.replyData(error.message);

  return {
    context: {},
    text: stringUtils.escape(
      [
        `✅ *${symbol.toUpperCase()} has been removed from the watch list*`,
        `👉 View watch list with /wlv`,
      ].join("\n")
    ),
    options: {
      disable_web_page_preview: true,
    },
  };
}

export default {
  wlr: async (ctx: Context) => {
    const { text, options } = await render(ctx);
    await ctx.replyWithMarkdownV2(text, options);
  },
};
