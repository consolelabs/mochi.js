import "./fetch-polyfills";
import { Context, Telegraf, Telegram } from "telegraf";
import { message } from "telegraf/filters";
import { TELEGRAM_TOKEN } from "env";
import commands from "commands";
import events, { start, help } from "./events";
import { logger } from "logger";
import kafka from "services/kafka";
import { createServer, Server, IncomingMessage, ServerResponse } from "http";
import { DOT, PORT } from "constant";
import { commandStore } from "async-storage";
import router from "utils/router";
import middlewares from "middlewares";
import { registerFont } from "canvas";
import { Sentry } from "services/sentry";
import { stringUtils } from "utils";
import api from "./api";

registerFont("assets/fonts/noto-sans-latin-400-normal.ttf", {
  family: "Noto Sans",
});

export const bot = new Telegraf(TELEGRAM_TOKEN);
let server: Server;
let isReady = false;

server = createServer(
  async (request: IncomingMessage, response: ServerResponse) => {
    if (request.url === "/healthz") {
      if (isReady) {
        response.statusCode = 200;
        response.setHeader("Content-Type", "text/plain");
        response.end("OK");
        return;
      }
    }

    response.statusCode = 404;
    response.end();
  }
);

server.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});

// register middlewares
for (const middleware of middlewares) {
  bot.use(middleware());
}

function attachMonitoringAndProfiling<T extends Function>(
  cmdName: string,
  cmdHandler: T
) {
  return function (ctx: Context) {
    kafka.queue?.produceBatch({
      user_id: ctx.from?.id,
      command: cmdName,
    });
    commandStore.run(
      {
        start: performance.now(),
        data: {
          user_id: ctx.from?.id,
          command: cmdName,
        },
      },
      cmdHandler.bind(null, ctx)
    );
  };
}

// /start & /help
bot.start(attachMonitoringAndProfiling("start", start));
bot.help(attachMonitoringAndProfiling("help", help));

// register commands
for (const cmd of Object.entries(commands)) {
  const [cmdName, cmdHandler] = cmd;
  bot.command(cmdName, attachMonitoringAndProfiling(cmdName, cmdHandler));
}

// register event listeners
for (const ev of Object.entries(events)) {
  const [evName, evHandler] = ev;

  bot.on(message(evName as Parameters<typeof message>[0]), evHandler);
}

// init kafka
kafka.init();

bot.telegram.getMe().then((me) => {
  logger.info(`Bot telegram [${me.username}] is ready`);
  router.init(bot);
  isReady = true;
});

// monkey patch
const sendMessage = bot.telegram.sendMessage;
const editMessage = bot.telegram.editMessageText;
const attachFooter = function (
  thisObj: any,
  func: Function,
  type: "send" | "edit"
) {
  return async function (...args: any) {
    try {
      const store = commandStore.getStore();
      let time,
        stop = performance.now();
      if (store) {
        time = Math.max(Number((stop - store.start) / 1000), 0).toFixed(3);
      }
      let _first, _second, _third, msgContent, extraOptions, rest;
      // let [_first, msgContent, extraOptions, ...rest] = args;
      if (type === "send") {
        [_first, msgContent, extraOptions, ...rest] = args;
      } else {
        [_first, _second, _third, msgContent, extraOptions, ...rest] = args;
      }
      const tip = api.randomTip();
      const { footer, noFooter, ...options } = Object.assign(
        {},
        { footer: "", noFooter: false },
        extraOptions
      );

      // append footer
      if (time && !noFooter) {
        msgContent = [
          msgContent,
          "⎯".repeat(5),
          ...(footer ? (Array.isArray(footer) ? footer : [footer]) : []),
          [
            tip,
            DOT,
            stringUtils.equal(options?.parse_mode ?? "", "MarkdownV2")
              ? stringUtils.escape(`Took ${time}s`)
              : `Took ${time}s`,
          ].join(""),
        ].join("\n");
      }

      if (type === "send") {
        return func.apply(thisObj, [
          _first,
          msgContent,
          options,
          ...rest,
        ] as any);
      } else {
        return func.apply(thisObj, [
          _first,
          _second,
          _third,
          msgContent,
          options,
          ...rest,
        ] as any);
      }
    } catch (e) {}
  };
};

Telegram.prototype.sendMessage = async function (...args: any) {
  return attachFooter(this, sendMessage, "send")(...args);
};

Telegram.prototype.editMessageText = async function (...args: any) {
  return attachFooter(this, editMessage, "edit")(...args);
};

bot.launch();

bot.catch(async (err, ctx) => {
  logger.error(err);
  Sentry.captureException(err, {
    tags: {
      command: ctx.state.command.raw,
    },
  });
  await ctx.sendMessage("Something went wrong").catch(() => null);
});

process.on("SIGINT", () => {
  server.close();
  bot.stop("SIGINT");
});
process.on("SIGTERM", () => {
  server.close();
  bot.stop("SIGTERM");
});

if (import.meta.hot) {
  import.meta.hot.on("vite:beforeFullReload", () => {
    server.close();
    bot.stop("restart");
  });
}
