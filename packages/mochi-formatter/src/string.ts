import { HOMEPAGE } from "./constant";
import address from "./address";
import type { AssociatedAccount } from "@consolelabs/mochi-rest";
import { Platform } from "./ui";

function receiptLink(id: string, wrapCode = false) {
  return `[${wrapCode ? "`" : ""}${id.slice(0, 5)}${
    wrapCode ? "`" : ""
  }](${HOMEPAGE}/tx/${id})`;
}

function formatAddressUsername(value: string | AssociatedAccount, len = 15) {
  const _len = Math.min(Math.max(len, 0), 20);

  if (typeof value !== "string") {
    return _formatDomainName(value);
  }

  if (address.isAddress(value).valid && !address.isShorten(value)) {
    return address.shorten(value);
  }

  return _formatUsername(value, _len);
}

function _formatDomainName(p: AssociatedAccount) {
  const isSolAcc = p.platform === Platform.SolanaChain;

  if (isSolAcc) {
    return p.platform_metadata.sns || address.shorten(p.platform_identifier);
  }

  const isEvmAcc = p.platform === Platform.EvmChain;

  if (isEvmAcc) {
    return p.platform_metadata.ens || address.shorten(p.platform_identifier);
  }

  return address.shorten(p.platform_identifier);
}

function _formatUsername(value: string, len: number) {
  const hidden = value.slice(len);

  return `${value.slice(0, len)}${hidden.length ? "..." : ""}`;
}

export default {
  receiptLink,
  formatAddressUsername,
};
