import { payApi, profileApi } from "adapters";
import { APPROX, HOMEPAGE_URL } from "constant";
import { Context, Input } from "telegraf";
import { errorUtils, stringUtils } from "utils";
import {
  checkBalance,
  checkTokenDecimal,
  parseAmount,
  parseMessage,
  parseSymbol,
  validateSymbol,
} from "utils/defi";
import { pipe } from "utils/functions";
import qrcode from "qrcode";
import { utils } from "@consolelabs/mochi-formatter";

async function render(
  ctx: Context,
  amount: number,
  token: string,
  note: string
) {
  const p = await profileApi.getByTelegram(ctx.from?.id.toString() ?? "");

  const data = await payApi.payRequest.generatePaymentCode({
    profileId: p.id,
    amount: amount.toString(),
    token,
    note,
    type: "paylink",
  });

  const link = `${HOMEPAGE_URL}/pay/${data.code}`;
  const qrBuffer = await qrcode.toBuffer(link).catch(() => null);

  if (!ctx.from?.id)
    return {
      text: "Mochi couldn't create a new Pay Link, please contact the team for further support",
      options: {},
    };
  await ctx.telegram.sendMessage(
    ctx.from.id,
    [
      "Congrats! You've just created a pay link",
      `Here's ${link} ${APPROX} *${utils.formatTokenDigit(amount)} ${token}* ${
        note ? "with message" : ""
      }`,
      ...(note ? [`\`${note}\``] : []),
    ]
      .map(stringUtils.escape)
      .join("\n"),
    {
      parse_mode: "MarkdownV2",
    }
  );
  if (qrBuffer) {
    ctx.telegram.sendPhoto(ctx.from.id, Input.fromBuffer(qrBuffer));
  }

  return {
    text: stringUtils.escape("A new Pay Link has been sent to you!"),
    options: {},
  };
}

export default {
  paylink: async function (ctx: Context) {
    const args = ctx.state.command.args;
    const amount = args[0];
    const symbol = args[1];
    const message = args.slice(2).join(" ").trim();

    if (args.length < 2) {
      await ctx.replyWithMarkdownV2(
        "Please enter full command e\\.g\\. `/paylink 1 eth`"
      );
      return;
    }

    pipe(
      {
        symbol,
        amount,
        all: false,
        message,
        token: {} as Record<string, any>,
      },
      validateSymbol(),
      parseAmount(ctx),
      parseSymbol(),
      parseMessage(),
      checkBalance(ctx),
      checkTokenDecimal()
    )
      .then(async (payload) => {
        const { text, options } = await render(
          ctx,
          payload.amount,
          payload.symbol,
          payload.message
        );
        await ctx.replyWithMarkdownV2(text, options);
      })
      .catch((e) => {
        const { text, options } = errorUtils.replyData(e.message);
        ctx.reply(text, options);
      });
  },
};
