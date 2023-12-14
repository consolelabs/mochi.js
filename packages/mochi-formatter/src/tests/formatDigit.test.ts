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
  [100.123, "$100"],
  [-0.123, "-$0.12"],
  [-123, "-$123"],
  [-23456, "-$23.5K"],
  [123456, "$123.5K"],
  [0.00001, "< $0.01"],
  [10.00001, "$10.00001"],
])("formatUsdDigit", (input, output) => {
  expect(formatUsdDigit(input)).toEqual(output);
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
  [0.291, "0.29"],
  [0.0221, "0.02"],
  [5.2345, "5.23"],
  [100.123, "100.12"],
  [0.020345, "0.02"],
  [0.02345, "0.02"],
  [-0.123, "-0.12"],
  [-23456, "-23.5K"],
  [-1100.123, "-1.1K"],
  [123456, "123.5K"],
  [0.0000000009, "9e-10"],
])("formatTokenDigit", (input, output) => {
  expect(formatTokenDigit(input)).toEqual(output);
});

test.each([
  [0.291, "0.29%"],
  [0.0221, "0.02%"],
  [5.2345, "5.23%"],
  [100.123, "100.12%"],
  [0.020345, "0.02%"],
  [0.02345, "0.02%"],
  [-0.123, "-0.12%"],
  [-23456, "-23K%"],
  [123456, "123K%"],
])("formatPercentDigit", (input, output) => {
  expect(formatPercentDigit(input)).toEqual(output);
});
