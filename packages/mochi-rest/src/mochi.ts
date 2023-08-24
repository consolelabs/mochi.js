import deepmerge from "deepmerge";
import { BaseModule, PayModule, ProfileModule } from "./modules";
import { Command } from "./schemas";
import { logger } from "./logger";
import { apiUrls } from "./constant";
import { WretchError } from "wretch/resolver";
import { ZodError } from "zod";

interface Options {
  apiKey?: string;
  preview?: boolean;
  catcher?: (error: WretchError | ZodError) => void;
  log?: boolean;
}

export interface FullOptions extends Options {
  baseUrl: string;
  profileUrl: string;
  payUrl: string;
}

const defaultOptions: Options = {
  preview: false,
  log: true,
};

export class Mochi {
  private opts: FullOptions;
  url: Pick<FullOptions, "baseUrl" | "profileUrl" | "payUrl"> = {
    payUrl: "",
    profileUrl: "",
    baseUrl: "",
  };
  base: BaseModule;
  profile: ProfileModule;
  pay: PayModule;

  commands: Map<string, Command> = new Map();
  telegramAlias: Map<string, Command> = new Map();
  discordAlias: Map<string, Command> = new Map();

  private copy: { tip: string[]; fact: string[] } = { tip: [], fact: [] };

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

  async init(): Promise<void> {
    await this.fetchCommandConfigs();
    await this.fetchProductCopy();
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

  private async fetchCommandConfigs() {
    try {
      const result = await this.base.metadata.getCommands();
      if (!result.ok) {
        throw new Error();
      }
      this.commands = new Map(
        result.data.map((c) => [c.code.toLowerCase(), c])
      );
      for (const cmd of this.commands.values()) {
        let aliases: string[] = [];
        try {
          aliases = JSON.parse(cmd.telegram_alias ?? "[]");
        } catch (e) {}
        this.telegramAlias = new Map(aliases.map((a) => [a, cmd]));

        aliases = [];
        try {
          aliases = JSON.parse(cmd.discord_alias ?? "[]");
        } catch (e) {}
        this.discordAlias = new Map(aliases.map((a) => [a, cmd]));
      }
      logger.info("Command config fetch OK");
    } catch (e) {
      logger.error("Cannot fetch command config");
    }
  }

  private async fetchProductCopy() {
    try {
      const result = await this.base.metadata.getCopy("header");
      if (!result.ok) throw new Error();
      this.copy = result.data.description;
      logger.info("Product copy fetch OK");
    } catch (e) {
      logger.error("Cannot fetch product copy");
    }
  }
}
