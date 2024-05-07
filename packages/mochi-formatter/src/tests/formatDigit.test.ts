import {
  formatPercentDigit,
  formatTokenDigit,
  formatUsdPriceDigit,
  formatUsdDigit,
} from "../formatDigit";

test.each([
  [0.291, "$0.29"],
  [0.0221, "$0.02"],
  [5.2345, "$5.23"],
  [100.123, "$100.12"],
  [-0.123, "-$0.12"],
  [-123, "-$123"],
  [-23456, "-$23.5K"],
  [123456, "$123.5K"],
  [0.00001, "< $0.01"],
  [10.00001, "$10.00001"],
])("formatUsdDigit discord", (input, output) => {
  expect(formatUsdDigit(input)).toEqual(output);
});

test.each([
  [0.291, "$0.29"],
  [0.0221, "$0.02"],
  [5.2345, "$5.23"],
  [100.123, "$100.12"],
  [-0.123, "-$0.12"],
  [-123, "-$123"],
  [-23456, "-$23,456"],
  [123456, "$123,456"],
  [0.00001, "< $0.01"],
  [10.00001, "$10.00001"],
  [1711502.11234, "$1.7M"],
  [1345123412.34, "$1.3B"],
  [1345123412657, "$1.3T"],
])("formatUsdDigit web", (input, output) => {
  expect(
    formatUsdDigit({ value: input, bound: { hi: 1_000_000, lo: -1_000_000 } })
  ).toEqual(output);
});

test.each([
  [0.291, "$0.29"],
  [0.0221, "$0.022"],
  [5.2345, "$5.23"],
  [100.123, "$100"],
  [0.020345, "$0.02"],
  [0.02345, "$0.023"],
  [0.0007190352755550547, "$0.00071"],
  [0.00007190352755550547, "$0.000071"],
  [0.000007190352755550547, "$0.0000071"],
  [0.00157805, "$0.0015"],
  [0.000157805, "$0.00015"],
  [-0.123, "-$0.12"],
  [-23456, "-$23.5K"],
  [123456, "$123.5K"],
])("formatUsdPriceDigit", (input, output) => {
  expect(formatUsdPriceDigit(input)).toEqual(output);
});

test.each([
  [{ value: 4.8549e-9, fractionDigits: 2 }, "$0.0₈48"],
  [{ value: 1.23456e-12, fractionDigits: 3 }, "$0.0₁₁123"],
  [{ value: 0.000000000000009876 }, "$0.0₁₄98"],
])("formatUsdPriceDigit with subscript and digits", (input, output) => {
  expect(formatUsdPriceDigit({ ...input, subscript: true })).toEqual(output);
});

test.each([
  [0.291, "0.29"],
  [0.0221, "0.02"],
  [5.2345, "5.23"],
  [100.123, "100.12"],
  [0.020345, "0.02"],
  [0.02345, "0.02"],
  [-0.123, "-0.12"],
  [-23456, "-23.5K"],
  [-1100.123, "-1,100.12"],
  [123456, "123.5K"],
  [0.000023, "0.00002"],

  // subscript notation
  // [input, output]
  [0.0000000009, "0.0₉9"],
  [0.00000000098718254, "0.0₉98"],
  [0.000000000239012, "0.0₉23"],
  [0.0000000123, "0.0₇12"],
  [0.000000123, "0.0₆12"],
  [0.0000000000000123, "0.0₁₃12"],
])("formatTokenDigit discord", (input, output) => {
  expect(formatTokenDigit({ value: input, subscript: true })).toEqual(output);
});

test.each([
  [999999, "999,999"],
  [1711502.11234, "1,711,502"],
  [1345123412.34, "1,345,123,412"],
  [1345123412657, "1,345,123,412,657"],
])("formatTokenDigit web", (input, output) => {
  expect(
    formatTokenDigit({
      value: input,
      shorten: false,
      bound: { hi: 1_000_000, lo: -1_000_000 },
    })
  ).toEqual(output);
});

test.each([
  [0.1, "0.1%"],
  [0.291, "0.29%"],
  [0.0221, "0.02%"],
  [5.2345, "5.23%"],
  [100.123, "100%"],
  [0.020345, "0.02%"],
  [0.02345, "0.02%"],
  [-0.123, "-0.12%"],
  [-23456, "-23,456%"],
  [-23456.981, "-23,456%"],
  [123456, "123,456%"],
])("formatPercentDigit", (input, output) => {
  expect(formatPercentDigit(input)).toEqual(output);
});
