import { profileApi } from "adapters";
import { HOMEPAGE_URL } from "constant";
import { Context } from "telegraf";
import { stringUtils } from "utils";
import { utils } from "@consolelabs/mochi-formatter";
import { MachineConfig, route } from "utils/router";

export const machineConfig: MachineConfig = {
  id: "walletadd",
  initial: "walletadd",
  context: {
    renderer: {
      walletadd: render,
    },
  },
  states: {
    walletadd: {},
  },
};

const supportedChains = [
  {
    symbol: "EVM",
    name: "EVM chains",
  },
  {
    symbol: "SOL",
    name: "Solana",
  },
  {
    symbol: "RON",
    name: "Ronin",
  },
  {
    symbol: "SUI",
    name: "Sui",
  },
  {
    symbol: "APT",
    name: "Aptos",
  },
  {
    symbol: "NEAR",
    name: "Near",
  },
];

async function render(ctx: Context) {
  const profile = await profileApi.getByTelegram(ctx.from?.id.toString() ?? "");

  const code = await profileApi.requestProfileCode(profile.id);

  const lines = [];

  lines.push(
    "Please click on the `Verify Wallet` button below to connect your cryptocurrency wallet."
  );
  lines.push("Currently, we only support the following chains:");
  lines.push(utils.mdTable(supportedChains, { cols: ["symbol", "name"] }));

  return {
    text: stringUtils.escape(lines.join("\n")),
    options: {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Verify Wallet",
              url: `${HOMEPAGE_URL}/verify?code=${code}`,
            },
          ],
        ],
      },
    },
  };
}

export default {
  walletadd: async function (ctx: Context) {
    const { text, options } = await render(ctx);
    const msg = await ctx.replyWithMarkdownV2(text, options);
    route(ctx, msg, machineConfig);
  },
};
