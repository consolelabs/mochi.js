import { HOMEPAGE } from "./constant";
import address from "./address";

function receiptLink(id: string, wrapCode = false) {
  return `[${wrapCode ? "`" : ""}${id.slice(0, 5)}${
    wrapCode ? "`" : ""
  }](${HOMEPAGE}/tx/${id})`;
}

function formatAddressUsername(value: string) {
  const isAddressResult = address.isAddress(value);
  if (isAddressResult.valid && !address.isShorten(value)) {
    return address.shorten(value);
  }
  const hidden = value.slice(10);

  return `${value.slice(0, 10)}${hidden.length ? "..." : ""}`;
}

export default {
  receiptLink,
  formatAddressUsername,
};
