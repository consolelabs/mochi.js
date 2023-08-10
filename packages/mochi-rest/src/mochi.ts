import deepmerge from "deepmerge";
import { BaseModule, PayModule, ProfileModule } from "./modules";

interface Options {
  apiKey?: string;
}

const defaultOptions: Options = {};

export class Mochi {
  private opts: Options;
  base: BaseModule;
  profile: ProfileModule;
  pay: PayModule;

  constructor(_opts: Options) {
    this.opts = deepmerge(defaultOptions, _opts);
    this.base = new BaseModule(this.opts.apiKey);
    this.profile = new ProfileModule(this.opts.apiKey);
    this.pay = new PayModule(this.opts.apiKey);
  }
}
