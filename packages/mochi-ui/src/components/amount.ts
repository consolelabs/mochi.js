import API from "@consolelabs/mochi-rest";
import { formatTokenDigit } from "../formatDigit";
import { Platform } from "../ui";

interface Props {
  amount: string | number;
  symbol: string;
  on: Platform.Discord | Platform.Telegram | Platform.Web;
  api?: API;
  prefix?: "+" | "-";
}

export default async function ({ amount, symbol, api, on, prefix }: Props) {
  let text = `<emoji> ${prefix || ""}${formatTokenDigit(amount)} ${symbol}`;
  let image = null;

  if (api && [Platform.Discord, Platform.Web].includes(on)) {
    const emoji = api.emojis.get(symbol);
    if (emoji) {
      if (on === Platform.Discord) {
        text = text.replaceAll(
          "<emoji>",
          emoji.emoji.replaceAll("_", symbol.toLowerCase())
        );
      } else if (on === Platform.Web) {
        text = text.replaceAll("<emoji>", "");
        image = emoji.emoji_url;
      } else {
        text = text.replaceAll("<emoji>", "");
      }
    }
  } else {
    text = text.replaceAll("<emoji>", "");
  }

  text = text.trim();
  return {
    text,
    image,
  };
}
