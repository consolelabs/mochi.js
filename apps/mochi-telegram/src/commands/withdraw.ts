import { payApi, profileApi } from "adapters";
import { BULLET } from "constant";
import {
  MOCHI_ACTION_WITHDRAW,
  MOCHI_APP_SERVICE,
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
} from "env";
import { formatUnits, parseUnits, toBigInt } from "ethers";
import kafka from "services/kafka";
import { Context } from "telegraf";
import { errorUtils, stringUtils, truncate } from "utils";
import reply from "utils/reply";
import { MachineConfig, route } from "utils/router";
import NodeCache from "node-cache";
import { pipe } from "utils/functions";
import {
  checkBalance,
  checkTokenDecimal,
  parseAmount,
  validateSymbol,
} from "utils/defi";
import { utils } from "@consolelabs/mochi-formatter";

const payloadCache = new NodeCache({
  stdTTL: 5 * 60,
  checkperiod: 3 * 60,
});

const machineConfig: MachineConfig = {
  id: "withdraw",
  initial: "withdraw",
  context: {
    renderer: {
      executeWithdraw,
    },
  },
  states: {
    withdraw: {
      on: {
        EXECUTE_WITHDRAW: "executeWithdraw",
      },
    },
    executeWithdraw: {
      type: "final",
    },
  },
};

async function render(
  ctx: Context,
  data: { address?: string; token: string; amount: string }
) {
  const { address, token, amount } = data;

  const profile = await profileApi.getByTelegram(ctx.from?.id.toString() ?? "");
  const balances: any[] = await payApi.mochiWallet.getOffchainBalances(
    profile.id,
    token
  );

  const notZeroBalances = balances.filter(
    (bal: any) => toBigInt(bal.amount ?? "0") > 0
  );

  if (!notZeroBalances.length) {
    return {
      text: stringUtils.escape(`You have no balance in *${token}*`),
    };
  }

  const balance = notZeroBalances[0];

  if (
    balance &&
    Number(formatUnits(balance.amount, balance.token.decimal)) < Number(amount)
  ) {
    return {
      text: stringUtils.escape(
        `Your balance is insufficient: *${utils.formatTokenDigit(
          formatUnits(balance.amount, balance.token.decimal)
        )} ${token}*`
      ),
    };
  }

  const lines = [];
  lines.push("💸 *Withdraw*");
  lines.push("⎯".repeat(5));
  lines.push(`\`Network. \`${balance.token.chain.name}`);
  lines.push("`Source.  `Mochi wallet");
  lines.push(`\`Amount.  \`*${amount} ${token}*`);
  if (address) {
    lines.push(`\`Address. ${truncate(address)}\``);
    lines.push("");
    lines.push("You can change address or confirm now");
  } else {
    lines.push("");
    lines.push("Please enter the destination address");
  }

  const payload = {
    address,
    profileId: profile.id,
    amount,
    token,
    token_id: balance.token.id,
    token_decimal: balance.token.decimal,
    chainId: balance.token.chain.chain_id,
    platform: "telegram",
    platform_user_id: String(ctx.from?.id),
    amount_string: utils.formatDigit({
      value: amount.toString(),
      fractionDigits: balance.token.decimal,
    }),
  };

  payloadCache.set(ctx.from?.id!, payload);

  return {
    text:
      stringUtils.escape(lines.join("\n")) +
      "\n" +
      "_Hint: use /cancel if you wish to start over_",
    ...(address
      ? {
          options: {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Confirm",
                    callback_data: "execute_withdraw",
                  },
                ],
              ],
            },
          },
        }
      : {}),
  };
}

async function handleAddress(ctx: Context, data: any, msgId: any) {
  if (!ctx.from?.id) return;
  reply.addHandler(ctx.from.id, async (msgCtx) => {
    const address = (msgCtx.message as any).text as string;
    const resolvedAddress = await utils.address.resolve(address);
    const { valid } = utils.address.isAddress(resolvedAddress);

    if (resolvedAddress && valid) {
      const { text, options } = await render(ctx, {
        ...data,
        address: resolvedAddress,
      });

      await ctx.telegram
        .editMessageText(msgCtx.chat?.id, msgId, undefined, text, {
          ...options,
          parse_mode: "MarkdownV2",
        })
        .catch(() => null);
    } else {
      await ctx.telegram.sendMessage(
        msgCtx.chat?.id ?? "",
        "That is not a valid address"
      );
    }

    await handleAddress(ctx, data, msgId);
    return false;
  });
}

async function executeWithdraw(ctx: Context, _ev: string) {
  const payload = payloadCache.get(ctx.from?.id!) as any;

  // cache timeout
  if (!payload) return;

  const amount = parseUnits(
    payload.amount.toLocaleString().replaceAll(",", ""),
    payload.token_decimal
  ).toString();
  await payApi.withdrawV2({
    ...payload,
    amount,
  });

  const kafkaMsg = {
    platform: "telegram",
    activity: {
      profile_id: payload.profileId,
      status: MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
      platform: MOCHI_APP_SERVICE,
      action: MOCHI_ACTION_WITHDRAW,
      content: {
        username: "",
        amount: payload.amount,
        token: payload.token,
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
  kafka.queue?.produceActivityMsg(kafkaMsg);

  if (ctx.from?.id) {
    payloadCache.del(ctx.from.id);
    reply.clearHandler(ctx.from.id);
  }

  const lines = [];
  lines.push("✅ *Withdraw Submitted*");
  lines.push("");
  lines.push(`${BULLET} Your withdraw is underway.`);
  lines.push(`${BULLET} Mochi will DM you with the tx link shortly.`);

  return {
    text: stringUtils.escape(lines.join("\n")),
  };
}

export default {
  withdraw: async function (ctx: Context) {
    payloadCache.del(ctx.from?.id!);

    const args = ctx.state.command.args;
    const amount = args[0];
    const symbol = args[1];

    if (!symbol || !amount) {
      await ctx.replyWithMarkdownV2(
        stringUtils.escape("Please choose token and amount e.g `/wd 1 eth`")
      );
      return;
    }

    pipe(
      {
        amount,
        symbol,
        all: false,
        token: {} as Record<string, any>,
      },
      validateSymbol(), // is there a token?
      parseAmount(ctx, { allowDynamicAmount: false }), // is the amount within decimal range?
      checkBalance(ctx), // does the author have enough balance of this token?
      checkTokenDecimal() // check token decimal within allow range
    )
      .then(async (payload) => {
        const { text, options } = await render(ctx, {
          token: payload.symbol,
          amount: payload.amount,
        });
        const msg = await ctx.replyWithMarkdownV2(text, options);

        await handleAddress(
          ctx,
          { token: payload.symbol, amount: payload.amount },
          msg.message_id
        );
        route(ctx, msg, machineConfig);
      })
      .catch((e) => {
        const { text, options } = errorUtils.replyData(e.message);
        ctx.reply(text, options);
      });
  },
};
