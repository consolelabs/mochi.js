import { API_PROFILE_SERVER_URL } from "env";

export const MIN_DUST_USD = 0.001;
export const BALANCE_PAGE_SIZE = 20;
export const VERTICAL_BAR = "｜";
export const APPROX = "≈";
export const BULLET = "‣";
export const BIGBULLET = "►";

export const DASH = "-";
export const DOT = "⬩";
export const COMMA = ",";
export const SPACE = " ";

export const TELEGRAM_USER_URL = "https://t.me";
export const DISCORD_USER_URL = "https://discordapp.com/users";
export const TWITTER_USER_URL = "https://twitter.com";

export const HOMEPAGE_URL = process.env.HOMEPAGE_URL || "https://mochi.gg";
export const TWITTER_URL = "https://twitter.com/getmochi_bot";
export const DISCORD_URL = "https://discord.gg/XQR36DQQGh";
export const PORT = Number(process.env.PORT || "5001");

export const MOCHI_GITBOOK = "https://mochibot.gitbook.io";

export const FETCH_TIMEOUT_SECONDS = process.env.FETCH_TIMEOUT_SECONDS || 5;
export const CACHE_TTL_SECONDS = process.env.CACHE_TTL_SECONDS || 1800;
export const REDIS_HOST = process.env.REDIS_HOST || "localhost:6379";
export const REDIS_DB = process.env.REDIS_DB || "0";
export const START_GROUP_URL = (username: string, text = "mochi") =>
  `https://t.me/${username}?startgroup=${text}`;
export const START_URL = (username: string, text = "mochi") =>
  `https://t.me/${username}?start=${text}`;
export const DISCORD_AUTH_URL = (code: string) =>
  `${API_PROFILE_SERVER_URL}/profiles/auth/discord?code=${code}`;

export const PROFILE_ACTIVITY = [0, 1, 2, 3, 4, 5, 6, 7];
export const PAY_ACTIVITY = [8, 9, 10, 11, 12, 13];

export enum StartEvent {
  DiscordConnected = "discordconnected",
  AskConnectDiscord = "askconnectdiscord",
}

export enum ProductBotCommandScope {
  PRODUCT_BOT_COMMAND_SCOPE_PUBLIC = 0,
  PRODUCT_BOT_COMMAND_SCOPE_PRIVATE_ONLY = 1,
  PRODUCT_BOT_COMMAND_SCOPE_PUBLIC_ONLY = 2,
}
