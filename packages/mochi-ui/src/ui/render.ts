import { DISCORD_PROFILE, HOMEPAGE, TELEGRAM_PROFILE } from "../constant";
import type { Profile as MochiProfile, Vault } from "@consolelabs/mochi-rest";

export type Profile = MochiProfile | Vault | null;

export type UsernameFmt = {
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
    | Platform.Vault
    | null;
};

export enum Platform {
  Web = "mochi-web",
  Mochi = "mochi-profile",
  App = "mochi-application",
  Vault = "mochi-vault",
  //
  EvmChain = "evm-chain",
  SolanaChain = "solana-chain",
  SuiChain = "sui-chain",
  RoninChain = "ronin-chain",
  AptosChain = "aptos-chain",
  NearChain = "near-chain",
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
    [Platform.Vault]: "🏦",
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
    [Platform.Vault]: "vault:",
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

export default function render(
  on: Platform.Web | Platform.Discord | Platform.Telegram,
  pA: Profile,
  pB = pA
): [UsernameFmt, UsernameFmt] | [] {
  const accountA = {
    [Platform.Telegram]: telegram(pA, on),
    [Platform.Discord]: discord(pA, on),
    [Platform.Mochi]: mochi(pA, on),
    [Platform.App]: application(pA, on),
    [Platform.Vault]: vault(pA, on),
  };
  const accountB = {
    [Platform.Telegram]: telegram(pB, on),
    [Platform.Discord]: discord(pB, on),
    [Platform.Mochi]: mochi(pB, on),
    [Platform.App]: application(pB, on),
    [Platform.Vault]: vault(pB, on),
  };

  let fallbackOrder: Array<
    | Platform.App
    | Platform.Mochi
    | Platform.Telegram
    | Platform.Discord
    | Platform.Vault
  >;
  switch (on) {
    case Platform.Web:
      fallbackOrder = [
        Platform.Vault,
        Platform.App,
        Platform.Discord,
        Platform.Telegram,
        Platform.Mochi,
      ];
      break;
    case Platform.Discord:
      fallbackOrder = [
        Platform.Vault,
        Platform.App,
        Platform.Discord,
        Platform.Telegram,
        Platform.Mochi,
      ];
      break;
    case Platform.Telegram:
      fallbackOrder = [
        Platform.Vault,
        Platform.App,
        Platform.Telegram,
        Platform.Discord,
        Platform.Mochi,
      ];
      break;
    default:
      throw new Error("MochiUI: platform not supported");
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

  return [mochi(pA, on), mochi(pB, on)];
}

function vault(p?: Profile, on = Platform.Vault): UsernameFmt {
  try {
    if (!p || "profile_name" in p)
      return { plain: "", value: "", id: "", url: "" };

    const textPrefix =
      on !== Platform.Vault ? PLATFORM_PREFIX["mochi-vault"] : "";
    const emojiPrefix =
      on !== Platform.Vault ? PLATFORM_EMOJI_PREFIX["mochi-vault"] : "";
    let prefix =
      on === Platform.Web ? `${emojiPrefix} ` : `${emojiPrefix} ${textPrefix}`;

    prefix = prefix.trimStart();

    return {
      value: `[${prefix}${p.name}](${HOMEPAGE}/vaults/${p.id})`,
      plain: `${prefix}${p.name}`,
      id: p.id.toString(),
      url: `${HOMEPAGE}/vaults/${p.id}`,
      platform: Platform.Vault,
    };
  } catch (e) {
    return { plain: "", value: "", id: "", url: "" };
  }
}

function application(p?: Profile, on = Platform.App): UsernameFmt {
  try {
    if (!p || !isMochiProfile(p))
      return { plain: "", value: "", id: "", url: "" };

    const application = p.application;
    const textPrefix =
      on !== Platform.App ? PLATFORM_PREFIX["mochi-application"] : "";
    const emojiPrefix =
      on !== Platform.App ? PLATFORM_EMOJI_PREFIX["mochi-application"] : "";
    let prefix =
      on === Platform.Web ? `${emojiPrefix} ` : `${emojiPrefix} ${textPrefix}`;

    prefix = prefix.trimStart();

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

function discord(p?: Profile, on = Platform.Discord): UsernameFmt {
  try {
    if (!p || !isMochiProfile(p) || isApplication(p) || isVault(p))
      return { plain: "", value: "", id: "", url: "" };

    const discord = p.associated_accounts.find(
      (aa) => aa.platform === Platform.Discord
    );

    const textPrefix =
      on !== Platform.Discord ? PLATFORM_PREFIX["discord"] : "@";
    const emojiPrefix =
      on !== Platform.Discord ? PLATFORM_EMOJI_PREFIX["discord"] : "";
    let prefix =
      on === Platform.Web ? `${emojiPrefix} ` : `${emojiPrefix} ${textPrefix}`;

    prefix = prefix.trimStart();

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
      value:
        on === Platform.Discord
          ? `<@${discord.platform_identifier}>`
          : `[${prefix}${discord.platform_metadata.username}](${HOMEPAGE}/profile/${p.id})`,
      plain: `${prefix}${discord.platform_metadata.username}`,
      platform: Platform.Discord,
    };
  } catch (e) {
    return { plain: "", value: "", id: "", url: "" };
  }
}

function telegram(p?: Profile, on = Platform.Telegram): UsernameFmt {
  try {
    if (!p || !isMochiProfile(p) || isApplication(p) || isVault(p))
      return { plain: "", value: "", id: "", url: "" };

    const telegram = p.associated_accounts.find(
      (aa) => aa.platform === Platform.Telegram
    );

    const textPrefix =
      on !== Platform.Telegram ? PLATFORM_PREFIX["telegram"] : "@";
    const emojiPrefix =
      on !== Platform.Telegram ? PLATFORM_EMOJI_PREFIX["telegram"] : "";
    let prefix =
      on === Platform.Web ? `${emojiPrefix} ` : `${emojiPrefix} ${textPrefix}`;

    prefix = prefix.trimStart();

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

function mochi(p?: Profile | null, on = Platform.Mochi): UsernameFmt {
  try {
    if (!p || !isMochiProfile(p))
      return { plain: "", value: "", id: "", url: "" };

    const textPrefix =
      on !== Platform.Mochi ? PLATFORM_PREFIX["mochi-profile"] : "";
    const emojiPrefix =
      on !== Platform.Mochi ? PLATFORM_EMOJI_PREFIX["mochi-profile"] : "";
    let prefix =
      on === Platform.Web ? `${emojiPrefix} ` : `${emojiPrefix} ${textPrefix}`;

    prefix = prefix.trimStart();

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

function isMochiProfile(p: Exclude<Profile, null>): p is MochiProfile {
  return "profile_name" in p;
}

function isApplication(
  p: Exclude<Profile, null>
): p is Extract<MochiProfile, { type: "application" }> {
  return "type" in p && p.type === "application";
}

function isVault(
  p: Exclude<Profile, null>
): p is Extract<MochiProfile, { type: "vault" }> {
  return "type" in p && p.type === "vault";
}