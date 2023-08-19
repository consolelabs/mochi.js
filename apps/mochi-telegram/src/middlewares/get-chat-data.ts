import { mtproto } from "tdlib";
import { Context, MiddlewareFn } from "telegraf";
import { stringUtils } from "utils";
import tip from "commands/tip";
import airdrop from "commands/airdrop";

const requiredCommands = Object.keys({ ...tip, ...airdrop });

export function middleware(): MiddlewareFn<Context> {
  return async function (ctx, next) {
    if (
      // if none matches the required commands, skip this middleware
      requiredCommands.every(
        (c) => !stringUtils.equal(ctx.state?.command?.command ?? "", c)
      )
    )
      return next();
    if (ctx.updateType === "message" && ctx.chat?.type !== "group") {
      let chat = await mtproto
        .call("contacts.resolveUsername", {
          username: ctx.chat?.username,
        })
        .catch(() => null);
      if (!chat) return next();
      chat = chat.chats.at(0);
      if (!chat) return next();
      const fullChat = await mtproto
        .call("channels.getParticipants", {
          channel: {
            _: "inputChannel",
            channel_id: chat.id,
            access_hash: chat.access_hash,
          },
          filter: {
            _: "channelParticipantsMentions",
          },
        })
        .catch(() => null);

      ctx.state.chat = {
        id: chat.id,
        username: ctx.chat?.username,
        access_hash: chat.access_hash,
        users: fullChat.users ?? [],
      };
    }
    return next();
  };
}
