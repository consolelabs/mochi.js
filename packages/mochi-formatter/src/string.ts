import { HOMEPAGE } from "./constant";

function receiptLink(id: string, wrapCode = false) {
  return `[${wrapCode ? "`" : ""}${id.slice(0, 5)}${
    wrapCode ? "`" : ""
  }](${HOMEPAGE}/tx/${id})`;
}

export default {
  receiptLink,
};
