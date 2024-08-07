export function formatPercentDigit(params: FormatParam) {
  let num;
  let fractionDigits = 2;
  if (typeof params === "object") {
    num = params.value;
    fractionDigits = params.fractionDigits ?? 2;
  } else {
    num = params;
  }

  const [left, right = ""] = String(num).split(".");
  const result = `${(+left).toLocaleString(undefined)}.${right.slice(
    0,
    fractionDigits
  )}%`;

  const bound = extractBound({ hi: 100, lo: -100 }, params);
  if (!isInRange(+left, bound.lo, bound.hi))
    return `${(+left).toLocaleString(undefined)}%`;
  if (result.endsWith(".%")) return result.replaceAll(".%", "%");
  return result;
}

export function formatUsdDigit(params: FormatParam) {
  const tooSmall = Math.abs(toNum(params)) < 0.01;
  if (tooSmall) return "< $0.01";
  const isNeg = Math.sign(toNum(params)) < 0;

  const bound = extractBound({ hi: 10_000, lo: -10_000 }, params);
  const inRange = isInRange(toNum(params), bound.lo, bound.hi);
  const num = call(params, formatDigit, {
    fractionDigits: !inRange ? 0 : 2,
    scientificFormat: true,
    shorten: !inRange,
  });
  return `${isNeg ? "-" : ""}$${num.slice(isNeg ? 1 : 0)}`;
}

export function formatUsdPriceDigit(params: FormatParam) {
  const isNeg = Math.sign(toNum(params)) < 0;

  const bound = extractBound({ hi: 100, lo: -100 }, params);
  const inRange = isInRange(toNum(params), bound.lo, bound.hi);
  const num = call(params, formatDigit, {
    fractionDigits: !inRange ? 0 : 2,
    scientificFormat: true,
    takeExtraDecimal: 1,
    shorten: !inRange,
  });
  return `${isNeg ? "-" : ""}$${num.slice(isNeg ? 1 : 0)}`;
}

export function formatTokenDigit(params: FormatParam) {
  const bound = extractBound({ hi: 10_000, lo: -10_000 }, params);
  const inRange = isInRange(toNum(params), bound.lo, bound.hi);
  return call(params, formatDigit, {
    fractionDigits: !inRange ? 0 : 2,
    shorten: !inRange,
    scientificFormat: true,
  });
}

const subscript: Record<number | string, string> = {
  0: "₀",
  1: "₁",
  2: "₂",
  3: "₃",
  4: "₄",
  5: "₅",
  6: "₆",
  7: "₇",
  8: "₈",
  9: "₉",
};

const expNotation = /([\d.]+)e(-|\+){0,1}(\d+)/;

function formatSubscript(value: string, digits?: number) {
  const [_, _num, sign, sub] = Array.from(value.match(expNotation) ?? []);
  let num = _num.replaceAll(".", "").slice(0, digits ?? 4);
  while (num.endsWith("0")) {
    num = num.slice(0, num.length - 1);
  }
  const subNum = +sub - 1;
  const subNumStrArr = String(subNum).split("");
  if (sign === "-") {
    return `0.0${subNumStrArr.reduce(
      (acc, c) => (acc += subscript[c] ?? ""),
      ""
    )}${num}`;
  }
  return value;
}

export function formatDigit({
  value,
  fractionDigits = 6,
  withoutCommas = false,
  shorten = false,

  subscript = false,
  scientificFormat = false,
  takeExtraDecimal = 0,
}: {
  value: string | number;
  fractionDigits?: number;
  withoutCommas?: boolean;
  shorten?: boolean;
  scientificFormat?: boolean;
  subscript?: boolean;
  takeExtraDecimal?: number;
}) {
  takeExtraDecimal = Math.max(takeExtraDecimal, 0);
  const num = Number(String(value).replaceAll(",", ""));

  // invalid number -> keeps value the same and returns
  if (!num) return String(value);

  // detect exp notation and use subscript format
  if (String(num).includes("e") && expNotation.test(String(num))) {
    if (subscript) return formatSubscript(String(num), fractionDigits);
    if (scientificFormat)
      return shortenScientificNotation({ value: String(num) });
  }

  const s = num.toLocaleString(undefined, { maximumFractionDigits: 18 });
  const [left, right = ""] = s.split(".");
  const numsArr = right.split("");
  let rightStr = (numsArr.shift() as string) || "";
  let extraDecimal = takeExtraDecimal;
  while (
    Number(rightStr) === 0 ||
    rightStr.length < fractionDigits ||
    extraDecimal > 0
  ) {
    if (Number(rightStr) > 0) {
      extraDecimal--;
      extraDecimal = Math.max(extraDecimal, 0);
    }
    const nextDigit = numsArr.shift();
    if (nextDigit === undefined) break;
    rightStr += nextDigit;
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

type FormatParam =
  | (Parameters<typeof formatDigit>[0] & {
      bound?: { hi?: number; lo?: number };
    })
  | string
  | number;
type Extra = Omit<Parameters<typeof formatDigit>[0], "value">;

function call(
  extraParam: FormatParam,
  func: Function,
  params: Partial<Extra> = {}
) {
  if (typeof extraParam === "string" || typeof extraParam === "number") {
    return func.call(null, {
      value: toNum(extraParam),
      ...params,
    });
  }

  return func.call(null, {
    ...params,
    ...extraParam,
    value: toNum(extraParam.value),
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

function isInRange(num: number, lowBound: number, highBound: number) {
  return num > lowBound && num < highBound;
}

function extractBound(bound: { hi: number; lo: number }, params: FormatParam) {
  if (typeof params === "number" || typeof params === "string") return bound;
  return {
    hi: params.bound?.hi ?? bound.hi,
    lo: params.bound?.lo ?? bound.lo,
  };
}
