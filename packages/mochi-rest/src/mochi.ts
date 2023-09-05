import deepmerge from "deepmerge";
import baseWretch, { BaseModule, PayModule, ProfileModule } from "./modules";
import { Changelog, Command } from "./schemas";
import { logger } from "./logger";
import { apiUrls } from "./constant";
import { WretchError } from "wretch/resolver";
import { ZodError } from "zod";
import { WretchAddon } from "wretch/types";

interface Options {
  apiKey?: string;
  preview?: boolean;
  catcher?: (error: WretchError | ZodError) => void;
  log?: boolean;
  addons?: WretchAddon<any>[];
}

export interface FullOptions extends Options {
  baseUrl: string;
  profileUrl: string;
  payUrl: string;
}

const defaultOptions: Options = {
  preview: false,
  log: true,
  addons: [],
};

export class Mochi {
  isReady: Promise<void> = new Promise(() => {});
  private opts: FullOptions;
  url: Pick<FullOptions, "baseUrl" | "profileUrl" | "payUrl"> = {
    payUrl: "",
    profileUrl: "",
    baseUrl: "",
  };
  base: BaseModule;
  profile: ProfileModule;
  pay: PayModule;
  mock: (jsonPath: string) => typeof baseWretch = (jsonPath) => {
    if ("mock" in baseWretch) {
      // @ts-ignore
      return baseWretch.mock(jsonPath);
    }

    throw new Error("You must pass MockAddon to API constructor first");
  };

  commands: Map<string, Command> = new Map();
  telegramAlias: Map<string, Command> = new Map();
  discordAlias: Map<string, Command> = new Map();
  whitelistTokens: Map<string, string> = new Map();

  private copy: { tip: string[]; fact: string[] } = { tip: [], fact: [] };
  changelogs: Changelog[] = [];

  constructor(_opts: Options) {
    const opts = deepmerge(defaultOptions, _opts);
    this.opts = deepmerge<FullOptions>(opts, {
      baseUrl: opts.preview
        ? apiUrls.preview.API_SERVER_URL
        : apiUrls.prod.API_SERVER_URL,
      profileUrl: opts.preview
        ? apiUrls.preview.API_PROFILE_SERVER_URL
        : apiUrls.prod.API_PROFILE_SERVER_URL,
      payUrl: opts.preview
        ? apiUrls.preview.API_PAY_SERVER_URL
        : apiUrls.prod.API_PAY_SERVER_URL,
    });
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
      ]);
      for (const res of results) {
        if (res.status === "rejected") {
          logger.error(res.reason);
          rej(res.reason);
        }
      }
      res();
    });
    this.isReady = isReady;
    return isReady;
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
  async getChangelogs(key: string, changelogId?: number) {
    const { ok, data, error } = await this.base.metadata.getChangelogView(key);
    if (!ok) throw new Error(error);

    const viewedFiles = new Set(data.map((d) => d.changelog_name));
    const allFiles = new Set(this.changelogs.map((c) => c.file_name));
    const newFiles = new Set([...allFiles].filter((f) => !viewedFiles.has(f)));

    const newChangelog = this.changelogs.find((c) => newFiles.has(c.file_name));
    let changelog: Changelog | null = null;

    if (!Number.isNaN(Number(changelogId)) && typeof changelogId === "number") {
      changelog =
        this.changelogs.at(
          Math.min(Math.max(changelogId, 1), this.changelogs.length)
        ) ?? null;
    } else {
      changelog = newChangelog ?? null;
    }

    return {
      hasNew: newFiles.size > 0,
      changelogContent: changelog,
      markRead: (name: string = "") =>
        (changelog?.file_name || name) &&
        this.base.metadata.markChangelogRead({
          key,
          changelogName: changelog?.file_name ?? name,
        }),
    };
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
    logger.info("Command config fetch OK");
  }

  private async fetchProductCopy() {
    const result = await this.base.metadata.getCopy("header");
    if (!result.ok)
      throw new Error(`Cannot fetch product copy ${result.error}`);
    this.copy = result.data.description;
    logger.info("Product copy fetch OK");
  }

  private async fetchChangelogs() {
    const result = await this.base.metadata.getChangelogs();
    if (!result.ok)
      throw new Error(`Cannot fetch product changelogs ${result.error}`);
    this.changelogs = result.data;
    logger.info("Product changelogs fetch OK");
  }

  private async fetchWhitelistTokens() {
    const result = await this.pay.getWhiteListToken();
    if (!result.ok)
      throw new Error(`Cannot fetch whitelist tokens ${result.error}`);
    this.whitelistTokens = new Map(
      result.data.map((t) => [t.symbol, t.address])
    );
    logger.info("Whitelist tokens fetch OK");
  }
}
