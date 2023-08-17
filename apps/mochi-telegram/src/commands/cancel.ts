import { Context } from "telegraf";
import reply from "utils/reply";

export default {
  cancel: async function (ctx: Context) {
    const from = ctx.from?.id;
    if (!from) return;

    reply.clearHandler(from);
    if ("message" in ctx.update && ctx.update.message.message_id) {
      await ctx.reply("OK", {
        reply_to_message_id: ctx.update.message.message_id,
        reply_markup: {
          remove_keyboard: true,
          selective: true,
        },
      });
    }
  },
};
