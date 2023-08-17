import { Context } from "telegraf";

const handler = new Map<string, (ctx: Context) => Promise<boolean | void>>();

function init() {
  return async function (ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId || ctx.from.is_bot) return;
    const h = handler.get(userId.toString());

    if (h) {
      const remove = await h?.(ctx);
      if (remove) {
        handler.delete(userId.toString());
      }
    }
  };
}

function addHandler(
  userId: number,
  h: (ctx: Context) => Promise<boolean | void>
) {
  handler.set(userId.toString(), h);
}

function clearHandler(userId: number) {
  handler.delete(userId.toString());
}

export default { init, addHandler, clearHandler };
