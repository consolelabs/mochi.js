import { Context } from "telegraf";
import { pipe } from "utils/functions";
import {
  parseAmount,
  parseReceiver,
  parseSymbol,
  parseTarget,
  validateSymbol,
  checkBalance,
  checkTokenDecimal,
  parseMessage,
  validateReceiver,
} from "utils/defi";
import { errorUtils, stringUtils } from "utils";
import { mochiApi, profileApi } from "adapters";
import { APPROX, HOMEPAGE_URL } from "constant";
import { isBoolean } from "lodash";
import { utils } from "@consolelabs/mochi-formatter";

export default {
  tip: async function (ctx: Context) {
    const args = ctx.state.command.args;
    if (args.length < 3) {
      await ctx.replyWithMarkdownV2(
        [
          "Please enter full command e\\.g\\. `/tip @john 1 eth`",
          "_`all` \\= all users in this chat_ e\\.g\\. `/tip all 1 eth`",
        ].join("\n")
      );
      return;
    }

    pipe(
      {
        args,
        to: [] as string[],
        toId: [] as string[],
        amount: 0,
        symbol: "",
        token: {} as Record<string, any>,
        message: "",
        all: false,
      },
      // check for multiple receivers
      validateReceiver(),
      // check for presence
      validateSymbol(),
      // try to parse
      parseTarget(ctx),
      parseReceiver(),
      parseAmount(ctx),
      parseSymbol(),
      parseMessage(),
      // check business logic
      checkBalance(ctx),
      checkTokenDecimal()
    )
      .then(async (validatedPayload) => {
        const profileSender = await profileApi.getByTelegram(
          ctx.from?.id.toString() || ""
        );

        const receiverIds = await Promise.all(
          validatedPayload.toId.map((id) =>
            profileApi.getByTelegram(id).then((d) => String(d.id))
          )
        );

        if (!receiverIds.length)
          throw new Error("Mochi couldn't find the recipients, try again?");

        const payload = {
          sender: String(profileSender.id),
          recipients: receiverIds.filter(Boolean),
          amount: validatedPayload.amount,
          amount_string: utils.formatDigit({
            value: String(validatedPayload.amount),
            fractionDigits: validatedPayload.token?.decimal ?? 0,
          }),
          token: validatedPayload.symbol,
          token_price: validatedPayload.token?.price,
          each: false,
          all: validatedPayload.all,
          transfer_type: "transfer",
          chain_id: validatedPayload.token?.chain?.chain_id,
          decimal: validatedPayload.token?.decimal ?? 0,
          message: validatedPayload.message,
          platform: "telegram",
        };

        return {
          res: await mochiApi.tip.transferV2(payload),
          payload: validatedPayload,
        };
      })
      .then(({ res, payload }) => {
        if (isBoolean(res.ok) && !res.ok)
          throw new Error(
            res.error.message.error ??
              "Mochi couldn't tip users, please contact the team for further support"
          );
        const usdWorth = `\\(${APPROX} ${utils.formatUsdDigit(
          res.amount_each * payload.token?.price
        )}\\)`;

        const amount = `${utils.formatTokenDigit(
          res.amount_each?.toString()
        )} ${payload.token?.symbol?.toUpperCase()}`;

        const lines = [];
        const isMultiple = payload.to.length > 1;
        lines.push(
          `@${ctx.from?.username} has sent ${payload.to.join(
            ", "
          )} *${amount}* ${usdWorth}${
            isMultiple ? " each" : ""
          }! → [view receipt](${HOMEPAGE_URL}/transfer/${res.external_id})`
        );

        ctx.replyWithMarkdownV2(stringUtils.escape(lines.join("\n")), {
          noFooter: true,
          disable_web_page_preview: true,
        } as any);
      })
      .catch((e) => {
        const { text, options } = errorUtils.replyData(e.message);
        ctx.reply(text, options);
      });
  },
};
