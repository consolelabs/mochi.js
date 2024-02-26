import deepmerge from "deepmerge";
import baseWretch, { BaseModule, PayModule, ProfileModule } from "./modules";
import { Changelog, Command, Emoji } from "./schemas";
import { WretchError } from "wretch/resolver";
import { ZodError } from "zod";
import { WretchAddon } from "wretch/types";
import { PACKAGE_ID } from "./constant";

export interface Options {
  baseUrl: string;
  profileUrl: string;
  payUrl: string;

  catcher?: (error: WretchError | ZodError) => void;
  log?: boolean;
  addons?: WretchAddon<any>[];
}

const defaultOptions: Options = {
  log: true,
  addons: [],
  payUrl: "",
  baseUrl: "",
  profileUrl: "",
};

export class Mochi {
  _token: string | null = null;
  isReady: Promise<void> = new Promise(() => {});
  private opts: Options;
  url: Options = {
    payUrl: "",
    profileUrl: "",
    baseUrl: "",
  };
  base: BaseModule;
  profile: ProfileModule;
  pay: PayModule;
  mock: (jsonPath: string) => typeof baseWretch = (jsonPath) => {
    if ("mock" in this.base.api) {
      // @ts-ignore
      return this.base.api.mock(jsonPath);
    }

    throw new Error("You must pass MockAddon to API constructor first");
  };

  commands: Map<string, Command> = new Map();
  telegramAlias: Map<string, Command> = new Map();
  discordAlias: Map<string, Command> = new Map();
  whitelistTokens: Map<string, string> = new Map();

  private copy: { tip: string[]; fact: string[] } = { tip: [], fact: [] };
  changelogs: Changelog[] = [];
  fallbackCoinEmoji: Emoji = { code: "", emoji: "", emoji_url: "" };

  constructor(_opts: Options) {
    const opts = deepmerge(defaultOptions, _opts);
    this.opts = opts;
    this.base = new BaseModule(this.opts);
    this.profile = new ProfileModule(this.opts);
    this.pay = new PayModule(this.opts);
  }

  init() {
    const isReady = new Promise<void>(async (res, rej) => {
      const results = await Promise.allSettled([
        this.fetchCommandConfigs(),
        this.fetchProductCopy(),
        this.fetchChangelogs(),
        this.fetchWhitelistTokens(),
        this.fetchFallbackCoinEmoji(),
      ]);
      for (const res of results) {
        if (res.status === "rejected") {
          console.error(`[${PACKAGE_ID}] ${res.reason}`);
          rej(res.reason);
        }
      }
      res();
    });
    this.isReady = isReady;
    return isReady;
  }

  token(t?: string | null) {
    if (t) {
      this._token = t;
      this.base.token(t);
      this.profile.token(t);
      this.pay.token(t);
      return;
    }
    if (t === null) {
      this._token = null;
      this.base.token(null);
      this.profile.token(null);
      this.pay.token(null);
      return;
    }
    return this._token;
  }

  randomTip() {
    if (!this.copy.tip.length) return "";

    return (
      this.copy.tip.at(
        Math.floor(Math.random() * (this.copy.tip.length - 1))
      ) ?? ""
    );
  }

  randomFact() {
    if (!this.copy.fact.length) return "";

    return (
      this.copy.fact.at(
        Math.floor(Math.random() * (this.copy.fact.length - 1))
      ) ?? ""
    );
  }

  // can safely assume that key is profile id
  getLatestChangelog() {
    return this.changelogs.find((c) => !c.is_expired) ?? null;
  }

  isTokenWhitelisted(symbol: string, address: string): boolean {
    return this.whitelistTokens.get(symbol) === address;
  }

  private async fetchCommandConfigs() {
    const result = await this.base.metadata.getCommands();
    if (!result.ok) {
      throw new Error(`Cannot fetch command configs ${result.error}`);
    }
    this.commands = new Map(result.data.map((c) => [c.code.toLowerCase(), c]));
    for (const cmd of this.commands.values()) {
      let aliases: string[] = [];
      try {
        aliases = JSON.parse(cmd.telegram_alias ?? "[]");
        if (!Array.isArray(aliases)) {
          aliases = [aliases];
        }
      } catch (e) {
        aliases = [];
      }

      for (const alias of aliases) {
        this.telegramAlias.set(alias, cmd);
      }

      aliases = [];
      try {
        aliases = JSON.parse(cmd.discord_alias ?? "[]");
        if (!Array.isArray(aliases)) {
          aliases = [aliases];
        }
      } catch (e) {
        aliases = [];
      }
      for (const alias of aliases) {
        this.discordAlias.set(alias, cmd);
      }
    }
    console.info(`[${PACKAGE_ID}] Command config fetch OK`);
  }

  private async fetchProductCopy() {
    const result = await this.base.metadata.getCopy("header");
    if (!result.ok)
      throw new Error(`Cannot fetch product copy ${result.error}`);
    this.copy = result.data.description;
    console.info(`[${PACKAGE_ID}] Product copy fetch OK`);
  }

  private async fetchChangelogs() {
    const result = await this.base.metadata.getChangelogs();
    if (!result.ok)
      throw new Error(`Cannot fetch product changelogs ${result.error}`);
    this.changelogs = result.data.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();

      return timeB - timeA;
    });
    console.info(`[${PACKAGE_ID}] Product changelogs fetch OK`);
  }

  private async fetchWhitelistTokens() {
    const result = await this.pay.getWhiteListToken();
    if (!result.ok)
      throw new Error(`Cannot fetch whitelist tokens ${result.error}`);
    this.whitelistTokens = new Map(
      result.data.map((t) => [t.symbol, t.address])
    );
    console.info(`[${PACKAGE_ID}] Whitelist tokens fetch OK`);
  }

  private async fetchFallbackCoinEmoji() {
    const result = await this.base.metadata.getEmojis({ codes: ["COIN"] });
    const emoji = result.data?.at(0);
    if (!result.ok || !emoji)
      throw new Error(`Cannot fetch fallback coin emoji ${result.error}`);
    this.fallbackCoinEmoji = emoji;
    console.info(`[${PACKAGE_ID}] Fallback coin emoji fetch OK`);
  }
}
