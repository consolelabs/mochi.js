import type { Profile as MochiProfile, Vault } from "@consolelabs/mochi-rest";
import {
  DISCORD_PROFILE,
  HOMEPAGE,
  MOCHI_PROFILE_API,
  TELEGRAM_PROFILE,
} from "./constant";
import { name as pkgName } from "../package.json";

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
    | Platform.Email
    | Platform.Facebook
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
  Facebook = "facebook",
  //
  Email = "email",
}

const PLATFORM_EMOJI_PREFIX = new Proxy(
  {
    [Platform.Discord]: "👾",
    [Platform.Telegram]: "🔹",
    [Platform.Twitter]: "🐦",
    [Platform.Facebook]: "👤",
    [Platform.App]: "🔌",
    [Platform.Mochi]: "🍡",
    [Platform.Vault]: "🏦",
    [Platform.Email]: "📩",
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
    [Platform.Facebook]: "fb:",
    [Platform.App]: "app:",
    [Platform.Mochi]: "mochi:",
    [Platform.Vault]: "vault:",
    [Platform.Email]: "",
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

export function render(
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
    [Platform.Email]: email(pA, on),
  };
  const accountB = {
    [Platform.Telegram]: telegram(pB, on),
    [Platform.Discord]: discord(pB, on),
    [Platform.Mochi]: mochi(pB, on),
    [Platform.App]: application(pB, on),
    [Platform.Vault]: vault(pB, on),
    [Platform.Email]: email(pB, on),
  };

  let fallbackOrder: Array<
    | Platform.App
    | Platform.Mochi
    | Platform.Telegram
    | Platform.Discord
    | Platform.Vault
    | Platform.Email
  >;
  switch (on) {
    case Platform.Web:
      fallbackOrder = [
        Platform.Vault,
        Platform.App,
        Platform.Discord,
        Platform.Telegram,
        Platform.Email,
        Platform.Mochi,
      ];
      break;
    case Platform.Discord:
      fallbackOrder = [
        Platform.Vault,
        Platform.App,
        Platform.Discord,
        Platform.Telegram,
        Platform.Email,
        Platform.Mochi,
      ];
      break;
    case Platform.Telegram:
      fallbackOrder = [
        Platform.Vault,
        Platform.App,
        Platform.Telegram,
        Platform.Discord,
        Platform.Email,
        Platform.Mochi,
      ];
      break;
    default:
      throw new Error(`${pkgName}: platform not supported`);
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

export async function resolve(
  on: Platform.Web | Platform.Discord | Platform.Telegram,
  A: string | { id: string; type: "vault" },
  B = A
) {
  let pA: Profile, pB: Profile;
  if (typeof A === "string") {
    const data = await fetchProfile(A);
    pA = data;
  } else {
    const data = await fetchVault(A.id);
    pA = data;
  }

  if (typeof B === "string") {
    const data = await fetchProfile(B);
    pB = data;
  } else {
    const data = await fetchVault(B.id);
    pB = data;
  }

  return render(on, pA, pB);
}

// internals
//
//
//
async function fetchProfile(pId: string): Promise<MochiProfile | null> {
  try {
    const res = await fetch(`${MOCHI_PROFILE_API}/profiles/${pId}`);
    const json = await res.json();
    return json;
  } catch (e: any) {
    console.error(`${pkgName}: error fetching profile ${pId} ${e}`);
    return null;
  }
}

async function fetchVault(vId?: string | number): Promise<Vault | null> {
  try {
    if (!vId) return null;
    const res = await fetch(`${MOCHI_PROFILE_API}/vault/${vId}`);
    const json = await res.json();
    return json;
  } catch (e: any) {
    console.error(`${pkgName}: error fetching vault ${vId} ${e}`);
    return null;
  }
}

function email(p?: Profile, on = Platform.Email): UsernameFmt {
  try {
    if (!p || !isMochiProfile(p) || isApplication(p) || isVault(p))
      return { plain: "", value: "", id: "", url: "" };

    const email = p.associated_accounts?.find(
      (aa) => aa.platform === Platform.Email
    );

    const textPrefix = ![Platform.Email, Platform.Web].includes(on)
      ? PLATFORM_PREFIX["email"]
      : "";
    const emojiPrefix =
      on !== Platform.Email ? PLATFORM_EMOJI_PREFIX["email"] : "";

    if (!email || !email.platform_identifier)
      return {
        plain: "",
        value: "",
        id: "",
        url: "",
      };

    return {
      id: email.platform_identifier,
      url: `${HOMEPAGE}/profile/${p.id}`,
      value:
        on === Platform.Email
          ? email.platform_identifier
          : `${on === Platform.Discord ? "\\" : ""}${emojiPrefix}${
              emojiPrefix ? " " : ""
            }[${textPrefix}${email.platform_identifier}](${HOMEPAGE}/profile/${
              p.id
            })`,
      plain: `${on === Platform.Discord ? "\\" : ""}${emojiPrefix}${
        emojiPrefix ? " " : ""
      }${textPrefix}${email.platform_identifier}`,
      platform: Platform.Email,
    };
  } catch (e) {
    return { plain: "", value: "", id: "", url: "" };
  }
}

function vault(p?: Profile, on = Platform.Vault): UsernameFmt {
  try {
    if (!p || isMochiProfile(p))
      return { plain: "", value: "", id: "", url: "" };

    const textPrefix = ![Platform.Vault, Platform.Web].includes(on)
      ? PLATFORM_PREFIX["mochi-vault"]
      : "";
    const emojiPrefix =
      on !== Platform.Vault ? PLATFORM_EMOJI_PREFIX["mochi-vault"] : "";

    return {
      value: `${on === Platform.Discord ? "\\" : ""}${emojiPrefix}${
        emojiPrefix ? " " : ""
      }[${textPrefix}${p.name}](${HOMEPAGE}/vaults/${p.id})`,
      plain: `${on === Platform.Discord ? "\\" : ""}${emojiPrefix}${
        emojiPrefix ? " " : ""
      }${textPrefix}${p.name}`,
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
    const textPrefix = ![Platform.App, Platform.Web].includes(on)
      ? PLATFORM_PREFIX["mochi-application"]
      : "";
    const emojiPrefix =
      on !== Platform.App ? PLATFORM_EMOJI_PREFIX["mochi-application"] : "";

    if (application && p.type === "application") {
      return {
        value: `${on === Platform.Discord ? "\\" : ""}${emojiPrefix}${
          emojiPrefix ? " " : ""
        }[${textPrefix}${application.name}](${HOMEPAGE}/apps/${
          application.id
        })`,
        plain: `${on === Platform.Discord ? "\\" : ""}${emojiPrefix}${
          emojiPrefix ? " " : ""
        }${textPrefix}${application.name}`,
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

    const discord = p.associated_accounts?.find(
      (aa) => aa.platform === Platform.Discord
    );

    const textPrefix = ![Platform.Discord, Platform.Web].includes(on)
      ? PLATFORM_PREFIX["discord"]
      : "";
    const emojiPrefix =
      on !== Platform.Discord ? PLATFORM_EMOJI_PREFIX["discord"] : "";

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
          : `${emojiPrefix} [${textPrefix}${discord.platform_metadata.username}](${HOMEPAGE}/profile/${p.id})`,
      plain: `${emojiPrefix}${emojiPrefix ? " " : ""}${textPrefix}${
        discord.platform_metadata.username
      }`,
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

    const telegram = p.associated_accounts?.find(
      (aa) => aa.platform === Platform.Telegram
    );

    const textPrefix = ![Platform.Telegram, Platform.Web].includes(on)
      ? PLATFORM_PREFIX["telegram"]
      : "@";
    const emojiPrefix =
      on !== Platform.Telegram ? PLATFORM_EMOJI_PREFIX["telegram"] : "";

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
      value: `${on === Platform.Discord ? "\\" : ""}${emojiPrefix}${
        emojiPrefix ? " " : ""
      }[${textPrefix}${
        telegram.platform_metadata.username
      }](${HOMEPAGE}/profile/${p.id})`,
      plain: `${on === Platform.Discord ? "\\" : ""}${emojiPrefix}${
        emojiPrefix ? " " : ""
      }${textPrefix}${telegram.platform_metadata.username}`,
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

    const textPrefix = ![Platform.Mochi, Platform.Web].includes(on)
      ? PLATFORM_PREFIX["mochi-profile"]
      : "";
    const emojiPrefix =
      on !== Platform.Mochi ? PLATFORM_EMOJI_PREFIX["mochi-profile"] : "";

    return {
      value: `${on === Platform.Discord ? "\\" : ""}${emojiPrefix}${
        emojiPrefix ? " " : ""
      }[${textPrefix}${p.profile_name || p.id}](${HOMEPAGE} /profile/${p.id})`,
      plain: `${on === Platform.Discord ? "\\" : ""}${emojiPrefix}${
        emojiPrefix ? " " : ""
      }${textPrefix}${p.profile_name || p.id} `,
      platform: Platform.Mochi,
      id: p.id,
      url: `${HOMEPAGE} /profile/${p.id} `,
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
