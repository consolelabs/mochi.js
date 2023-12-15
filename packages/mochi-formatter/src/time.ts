// https://stackoverflow.com/questions/6108819/javascript-timestamp-to-relative-time

export const units: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: "year", ms: 31536000000 },
  { unit: "month", ms: 2628000000 },
  { unit: "day", ms: 86400000 },
  { unit: "hour", ms: 3600000 },
  { unit: "minute", ms: 60000 },
  { unit: "second", ms: 1000 },
];
const rtf = new Intl.RelativeTimeFormat("en-US", {
  style: "narrow",
  numeric: "auto",
});
const customRelativeFormatMap = new Map([
  ["yesterday", "ystd"],
  ["tomorrow", "tmr"],
]);

/**
 * Get language-sensitive relative time message from Dates.
 * @param relative  - the relative dateTime, generally is in the past or future
 * @param pivot     - the dateTime of reference, generally is the current time
 */
export function relativeTimeFromDates(
  relative: Date | null,
  pivot: Date = new Date(),
  smallestUnit: Intl.RelativeTimeFormatUnit = "second"
): string {
  if (!relative) return "";
  const elapsed = relative.getTime() - pivot.getTime();
  return relativeTimeFromElapsed(elapsed, smallestUnit);
}

/**
 * Get language-sensitive relative time message from elapsed time.
 * @param elapsed   - the elapsed time in milliseconds
 */
export function relativeTimeFromElapsed(
  elapsed: number,
  smallestUnit: Intl.RelativeTimeFormatUnit = "second"
): string {
  for (const { unit, ms } of units) {
    if (Math.abs(elapsed) >= ms || unit === smallestUnit) {
      return rtf.format(Math.round(elapsed / ms), unit);
    }
  }
  return "";
}

function relativeShort(relative: Date | null, pivot: Date = new Date()) {
  const output = relativeTimeFromDates(relative, pivot);

  return customRelativeFormatMap.get(output.toLowerCase()) || output;
}

function convertSecondToMinute(second: number): string {
  if (second <= 30) {
    return second.toString() + "s";
  }
  const minute = second / 60;
  return Math.round(minute).toString() + "m";
}

async function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default {
  relative: relativeTimeFromDates,
  relativeShort,
  convertSecondToMinute,
  wait,
};
