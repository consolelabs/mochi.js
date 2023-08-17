import { canvasProcessApi } from "adapters";
import { Context, Input as TeleInput } from "telegraf";

async function heatmap() {
  const data = await canvasProcessApi.defi.getHeatmap();
  if ("error" in data) {
    throw new Error("Failed to fetch coins market data: " + data.error);
  }

  const heatmap = Buffer.from(data.image);

  return {
    photo: TeleInput.fromBuffer(heatmap),
  };
}

function dispatch() {
  return async function (ctx: Context) {
    const defer = ctx.replyWithMarkdownV2(
      "Loading heatmap, please wait 3\\-4s"
    );

    const { photo } = await heatmap();

    if (photo) {
      await ctx
        .replyWithMarkdownV2("*🔥 Mochi Heatmap*")
        .then(() => defer)
        .then(async (msg) => {
          await ctx.deleteMessage(msg.message_id);
          await ctx.replyWithPhoto(photo);
        });
    } else {
      defer
        .then((msg) => ctx.deleteMessage(msg.message_id))
        .then(() =>
          ctx.replyWithMarkdownV2(
            "Failed to generate heatmap, please try again later"
          )
        );
    }
  };
}

export default {
  heatmap: dispatch(),
  heat: dispatch(),
};
