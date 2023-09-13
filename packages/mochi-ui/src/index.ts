import { UI } from "./ui";
import { mdTable } from "./markdownTable";
import {
  formatDigit,
  formatUsdDigit,
  formatTokenDigit,
  formatPercentDigit,
} from "./formatDigit";
import time from "./time";
import functions from "./functions";
import address from "./address";
import string from "./string";
export * from "./address";

export default UI;
export { PageSize, ActivityType } from "./constant";
export { Platform } from "./ui";
export const utils = {
  mdTable,
  formatDigit,
  formatUsdDigit,
  formatTokenDigit,
  formatPercentDigit,
  time,
  functions,
  address,
  string,
};
