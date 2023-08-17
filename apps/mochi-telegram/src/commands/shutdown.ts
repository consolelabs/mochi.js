import { SHUTDOWN_CODE } from "env";
import { bot } from "index";
import { Context } from "telegraf";

export const shutdown = {
  enable: false,
  pwd: SHUTDOWN_CODE,
};

export default {
  shutdown: async function (ctx: Context) {
    const pwd = ctx.state.command.args[0];

    if (!shutdown.pwd || pwd !== shutdown.pwd) return;

    await ctx.reply("Bot shutting down...");
    shutdown.enable = true;
    bot.stop("shutdown_cmd");
  },
};
