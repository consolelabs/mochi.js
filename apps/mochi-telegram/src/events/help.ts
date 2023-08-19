import {
  START_GROUP_URL,
  DISCORD_URL,
  HOMEPAGE_URL,
  MOCHI_GITBOOK,
} from "constant";
import { Context } from "telegraf";
import { stringUtils } from "utils";

async function render(ctx: Context) {
  const lines = [];
  lines.push("👋 *Welcome to Mochi!*");
  lines.push("Mochi is your Web3 assistant to maximize your earnings.");
  lines.push("");
  lines.push("🏎 *Getting Started*");
  lines.push("/profile build up your profile");
  lines.push("/earn like a chad");
  lines.push("/track follow and copy top alphas");
  lines.push("/wlv track your favorite tokens");
  lines.push("");
  lines.push("✍️ *For CM*");
  lines.push("/quest engage your holders");
  lines.push("/vaults manage DAO treasuries");
  lines.push("/nftrole setup gated channels");
  lines.push("/sales buy/sell report");
  lines.push("");
  lines.push("ℹ️ *About*");
  lines.push(`[Instructions](${MOCHI_GITBOOK})`);
  lines.push(`[Website](${HOMEPAGE_URL})`);
  lines.push(`[Discord](${DISCORD_URL})`);

  return {
    text: stringUtils.escape(lines.join("\n")),
    options: {
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
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

export async function help(ctx: Context) {
  const { text, options } = await render(ctx);

  await ctx.replyWithMarkdownV2(text, options);
  await ctx.replyWithPhoto(
    "https://cdn.discordapp.com/attachments/984660970624409630/1023869479521882193/help2.png"
  );
}
