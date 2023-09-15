export function formatPercentDigit(params: FormatParam) {
  const num = call(params, formatDigit, {
    fractionDigits: toNum(params) >= 10 ? 0 : 2,
    shorten: toNum(params) >= 10,
  });
  return `${num}%`;
}

export function formatUsdDigit(params: FormatParam) {
  const tooSmall = Math.abs(toNum(params)) <= 0.01;
  if (tooSmall) return "$0.01";
  const isNeg = Math.sign(toNum(params)) < 0;
  const num = call(params, formatDigit, {
    fractionDigits: toNum(params) >= 100 ? 0 : 2,
    scientificFormat: true,
    shorten: toNum(params) >= 100,
  });
  return `${isNeg ? "-" : ""}$${num.slice(isNeg ? 1 : 0)}`;
}

export function formatUsdPriceDigit(params: FormatParam) {
  const isNeg = Math.sign(toNum(params)) < 0;
  const num = call(params, formatDigit, {
    fractionDigits: toNum(params) >= 100 ? 0 : 2,
    scientificFormat: true,
    takeExtraDecimal: 1,
    shorten: toNum(params) >= 100,
  });
  return `${isNeg ? "-" : ""}$${num.slice(isNeg ? 1 : 0)}`;
}

export function formatTokenDigit(params: FormatParam) {
  return call(params, formatDigit, {
    fractionDigits: toNum(params) >= 1000 ? 0 : 2,
    shorten: toNum(params) >= 1000,
  });
}

export function formatDigit({
  value,
  fractionDigits = 6,
  withoutCommas = false,
  shorten = false,
  scientificFormat = false,
  takeExtraDecimal = 0,
}: {
  value: string | number;
  fractionDigits?: number;
  withoutCommas?: boolean;
  shorten?: boolean;
  scientificFormat?: boolean;
  takeExtraDecimal?: number;
}) {
  takeExtraDecimal = Math.max(takeExtraDecimal, 0);
  const num = Number(String(value).replaceAll(",", ""));

  // invalid number -> keeps value the same and returns
  if (!num) return String(value);

  // return shorten scientific number if original value is in scientific format . e.g. 1.123e-5
  if (String(num).includes("e") && scientificFormat) {
    return shortenScientificNotation({ value: String(num) });
  }

  const s = num.toLocaleString(undefined, { maximumFractionDigits: 18 });
  const [left, right = ""] = s.split(".");
  const numsArr = right.split("");
  let rightStr = (numsArr.shift() as string) || "";
  while (
    Number(rightStr) === 0 ||
    rightStr.length < fractionDigits + takeExtraDecimal
  ) {
    const nextDigit = numsArr.shift();
    if (nextDigit === undefined) break;
    rightStr += nextDigit;
  }

  // only truncate to fractionDigits if the result is non zero
  // otherwise we keep the current format because
  // if we truncate we might accidentally make it zero
  if (Number(rightStr.slice(0, fractionDigits + takeExtraDecimal)) !== 0) {
    rightStr = rightStr.slice(0, fractionDigits + takeExtraDecimal);
  }

  while (rightStr.endsWith("0")) {
    rightStr = rightStr.slice(0, rightStr.length - 1);
  }

  if (rightStr.replaceAll("0", "").length > fractionDigits) {
    const zeroes = rightStr.split("").filter((r) => r === "0").length;
    rightStr = rightStr.slice(0, zeroes + fractionDigits);
  }

  // if shorten mode ON -> needs to be a valid Number (no commas)
  withoutCommas = shorten || withoutCommas;
  const leftStr = withoutCommas ? left.replaceAll(",", "") : left;
  const result = `${leftStr}${
    fractionDigits !== 0 && rightStr.length ? `.${rightStr}` : ""
  }`;
  if (!shorten || !Number(result)) return result;

  // shorten number. e.g. 3000 -> 3K
  return Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(Number(result));
}

type FormatParam = Parameters<typeof formatDigit>[0] | string | number;
type Extra = Omit<Parameters<typeof formatDigit>[0], "value">;

function call(
  param: FormatParam,
  func: Function,
  extraParams: Partial<Extra> = {}
) {
  if (typeof param === "string" || typeof param === "number") {
    return func.call(null, {
      value: toNum(param),
      ...extraParams,
    });
  }

  return func.call(null, {
    ...param,
    ...extraParams,
    value: toNum(param.value),
  });
}

function shortenScientificNotation({
  value,
  maximumFractionDigits = 2,
}: {
  value: string | number;
  maximumFractionDigits?: number;
}): string {
  const str = String(value);
  if (!Number(str)) return str;
  if (!str.includes("e")) return str;

  const delemiterIdx = str.indexOf("e");
  const leftStr = Number(str.slice(0, delemiterIdx)).toLocaleString(undefined, {
    maximumFractionDigits,
  });
  const rightStr = str.slice(delemiterIdx);
  return leftStr + rightStr;
}

function toNum(val: FormatParam) {
  if (typeof val === "string" || typeof val === "number") {
    return Number(String(val).replaceAll(",", ""));
  }
  return Number(String(val.value).replaceAll(",", ""));
}
