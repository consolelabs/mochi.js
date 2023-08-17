export * as stringUtils from "./string";
export * as timeUtils from "./time";
export * as errorUtils from "./errorHandler";

export function truncate(val: string, len = 5, lenRight = len) {
  if (!val) return "";
  return `${val.slice(0, len)}\.\.${val.slice(val.length - lenRight)}`;
}
