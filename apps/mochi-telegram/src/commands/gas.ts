import { mochiApi } from "adapters";
import { Context } from "telegraf";
import { stringUtils } from "utils";
import { convertSecondToMinute } from "utils/time";

async function render() {
  const { data } = await mochiApi.defi.getGasTrackers();
  const lines = [`⛽️ *Gas Price*\n`] as string[];

  data?.forEach((token: any) => {
    lines.push(`*${token.chain}*`);
    lines.push(
      `🐢 \`Slow   -\` ${
        token.safe_gas_price
      } gwei \\(\\~ ${convertSecondToMinute(token.est_safe_time)}\\)`
    );
    lines.push(
      `🚗 \`Normal -\` ${
        token.propose_gas_price
      } gwei \\(\\~ ${convertSecondToMinute(token.est_propose_time)}\\)`
    );
    lines.push(
      `🚀 \`Fast   -\` ${
        token.fast_gas_price
      } gwei \\(\\~ ${convertSecondToMinute(token.est_fast_time)}\\)\n`
    );
  });

  return {
    context: {},
    text: stringUtils.escape(lines.join("\n")),
    options: {
      disable_web_page_preview: true,
    },
  };
}

export default {
  gas: async (ctx: Context) => {
    const { text, options } = await render();
    await ctx.replyWithMarkdownV2(text, options);
  },
};
