import { HOMEPAGE } from "./constant";
import address from "./address";

function receiptLink(id: string, wrapCode = false) {
  return `[${wrapCode ? "`" : ""}${id.slice(0, 5)}${
    wrapCode ? "`" : ""
  }](${HOMEPAGE}/tx/${id})`;
}

function formatAddressUsername(value: string, len = 15) {
  const _len = Math.min(Math.max(len, 0), 20);
  const isAddressResult = address.isAddress(value);
  if (isAddressResult.valid && !address.isShorten(value)) {
    return address.shorten(value);
  }
  const hidden = value.slice(_len);

  return `${value.slice(0, _len)}${hidden.length ? "..." : ""}`;
}

export default {
  receiptLink,
  formatAddressUsername,
};
