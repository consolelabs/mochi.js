import { DISCORD_PROFILE, HOMEPAGE, TELEGRAM_PROFILE } from "./constant";
import components from "./components";
import Redis from "ioredis";
import api from "./api";
import type { Profile } from "@consolelabs/mochi-rest";

export enum Platform {
  Web = "mochi-web",
  Mochi = "mochi-profile",
  App = "mochi-application",
  //
  EvmChain = "evm-chain",
  SolanaChain = "solana-chain",
  SuiChain = "sui-chain",
  RoninChain = "ronin-chain",
  //
  Twitter = "twitter",
  Discord = "discord",
  Telegram = "telegram",
}

const PLATFORM_EMOJI_PREFIX = new Proxy(
  {
    [Platform.Discord]: "👾",
    [Platform.Telegram]: "🔹",
    [Platform.Twitter]: "🐦",
    [Platform.App]: "🔌",
    [Platform.Mochi]: "🍡",
  },
  {
    get(obj, prop) {
      const key = prop as keyof typeof obj;
      if (!obj[key]) return "";
      return obj[key];
    },
    set() {
      return true;
    },
  }
);

const PLATFORM_PREFIX = new Proxy(
  {
    [Platform.Discord]: "dsc:",
    [Platform.Telegram]: "tg:",
    [Platform.Twitter]: "tw:",
    [Platform.App]: "app:",
    [Platform.Mochi]: "mochi:",
  },
  {
    get(obj, prop) {
      const key = prop as keyof typeof obj;
      if (!obj[key]) return "";
      return obj[key];
    },
    set() {
      return true;
    },
  }
);

type UsernameFmt = {
  // always markdown link
  value: string;
  id: string;
  url: string;
  plain: string;
  platform?:
    | Platform.App
    | Platform.Mochi
    | Platform.Discord
    | Platform.Telegram
    | Platform.Twitter
    | null;
};

export const UI: {
  components: typeof components;
  redis: Redis | null;
  useRedis: (r: Redis) => void;
  account: (
    on: Platform.Web | Platform.Discord | Platform.Telegram,
    pIdA: string,
    pIdB?: string
  ) => Promise<[UsernameFmt, UsernameFmt] | []>;
} = {
  components,
  redis: null,
  useRedis: function (redis: Redis) {
    this.redis = redis;
  },
  account: async function (on, pIdA, pIdB = pIdA) {
    const { data: pA } = await api.profile.mochi.getById(pIdA);
    const { data: pB } = await api.profile.mochi.getById(pIdB);

    const accountA = {
      [Platform.Telegram]: await telegram(pA, on),
      [Platform.Discord]: await discord(pA, on),
      [Platform.Mochi]: await mochi(pA, on),
      [Platform.App]: await application(pA, on),
    };
    const accountB = {
      [Platform.Telegram]: await telegram(pB, on),
      [Platform.Discord]: await discord(pB, on),
      [Platform.Mochi]: await mochi(pB, on),
      [Platform.App]: await application(pB, on),
    };

    let fallbackOrder: Array<
      Platform.App | Platform.Mochi | Platform.Telegram | Platform.Discord
    >;
    switch (on) {
      case Platform.Web:
        fallbackOrder = [
          Platform.App,
          Platform.Mochi,
          Platform.Discord,
          Platform.Telegram,
        ];
        break;
      case Platform.Discord:
        fallbackOrder = [
          Platform.App,
          Platform.Discord,
          Platform.Telegram,
          Platform.Mochi,
        ];
        break;
      case Platform.Telegram:
        fallbackOrder = [
          Platform.App,
          Platform.Telegram,
          Platform.Discord,
          Platform.Mochi,
        ];
        break;
      default:
        throw new Error("MochiFormatter: platform not supported");
    }

    let userA,
      userB,
      firstSamePlatform: [UsernameFmt, UsernameFmt] | null = null;
    for (const platform of fallbackOrder) {
      const tmpUserA = accountA[platform];
      const tmpUserB = accountB[platform];

      if (!userA && tmpUserA.platform) {
        userA = tmpUserA;
      }
      if (!userB && tmpUserB.platform) {
        userB = tmpUserB;
      }
      if (userA && userB) return [userA, userB];
      if (
        tmpUserA.platform &&
        tmpUserB.platform &&
        tmpUserA.platform === tmpUserB.platform
      ) {
        firstSamePlatform = [tmpUserA, tmpUserB];
      }
    }

    if (firstSamePlatform) return firstSamePlatform;

    return [await mochi(pA, on, true), await mochi(pB, on, true)];
  },
};

async function application(
  p?: Profile | null,
  on = Platform.App
): Promise<UsernameFmt> {
  try {
    if (!p) return { plain: "", value: "", id: "", url: "" };

    const application = p.application;
    const textPrefix =
      on !== Platform.App ? PLATFORM_PREFIX["mochi-application"] : "";
    const emojiPrefix =
      on !== Platform.App ? PLATFORM_EMOJI_PREFIX["mochi-application"] : "";
    const prefix =
      on === Platform.Web ? `${emojiPrefix} ` : `${emojiPrefix} ${textPrefix}`;

    if (application && p.type === "application") {
      return {
        value: `[${prefix}${application.name}](${HOMEPAGE}/apps/${application.id})`,
        plain: `${prefix}${application.name}`,
        id: application.id.toString(),
        url: `${HOMEPAGE}/apps/${application.id}`,
        platform: Platform.App,
      };
    }

    return {
      plain: "",
      value: "",
      id: "",
      url: "",
    };
  } catch (e) {
    return { plain: "", value: "", id: "", url: "" };
  }
}

async function discord(
  p?: Profile | null,
  on = Platform.Discord
): Promise<UsernameFmt> {
  try {
    if (!p) return { plain: "", value: "", id: "", url: "" };

    const discord = p.associated_accounts.find(
      (aa) => aa.platform === Platform.Discord
    );

    const textPrefix =
      on !== Platform.Discord ? PLATFORM_PREFIX["discord"] : "@";
    const emojiPrefix =
      on !== Platform.Discord ? PLATFORM_EMOJI_PREFIX["discord"] : "";
    const prefix =
      on === Platform.Web ? `${emojiPrefix} ` : `${emojiPrefix} ${textPrefix}`;

    if (!discord || !discord.platform_metadata.username)
      return {
        plain: "",
        value: "",
        id: "",
        url: "",
      };

    return {
      id: discord.platform_identifier,
      url: `${DISCORD_PROFILE}/${discord.platform_identifier}`,
      value: `[${prefix}${discord.platform_metadata.username}](${HOMEPAGE}/profile/${p.id})`,
      plain: `${prefix}${discord.platform_metadata.username}`,
      platform: Platform.Discord,
    };
  } catch (e) {
    return { plain: "", value: "", id: "", url: "" };
  }
}

async function telegram(
  p?: Profile | null,
  on = Platform.Telegram
): Promise<UsernameFmt> {
  try {
    if (!p) return { plain: "", value: "", id: "", url: "" };

    const telegram = p.associated_accounts.find(
      (aa) => aa.platform === Platform.Telegram
    );

    const textPrefix =
      on !== Platform.Telegram ? PLATFORM_PREFIX["telegram"] : "@";
    const emojiPrefix =
      on !== Platform.Telegram ? PLATFORM_EMOJI_PREFIX["telegram"] : "";
    const prefix =
      on === Platform.Web ? `${emojiPrefix} ` : `${emojiPrefix} ${textPrefix}`;

    if (!telegram || !telegram.platform_metadata.username)
      return {
        plain: "",
        id: "",
        url: "",
        value: "",
      };

    return {
      id: telegram.platform_identifier,
      url: `${TELEGRAM_PROFILE}${telegram.platform_identifier}`,
      value: `[${prefix}${telegram.platform_metadata.username}](${HOMEPAGE}/profile/${p.id})`,
      plain: `${prefix}${telegram.platform_metadata.username}`,
      platform: Platform.Telegram,
    };
  } catch (e) {
    return { plain: "", value: "", id: "", url: "" };
  }
}

async function mochi(
  p?: Profile | null,
  on = Platform.Mochi,
  useId = false
): Promise<UsernameFmt> {
  try {
    if (!p || (!p.profile_name && !useId))
      return { plain: "", value: "", id: "", url: "" };

    const textPrefix =
      on !== Platform.Mochi ? PLATFORM_PREFIX["mochi-profile"] : "";
    const emojiPrefix =
      on !== Platform.Mochi ? PLATFORM_EMOJI_PREFIX["mochi-profile"] : "";
    const prefix =
      on === Platform.Web ? `${emojiPrefix} ` : `${emojiPrefix} ${textPrefix}`;

    return {
      value: `[${prefix}${p.profile_name || p.id}](${HOMEPAGE}/profile/${
        p.id
      })`,
      plain: `${prefix}${p.profile_name || p.id}`,
      platform: Platform.Mochi,
      id: p.id,
      url: `${HOMEPAGE}/profile/${p.id}`,
    };
  } catch (e) {
    return { plain: "", value: "", id: "", url: "" };
  }
}
