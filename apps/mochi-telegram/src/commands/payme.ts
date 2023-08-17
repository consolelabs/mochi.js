import { utils } from "@consolelabs/mochi-formatter";
import { payApi, profileApi } from "adapters";
import { Context } from "telegraf";
import { errorUtils, stringUtils, truncate } from "utils";
import {
  checkTokenDecimal,
  parseAmount,
  parseMessage,
  parseSymbol,
  validateSymbol,
  validatePlatform,
} from "utils/defi";
import { pipe } from "utils/functions";
import kafka from "services/kafka";
import { isValidEmail } from "utils/string";

async function render(
  ctx: Context,
  amount: number,
  token: string,
  note: string,
  target: string,
  platform: string
) {
  const p = await profileApi.getByTelegram(ctx.from?.id.toString() ?? "");
  let inAppWallets = await payApi.getUserWallets(p.id);

  const data = await payApi.payRequest.generatePaymentCode({
    profileId: p.id,
    amount: amount.toString(),
    token,
    note,
    type: "payme",
  });

  const link = `https://mochi.gg/${p.profile_name || p.id}/receive/${
    data.code
  }`;

  if (!ctx.from?.id)
    return {
      text: "Mochi couldn't create a new Pay Link, please contact the team for further support",
      options: {},
    };

  inAppWallets = inAppWallets.filter((w: any) => {
    if (data.token.chain.is_evm) {
      return stringUtils.equal(w.chain.symbol, "evm");
    }
    return stringUtils.equal(w.chain.symbol, data.token.chain.symbol);
  });

  const associatedAccs = p.associated_accounts
    .filter((aa: any) => aa.platform.includes("chain"))
    .map((aa: any) => {
      let symbol = "EVM";
      if (stringUtils.equal(aa.platform, "ronin-chain")) {
        symbol = "RON";
      } else if (stringUtils.equal(aa.platform, "sui-chain")) {
        symbol = "SUI";
      } else if (stringUtils.equal(aa.platform, "solana-chain")) {
        symbol = "SOL";
      }

      return {
        wallet_address: aa.platform_identifier,
        chain: {
          symbol,
        },
      };
    })
    .filter((w: any) => {
      if (data.token.chain.is_evm) {
        return stringUtils.equal(w.chain.symbol, "evm");
      }
      return stringUtils.equal(w.chain.symbol, data.token.chain.symbol);
    });

  await ctx.telegram.sendMessage(
    ctx.from.id,
    [
      `Hey! ${p.profile_name} requests you pay *${amount} ${token}*${
        note ? " with message:" : ""
      }`,
      ...(note ? [`\`${note}\``] : []),
      `You can pay me via ${link}`,
      "Or send to one of my wallets:",
      `${"⎯".repeat(1)} Mochi ${"⎯".repeat(1)}`,
      utils.mdTable(
        inAppWallets.map((w: any) => ({
          chain: w.chain.symbol,
          address: w.wallet_address,
        })),
        {
          cols: ["address"],
        }
      ),
      ...(associatedAccs.length
        ? [
            "",
            `${"⎯".repeat(1)} On-chain ${"⎯".repeat(1)}`,
            utils.mdTable(
              associatedAccs.map((w: any) => ({
                chain: w.chain.symbol,
                address: w.wallet_address,
              })),
              {
                cols: ["address"],
              }
            ),
          ]
        : []),
      "",
      "Token Info",
      `\`Address.\`         ${truncate(data.token.address)}`,
      `\`Chain name.\`   ${data.token.chain.name} \\(${data.token.chain.symbol}\\)`,
      `\`Chain ID.\`       ${stringUtils.escape(data.token.chain.chain_id)}`,
    ]
      .map(stringUtils.escape)
      .join("\n"),
    {
      parse_mode: "MarkdownV2",
    }
  );

  await kafka.queue?.produceNotificationMsg({
    type: 16,
    pay_request_metadata: {
      target_profile_id: target,
      to_platform: platform,
      user_profile_id: p.id,
      amount: amount.toString(),
      token,
      pay_link: link,
      request_id: data.code,
      action: "payme",
      note: note,
      from_platform: "telegram",
      username: p.profile_name,
      wallets: [
        ...inAppWallets.map((w: any) => ({
          chain: w.chain.symbol,
          platform_identifier: w.wallet_address,
        })),
        ...associatedAccs.map((w: any) => ({
          chain: w.chain.symbol,
          platform_identifier: w.wallet_address,
        })),
      ],
    },
  });

  return {
    text: stringUtils.escape(
      "A new Pay Me request has been generated in your DM, forward it to your payer!"
    ),
    options: {},
  };
}

export default {
  payme: async function (ctx: Context) {
    const args = ctx.state.command.args;
    const amount = args[0];
    const symbol = args[1];
    const rest = args.slice(2).join(" ").trim() as string;
    pipe(
      {
        amount,
        symbol,
        all: false,
        target: rest.startsWith("@") || isValidEmail(args[2]) ? args[2] : "",
        platform:
          rest.startsWith("@") || isValidEmail(args[2]) ? args.slice(3)[0] : "",
        message:
          rest.startsWith("@") || isValidEmail(args[2])
            ? args.slice(4).join(" ").trim()
            : rest,
        token: {} as Record<string, any>,
      },
      validateSymbol(),
      parseAmount(ctx, { allowDynamicAmount: false }),
      parseSymbol(),
      parseMessage(),
      checkTokenDecimal(),
      validatePlatform()
    )
      .then(async (payload) => {
        const { text, options } = await render(
          ctx,
          payload.amount,
          payload.symbol,
          payload.message,
          payload.target,
          payload.platform
        );
        await ctx.replyWithMarkdownV2(text, options);
      })
      .catch((e) => {
        const { text, options } = errorUtils.replyData(e.message);
        ctx.reply(text, options);
      });
  },
};
