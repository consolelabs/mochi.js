import { QueryStringAddon } from "wretch/addons/queryString";
import { Wretch } from "wretch/types";

export class Module {
  constructor(public api: QueryStringAddon & Wretch<QueryStringAddon>) {}

  token(t: string | null) {
    if (t && this.api) {
      this.api = this.api.auth(`Bearer ${t}`);
      return;
    }
    this.api = this.api.auth("");
    return;
  }
}
