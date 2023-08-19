import { payApi, profileApi } from "adapters";
import {
  MOCHI_ACTION_PROFILE,
  MOCHI_APP_SERVICE,
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
} from "env";
import kafka from "services/kafka";
import { Context } from "telegraf";
import { stringUtils } from "utils";
import {
  DISCORD_USER_URL,
  TWITTER_USER_URL,
  START_URL,
  StartEvent,
  PAY_ACTIVITY,
} from "constant";
import { MachineConfig, RouterSpecialAction, route } from "utils/router";
import { machineConfig as balanceMachineConfig } from "./balance";
import { machineConfig as wlvMachineConfig } from "./wlv";
import { machineConfig as walletAddMachineConfig } from "./walletadd";
import { capitalize } from "lodash";
import { utils } from "@consolelabs/mochi-formatter";
import { fmt } from "utils/formatter";

function sendKafka(profileId: string, username: string) {
  const kafkaMsg = {
    platform: "telegram",
    activity: {
      profile_id: profileId,
      status: MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
      platform: MOCHI_APP_SERVICE,
      action: MOCHI_ACTION_PROFILE,
      content: {
        username,
        amount: "",
        token: "",
        server_name: "",
        number_of_user: "",
        role_name: "",
        channel_name: "",
        token_name: "",
        moniker_name: "",
        address: "",
      },
    },
  };
  kafka.queue?.produceActivityMsg([kafkaMsg]);
}

export const machineConfig: MachineConfig = {
  id: "profile",
  initial: "profile",
  context: {
    renderer: {
      profile: render,
    },
  },
  states: {
    profile: {
      on: {
        VIEW_MOCHI_WALLET: "mochiWallet",
        VIEW_WATCHLIST: "watchlist",
        ADD_WALLET: "walletadd",
      },
    },
    walletadd: {
      on: {
        [RouterSpecialAction.BACK]: "profile",
      },
      ...walletAddMachineConfig,
    },
    mochiWallet: {
      on: {
        [RouterSpecialAction.BACK]: "profile",
      },
      ...balanceMachineConfig(),
    },
    watchlist: {
      on: {
        [RouterSpecialAction.BACK]: "profile",
      },
      ...wlvMachineConfig,
    },
  },
};

async function render(ctx: Context) {
  const dataProfile = await profileApi.getByTelegram(
    ctx.from?.id.toString() ?? "",
    false
  );
  if (dataProfile.err) {
    throw new Error("Couldn't get profile data");
  }
  sendKafka(dataProfile.id, ctx.message?.from.username ?? "");

  const [inAppWallets, balances, inbox] = await Promise.all([
    payApi.getUserWallets(dataProfile.id),
    payApi.mochiWallet.getOffchainBalances(dataProfile.id),
    profileApi.getUserActivities(dataProfile.id, {
      actions: PAY_ACTIVITY,
      size: 5,
      page: 0,
      status: "new",
    }),
  ]);

  const { totalUsd: totalWorth } = await fmt.components.balance({ balances });

  const socials = dataProfile.associated_accounts
    ?.filter((a: any) => ["twitter", "discord"].includes(a.platform))
    .map((a: any) => {
      return {
        ...a,
        platform_identifier:
          a.platform_metadata?.username || a.platform_identifier,
      };
    });

  let total = totalWorth;
  const lines = [];

  lines.push("");
  lines.push("👛 *Wallets*");
  lines.push(`\`Mochi (${utils.formatUsdDigit(totalWorth)})\``);

  const { text: mochi } = await fmt.components.mochiWallets({
    wallets: inAppWallets.map((w: any) => ({
      chain: w.chain.symbol,
      address: w.wallet_address,
    })),
  });
  lines.push(mochi);

  if (dataProfile.associated_accounts?.length) {
    const { text: cex, totalUsd: cexTotal } = await fmt.components.cexWallets({
      wallets: dataProfile.associated_accounts.map((aa: any) => ({
        amount: aa.total_amount,
        address: aa.platform_metadata?.username || aa.platform_identifier,
        name: aa.platform,
      })),
    });
    if (cex) {
      lines.push("");
      lines.push("`CEX`");
      lines.push(cex);

      total += cexTotal;
    }

    const { text: onchain, totalUsd: onchainTotal } =
      await fmt.components.onchainWallets({
        wallets: dataProfile.associated_accounts.map((aa: any) => ({
          address: aa.platform_identifier,
          chain: aa.platform,
          amount: aa.total_amount,
        })),
      });

    if (onchain) {
      lines.push("");
      lines.push("`On-chain`");
      lines.push(onchain);

      total += onchainTotal;
    }
  }

  const unconnectedPlatforms = new Map([
    ["discord", ""],
    // ["twitter", ""],
  ]);

  if (inbox.pagination?.total) {
    lines.push("");
    lines.push(`🔔 You have \`${inbox.pagination.total}\` unread messages`);
    lines.push("Use /inbox");
  }

  if (socials.length) {
    lines.push("");
    lines.push("👋*Socials*");
    lines.push(
      socials
        .map((s: any) => {
          if (s.platform === "twitter") {
            unconnectedPlatforms.delete("twitter");
            return `Twitter * [${s.platform_identifier}](${TWITTER_USER_URL}/${s.platform_identifier}) * `;
          } else if (s.platform === "discord") {
            unconnectedPlatforms.delete("discord");
            return `Discord * [@${s.platform_identifier}](${DISCORD_USER_URL}/${s.platform_identifier}) * `;
          }
        })
        .join("\n")
    );
  }

  const { text: pnl } = await fmt.components.pnl({ pnl: dataProfile.pnl });
  lines.unshift(`\`Balance. \`${utils.formatUsdDigit(total)}${pnl}`);

  return {
    context: {
      page: 0,
    },
    text: stringUtils.escape(lines.join("\n")),
    options: {
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Watchlist",
              callback_data: "view_watchlist",
            },
            {
              text: "Balance",
              callback_data: "view_mochi_wallet",
            },
          ],
          [
            ...(await Promise.all(
              Array.from(unconnectedPlatforms.entries()).map(async (up) => {
                if (stringUtils.equal(up[0], "discord")) {
                  return {
                    text: `Connect ${capitalize(up[0])}`,
                    url: START_URL(
                      ctx.botInfo.username,
                      StartEvent.AskConnectDiscord
                    ),
                  };
                }

                return {
                  text: `Connect ${capitalize(up[0])}`,
                  url: up[1],
                };
              })
            )),
          ],
          [
            {
              text: "Add wallet",
              callback_data: "add_wallet",
            },
          ],
        ],
      },
    },
  };
}

export default {
  profile: async (ctx: Context) => {
    const { text, options } = await render(ctx);
    const msg = await ctx.replyWithMarkdownV2(text, options);

    route(ctx, msg, machineConfig);
  },
};
