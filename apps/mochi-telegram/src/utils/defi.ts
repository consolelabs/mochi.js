import { mochiApi, payApi, profileApi } from "adapters";
import { mtproto } from "tdlib";
import { Context } from "telegraf";
import { stringUtils } from "utils";
import ms from "ms";
import { parseUnits, toBigInt } from "ethers";
import { isEmpty } from "lodash";
import { utils } from "@consolelabs/mochi-formatter";
import { ResponseMonikerConfigData } from "types/api";

export function parseTickerQuery(q: string) {
  const fiats = ["gbp", "usd", "eur", "sgd", "vnd"];
  q = q.toLowerCase();
  let isCompare = false;
  let isFiat = false;
  let [base, target] = q.split("/");
  if (target) {
    isCompare = true;
    isFiat = fiats.includes(base) && fiats.includes(target);
  } else {
    const fiatBase = fiats.find((f) => q.startsWith(f));
    if (fiatBase) {
      const fiatTarget = q.substring(fiatBase.length) || "usd";
      isFiat = fiats.includes(fiatBase) && fiats.includes(fiatTarget);
      base = isFiat ? fiatBase : q;
      target = isFiat ? fiatTarget : "";
      isCompare = isFiat;
    }
  }
  return { isCompare, isFiat, base, target };
}

/**
 * Returns the truncated amount if the inputted amount is automatically rounded.
 * Else returns the inputted amount
 * @param amountArg: inputted amount
 * @param decimal: token decimals
 */
export function truncateAmountDecimal(amountArg: string, decimal = 18): string {
  const amount = Number(amountArg);
  const formatted = utils.formatDigit({
    value: amount.toString(),
    fractionDigits: decimal,
    withoutCommas: true,
  });
  if (amountArg === formatted) return amountArg;

  // if the inputted amount and the formatted amount is not the same,
  // that means the formatted amount is automatically rounded so we have to truncate it
  // instead of rounding to avoid insufficient balance error
  let result = "";
  let truncated = false;
  for (let i = 0; i < amountArg.length; i++) {
    result += truncated ? "0" : amountArg.charAt(i);
    truncated = amountArg.charAt(i) !== formatted.charAt(i);
  }
  return result;
}

// 1ftm, 20butt, 0.2eth, etc...
const amountUnitNoSpaceRegEx = /^(\d+\.*\d*)(\D+)$/i;

function parseTipAmount(
  amountArg: string,
  options: { allowDynamicAmount: boolean }
):
  | { valid: false; error: string }
  | {
      valid: true;
      error: undefined;
      amount: number;
      unit?: string;
      all: boolean;
    } {
  const result: {
    valid: true;
    error: undefined;
    amount: number;
    unit?: string;
    all: boolean;
  } = {
    error: undefined,
    valid: true,
    amount: parseFloat(amountArg),
    all: false,
  };
  switch (true) {
    // a, an = 1
    case ["a", "an"].includes(amountArg.toLowerCase()):
      result.amount = 1;
      break;

    // tip all, let BE calculate amount
    case options.allowDynamicAmount && stringUtils.equal("all", amountArg):
      result.amount = 0;
      result.all = true;
      break;

    case amountUnitNoSpaceRegEx.test(amountArg): {
      const regExResult = amountArg.match(amountUnitNoSpaceRegEx);
      if (!regExResult) {
        return {
          valid: false,
          error: "Please specify a positive number",
        };
      }

      const [amount, unit] = regExResult.slice(1);
      const truncated = truncateAmountDecimal(amount);
      result.amount = parseFloat(truncated);
      result.unit = unit;
      break;
    }

    // invalid amount
    case isNaN(result.amount) || result.amount <= 0:
      return {
        valid: false,
        error: "Please specify a positive number",
      };

    default: {
      const truncated = truncateAmountDecimal(amountArg);
      result.amount = parseFloat(truncated);
    }
  }

  return result;
}

async function parseMoniker(moniker: string) {
  const { data = [] } = await mochiApi.configDefi.getDefaultMonikers();
  const match = (v: ResponseMonikerConfigData) => {
    const tmp = v.moniker?.moniker;
    if (!tmp) return;
    const sym = v.moniker?.token?.token_symbol;
    if (!sym) return;
    const plural = v.moniker?.plural;
    return (
      stringUtils.equal(moniker, tmp) ||
      stringUtils.equal(moniker, plural || "")
    );
  };
  return data.find(match);
}

function isWithinDecimalRange(str: string, decimal: number) {
  const s = utils.formatDigit({ value: str, fractionDigits: decimal });
  if (s === "0") return false;
  const numOfFracDigits = s.split(".")[1]?.length ?? 0;
  return numOfFracDigits <= decimal;
}

enum ValidTargetSpecifier {
  All = "all",
  // Online = "online",
}

const TARGET_TEXT_SELECTOR_MAPPINGS: Array<[string, ValidTargetSpecifier]> = [
  //
  // ["online", ValidTargetSpecifier.Online],
  ["all", ValidTargetSpecifier.All],
];

// enum UserStatus {
//   UserStatusEmpty = "userStatusEmpty",
//   UserStatusOnline = "userStatusOnline",
//   UserStatusOffline = "userStatusOffline",
//   UserStatusRecently = "userStatusRecently",
//   UserStatusLastWeek = "userStatusLastWeek",
//   UserStatusLastMonth = "userStatusLastMonth",
// }

export function parseTarget<T extends { toId: string[]; to: string[] }>(
  ctx: Context
) {
  return async function (payload: T) {
    if (payload.to.at(0)?.startsWith("@")) return payload;
    const selector = TARGET_TEXT_SELECTOR_MAPPINGS.find((s) =>
      stringUtils.equal(payload.to.at(0) ?? "", s[0])
    );
    if (selector) {
      const [, specifier] = selector;
      if (ctx.chat?.type === "group")
        throw new Error("This command requires running in a public group");
      let users =
        ctx.state.chat?.users.filter(
          (u: any) =>
            !u.bot && !stringUtils.equal(String(u.id), String(ctx.from?.id))
        ) ?? [];

      switch (specifier) {
        case ValidTargetSpecifier.All: {
          break;
        }
        // case ValidTargetSpecifier.Online: {
        //   const validOnlineStatus = [UserStatus.UserStatusOnline];
        //   users = users.filter((u: any) =>
        //     validOnlineStatus.includes(u.status._),
        //   );
        //   break;
        // }
        default:
          throw new Error(
            "Mochi doesn't understand who you're referring to, try again?"
          );
      }

      payload.toId = users.map((u: any) => u.id);
      payload.to = users.map((u: any) => `@${u.username}`);

      return payload;
    }

    throw new Error(
      "Mochi doesn't understand who you're referring to, try again?"
    );
  };
}

export function parseMaxEntries<
  T extends { maxEntries: number; rest: string[] }
>() {
  return async function (payload: T) {
    const regex = /for\s+(\d+)(\s+|$)/g;
    const str = payload.rest.join(" ");
    const result = regex.exec(str);
    if (result) {
      const maxEntries = Number(result.at(1));

      if (Number.isNaN(maxEntries))
        throw new Error(
          "Mochi couldn't understand how many people can join this airdrop, try again?"
        );

      if (maxEntries <= 0)
        throw new Error(
          "There must be at least one person to claim this airdrop, try again?"
        );

      payload.maxEntries = maxEntries;
    }
    return payload;
  };
}

export function parseDuration<
  T extends { durationMs: number; rest: string[] }
>() {
  return async function (payload: T) {
    const regex = /in\s+(\d+(h|m|s))/g;
    const str = payload.rest.join(" ");
    const result = regex.exec(str);
    const duration = result?.at(1);
    if (duration) {
      const durationMs = ms(duration);
      if (!durationMs)
        throw new Error(
          "Mochi couldn't understand how long this airdrop will be, try again?"
        );

      // max 1 hour
      if (durationMs > 1 * 60 * 60 * 1000)
        throw new Error("Airdrop should only happen in maximum 1 hour long");

      payload.durationMs = durationMs;
    }
    return payload;
  };
}

export function validateSymbol<T extends { symbol: string }>() {
  return async function (payload: T) {
    if (!payload.symbol)
      throw new Error(
        "Mochi doesn't understand which token you're referring to, try again?"
      );

    return payload;
  };
}

export function validateReceiver<
  T extends {
    args: string[];
    to: string[];
    amount: number | string;
    symbol: string;
    message: string;
  }
>() {
  return async function (payload: T) {
    let idx = 0;
    const to = new Set<string>();

    for (let arg of payload.args) {
      if (
        arg.startsWith("@") ||
        [ValidTargetSpecifier.All].some((t) => stringUtils.equal(t, arg))
      ) {
        to.add(arg);
        idx++;
      }
    }

    payload.to = Array.from(to);
    const args = payload.args.slice(idx);
    const amount = args[0];
    const symbol = args[1];
    const message = args.slice(2).join(" ");

    payload.amount = amount;
    payload.symbol = symbol;
    payload.message = message;

    return payload;
  };
}

export function parseReceiver<T extends { to: string[]; toId: string[] }>() {
  return async function (payload: T) {
    if (payload.toId.length) return payload;
    try {
      const toId = await Promise.all(
        payload.to.map(async (t: string) => {
          const peer = await mtproto
            .call("contacts.resolveUsername", {
              username: t.slice(1),
            })
            .catch(() => {
              throw new Error();
            });
          const user = peer.users.at(0);
          if (user.bot) {
            throw new Error("You cannot tip a bot");
          }

          return peer.peer.user_id;
        })
      );
      payload.toId = toId;
      return payload;
    } catch (e: any) {
      throw new Error(e.message || "Couldn't get user data");
    }
  };
}

export function parseSymbol<T extends { amount: number; symbol: string }>() {
  return async function (payload: T) {
    const data = await payApi.getTokens(payload.symbol);
    if (!data.length) {
      // try to parse for moniker
      const moniker = await parseMoniker(payload.symbol);
      const monikerAmount = moniker?.moniker?.amount;
      const symbol = moniker?.moniker?.token?.token_symbol?.toUpperCase();
      if (!monikerAmount || !symbol) {
        throw new Error(
          [
            `*${payload.symbol.toUpperCase()}* hasn't been supported`,
            "Mochi doesn't understand which token/moniker you referring to, try again?",
          ].join("\n")
        );
      }
      payload.amount *= monikerAmount;
      payload.symbol = symbol;
    }

    return payload;
  };
}

export function parseAmount<
  T extends { all: boolean; amount: number; symbol: string }
>(
  _ctx: Context,
  options: {
    // dynamic = not determined at the time of running e.g "all", "half", "1/3", etc...
    allowDynamicAmount: boolean;
  } = { allowDynamicAmount: true }
) {
  return async function (payload: T) {
    const result = parseTipAmount(
      payload.amount.toLocaleString().replaceAll(",", ""),
      options
    );
    if (!result.valid) throw new Error(result.error);
    const { amount, unit, all } = result;

    payload.all = all;
    payload.amount = amount;
    payload.symbol = unit?.toUpperCase() || payload.symbol.toUpperCase();

    return payload;
  };
}

export function parseMessage<T extends { message: string }>() {
  return async function (payload: T) {
    payload.message = (payload.message ?? "")
      .replaceAll('"', "")
      .replaceAll("”", "")
      .replaceAll("“", "")
      .replaceAll("'", "")
      .trim();

    return payload;
  };
}

export function checkTokenDecimal<
  T extends { symbol: string; amount: number; token: any }
>() {
  return async function (payload: T) {
    // no token info, auto reject if larger than 6 decimal
    if (isEmpty(payload.token)) {
      const fraction = payload.amount
        .toLocaleString()
        .replaceAll(",", "")
        .split(".")
        .at(1);
      if (fraction && fraction.length >= 6)
        throw new Error(
          `${payload.symbol} valid amount must not have more than ${payload.token.decimal} fractional digits.`
        );
    } else {
      const isDecimalValid = isWithinDecimalRange(
        payload.amount.toLocaleString().replaceAll(",", ""),
        payload.token.decimal
      );
      if (!isDecimalValid)
        throw new Error(
          `${
            payload.token.symbol || payload.symbol
          } valid amount must not have more than ${
            payload.token.decimal ?? 6
          } fractional digits.`
        );
    }

    return payload;
  };
}

export function checkBalance<
  T extends { amount: number; symbol: string; token: any }
>(ctx: Context) {
  return async function (payload: T) {
    const userId = ctx.from?.id;
    const profile = await profileApi.getByTelegram(userId?.toString() ?? "");
    const balances = await payApi.mochiWallet.getOffchainBalances(
      profile.id,
      payload.symbol
    );
    const filtered = balances?.filter((b: any) => b.amount !== "0") || [];
    if (!filtered.length)
      throw new Error(
        `Insufficient balance for token ${payload.symbol.toUpperCase()}`
      );
    if (filtered.length > 1)
      throw new Error("Duplicated tokens with same symbol found");

    const balance = filtered.at(0);
    if (
      toBigInt(balance.amount) <
      parseUnits(
        payload.amount.toLocaleString().replaceAll(",", ""),
        balance.token.decimal
      )
    )
      throw new Error(
        `Insufficient balance for token ${payload.symbol.toUpperCase()}`
      );

    payload.token = balance.token;
    return payload;
  };
}

export function validatePlatform<
  T extends { target: string; platform: string }
>() {
  return async function (payload: T) {
    if (!payload.platform && !payload.target) return payload;

    const allowedPlatforms = ["mail", "discord", "telegram"];

    if (payload.target !== "" && !allowedPlatforms.includes(payload.platform)) {
      throw new Error(
        "Invalid platform, please choose in: mail, discord, telegram\ne.g `/payme 1 eth @vincent telegram thanks fren `"
      );
    }

    if (stringUtils.equal(payload.platform, "discord")) {
      const pfRes = await profileApi.getByDiscord(
        payload.target.replace("@", "")
      );
      if (!pfRes.ok) {
        throw new Error("Invalid target");
      }
      payload.target = pfRes.id;
      return payload;
    }

    // telegram
    if (stringUtils.equal(payload.platform, "telegram")) {
      const pfRes = await profileApi.getByTelegramUsername(
        payload.target.replace("@", "")
      );
      if (pfRes.err) {
        throw new Error(`Couldn't get user info`);
      }

      payload.target = pfRes.id;
      return payload;
    }

    //email
    if (stringUtils.equal(payload.platform, "mail")) {
      const pfRes = await profileApi.getByEmail(payload.target);
      if (pfRes.err) {
        throw new Error("Invalid target");
      }
      payload.target = pfRes.id;
      return payload;
    }
    return payload;
  };
}
