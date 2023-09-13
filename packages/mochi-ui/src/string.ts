import { HOMEPAGE } from "./constant";

function receiptLink(id: string) {
  return `[${id.slice(0, 5)}](${HOMEPAGE}/tx/${id})`;
}

export default {
  receiptLink,
};
