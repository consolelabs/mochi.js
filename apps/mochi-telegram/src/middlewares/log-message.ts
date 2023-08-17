import kafka from "services/kafka";
import { Context, MiddlewareFn } from "telegraf";
import { Chat } from "telegraf/typings/core/types/typegram";

const title = (chat?: Chat) => {
  if (!chat) return;
  if (chat.type === "private") {
    return chat.username;
  }
  if (chat.type === "group") {
    return chat.title;
  }

  return chat.username || chat.title;
};

export function middleware(): MiddlewareFn<Context> {
  return function (ctx, next) {
    const update = ctx.update as any;
    if (!update?.message?.text) return next();
    if (ctx.updateType === "message") {
      const msg = (ctx.update as any).message;
      const text = ctx.state.command?.raw || msg.text;

      const chat = ctx.chat;
      const data = {
        type: 3,
        telegram_log: {
          message: {
            message_id: msg.message_id,
            from: {
              id: ctx.from?.id,
              is_bot: ctx.from?.is_bot,
              username: ctx.from?.username,
            },
            chat: {
              id: chat?.id,
              title: title(chat),
              type: chat?.type,
            },
            date: ctx.message?.date,
            text,
          },
        },
      };

      kafka.queue?.produceAnalyticMsg([data]);
    }
    return next();
  };
}
