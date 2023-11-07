import { QueryStringAddon } from "wretch/addons/queryString";
import { Wretch } from "wretch/types";

export class Module {
  constructor(public api: QueryStringAddon & Wretch<QueryStringAddon>) {}
}
