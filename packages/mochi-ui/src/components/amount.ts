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
  const text = `${prefix || ""}${formatTokenDigit(amount)} ${symbol}`;
  let full = `<emoji> ${text}`;
  let image = null;
  let emoji = api?.emojis.get("COIN")?.emoji ?? "<a:_:1093923016691421205>";

  if (api && [Platform.Discord, Platform.Web].includes(on)) {
    const emojiObj = api.emojis.get(symbol);
    if (emojiObj) {
      if (on === Platform.Discord) {
        emoji = emojiObj.emoji.replaceAll("_", symbol.toLowerCase());
        full = full.replaceAll("<emoji>", emoji);
      } else if (on === Platform.Web) {
        image = emojiObj.emoji_url;
      }
    }
  }

  full = full.replaceAll("<emoji>", "");

  full = full.trim();
  return {
    text,
    emoji,
    full,
    image,
  };
}
