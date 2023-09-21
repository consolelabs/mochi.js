const rtf = new Intl.RelativeTimeFormat("en", {
  style: "narrow",
  numeric: "auto",
});

const customRelativeFormatMap = new Map([
  ["yesterday", "ystd"],
  ["tomorrow", "tmr"],
]);

function relative(ms: string | number) {
  let num = Number(ms) - Date.now();
  // convert to number of days
  // to seconds
  num = num / 1000;
  // to minutes
  num = num / 60;
  // to hours
  num = num / 60;
  // to days
  num = num / 24;
  // round
  num = Math.round(num);
  const output = rtf.format(num, "day");

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
  relative,
  convertSecondToMinute,
  wait,
};
