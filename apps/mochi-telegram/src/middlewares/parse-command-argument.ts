import { Context, MiddlewareFn } from "telegraf";

export function middleware(): MiddlewareFn<Context> {
  return function (ctx, next) {
    if (ctx.updateType === "message") {
      const msg = (ctx.update as any).message;
      const text = msg?.text?.toLowerCase() ?? "";

      if (text.startsWith("/")) {
        const match = text.match(/^\/([^\s]+)\s?(.+)?/);
        let args: string[] = [];
        let command;
        if (match !== null) {
          if (match[1]) {
            command = match[1];
          }
          if (match[2]) {
            args = match[2]
              .replaceAll(",", " ")
              .replaceAll(/\s+/g, " ")
              .split(" ");
          }
        }

        ctx.state.command = {
          raw: text,
          command,
          args,
        };
      }
    }
    return next();
  };
}
