import { Context } from "telegraf";
import { version } from "../../package.json";

export default {
  v: async function (ctx: Context) {
    await ctx.reply(`v${version}`);
  },
};
