import string from "../string";

test.each([
  ["👾 vincent", "👾 vincent"],
  ["🍡3456123912362871623098092", "🍡34561239..."],
  ["0x6497b5580A58f2B890B3AD66bC459341312AcC23", "0x649..cC23"],
])("string.formatAddressUsername", (input, output) => {
  expect(string.formatAddressUsername(input)).toBe(output);
});
