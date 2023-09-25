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
  let emoji = api?.fallbackCoinEmoji.emoji ?? "";

  if (api && [Platform.Discord, Platform.Web].includes(on)) {
    const { data } = await api.base.metadata.getEmojis({ codes: [symbol] });
    let emojiObj = data?.at(0);
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
