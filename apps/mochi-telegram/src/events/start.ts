import { Context } from "telegraf";
import { stringUtils } from "utils";
import { MachineConfig, RouterSpecialAction, route } from "utils/router";
import { machineConfig as profileConfig } from "commands/profile";
import { machineConfig as balanceConfig } from "commands/balance";
import { machineConfig as wlvMachineConfig } from "commands/wlv";
import {
  START_GROUP_URL,
  DISCORD_URL,
  HOMEPAGE_URL,
  TWITTER_URL,
  DISCORD_AUTH_URL,
  StartEvent,
} from "constant";
import { profileApi } from "adapters";
import balanceCmd from "commands/balance";

const machineConfig: MachineConfig = {
  id: "start",
  initial: "start",
  context: {
    renderer: {
      start: render,
    },
  },
  states: {
    start: {
      on: {
        VIEW_PROFILE: "profile",
        VIEW_BALANCE: "balance",
        VIEW_WATCHLIST: "watchlist",
      },
    },
    profile: {
      on: {
        [RouterSpecialAction.BACK]: "start",
      },
      ...profileConfig,
    },
    balance: {
      on: {
        [RouterSpecialAction.BACK]: "start",
      },
      ...balanceConfig(),
    },
    watchlist: {
      on: {
        [RouterSpecialAction.BACK]: "start",
      },
      ...wlvMachineConfig,
    },
  },
};

async function render(ctx: Context) {
  const lines = [];

  lines.push(`👋 *Heyo ${ctx.from?.username}!*`);
  lines.push("Thank you for using Mochi. Mochi Bot is a crypto-focused bot");
  lines.push("");
  lines.push("📣 *How to use Mochi Bot?*");
  lines.push("👤 /profile Check your profile");
  lines.push("💵 /bal Check your wallet balance \\(/balance, /balances\\)");
  lines.push("📊 /wlv Track price of your favorite tokens");
  lines.push("📌 /trackwallet Get notification of a wallet activity");
  lines.push("");
  lines.push("ℹ️ *About*");
  lines.push(`[Website](${HOMEPAGE_URL})`);
  lines.push(`[Twitter](${TWITTER_URL})`);
  lines.push(`[Discord](${DISCORD_URL})`);

  return {
    context: { page: 0 },
    text: stringUtils.escape(lines.join("\n")),
    options: {
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "👤 Profile",
              callback_data: "view_profile",
            },
            {
              text: "💵 Balance",
              callback_data: "view_balance",
            },
          ],
          [
            {
              text: "📊 Watchlist",
              callback_data: "view_watchlist",
            },
            {
              text: "📌 Track wallet",
              callback_data: "trackwallet",
            },
          ],
          [
            {
              text: "Add Bot to Group",
              url: START_GROUP_URL(ctx.botInfo.username),
            },
          ],
        ],
      },
    },
  };
}

export async function start(ctx: Context) {
  const startArg = ctx.state.command.args[0] || "";
  switch (true) {
    case stringUtils.equal(startArg, StartEvent.DiscordConnected):
      return balanceCmd.balance(ctx);
    case stringUtils.equal(startArg, StartEvent.AskConnectDiscord):
      const profile = await profileApi.getByTelegram(
        ctx.from?.id.toString() ?? ""
      );
      const code = await profileApi.requestProfileCode(profile.id);

      return await ctx.replyWithMarkdownV2(
        "Alright, let's get your Discord account connected, please follow this link:",
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Verify Discord account",
                  url: DISCORD_AUTH_URL(code),
                },
              ],
            ],
          },
        }
      );
    default:
      break;
  }
  const { text, options } = await render(ctx);

  const msg = await ctx.replyWithMarkdownV2(text, options);

  route(ctx, msg, machineConfig);
}
