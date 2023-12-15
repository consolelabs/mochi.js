import time from "../time";

const year = 31536000000;
const month = 2628000000;
const day = 86400000;
const hour = 3600000;
const minute = 60000;

describe("time.relative", () => {
  beforeAll(() => {
    jest
      .useFakeTimers({ advanceTimers: true })
      .setSystemTime(new Date("2023-12-13"));
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it("should render corrected relative time format", () => {
    [
      { input: "10/20/1984", expected: "39y ago" },
      { input: "10/20/2015", expected: "8y ago" },
      { input: +new Date() - year, expected: "last yr." },
      { input: +new Date() - month, expected: "last mo." },
      { input: +new Date() - day, expected: "yesterday" },
      { input: +new Date() - hour, expected: "1h ago" },
      { input: +new Date() - minute, expected: "1m ago" },
      { input: +new Date() + minute * 2, expected: "in 2m" },
      { input: +new Date() + day * 7, expected: "in 7d" },
    ].forEach((test) => {
      const actual = time.relative(new Date(test.input));
      expect(actual).toBe(test.expected);
    });
  });

  it("should render corrected relative short time format", () => {
    [{ input: +new Date() - day, expected: "ystd" }].forEach((test) => {
      const actual = time.relativeShort(new Date(test.input));
      expect(actual).toBe(test.expected);
    });
  });
});
