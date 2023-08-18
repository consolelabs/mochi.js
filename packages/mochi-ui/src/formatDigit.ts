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

export function formatPercentDigit(
  params: Parameters<typeof formatDigit>[0] | string | number
) {
  let num;
  if (typeof params === "string" || typeof params === "number") {
    num = formatDigit({
      value: +params,
      fractionDigits: +params >= 10 ? 0 : 2,
    });
  } else {
    num = formatDigit({
      ...params,
      fractionDigits: +params.value >= 10 ? 0 : 2,
    });
  }

  return `${num}%`;
}

export function formatUsdDigit(
  params: Parameters<typeof formatDigit>[0] | string | number
) {
  const isNeg = Math.sign(+params) < 0;
  let num;
  if (typeof params === "string" || typeof params === "number") {
    num = formatDigit({
      value: +params,
      fractionDigits: +params >= 100 ? 0 : 2,
      scientificFormat: true,
    });
  } else {
    num = formatDigit({
      ...params,
      fractionDigits: +params.value >= 100 ? 0 : 2,
      scientificFormat: true,
    });
  }

  return `${isNeg ? "-" : ""}$${num.slice(isNeg ? 1 : 0)}`;
}

export function formatTokenDigit(
  params: Parameters<typeof formatDigit>[0] | string | number
) {
  if (typeof params === "string" || typeof params === "number") {
    return formatDigit({
      value: +params,
      fractionDigits: +params >= 1000 ? 0 : 2,
    });
  }
  return formatDigit({
    ...params,
    fractionDigits: +params.value >= 1000 ? 0 : 2,
  });
}

export function formatDigit({
  value,
  fractionDigits = 6,
  withoutCommas = false,
  shorten = false,
  scientificFormat = false,
}: {
  value: string | number;
  fractionDigits?: number;
  withoutCommas?: boolean;
  shorten?: boolean;
  scientificFormat?: boolean;
}) {
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
  while (Number(rightStr) === 0 || rightStr.length < fractionDigits) {
    const nextDigit = numsArr.shift();
    if (nextDigit === undefined) break;
    rightStr += nextDigit;
  }

  // only truncate to fractionDigits if the result is non zero
  // otherwise we keep the current format because
  // if we truncate we might accidentally make it zero
  if (Number(rightStr.slice(0, fractionDigits)) !== 0) {
    rightStr = rightStr.slice(0, fractionDigits);
  }

  while (rightStr.endsWith("0")) {
    rightStr = rightStr.slice(0, rightStr.length - 1);
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
