import time from "../time";
import UI, { Platform } from "..";
import { mdTable } from "../markdownTable";
import type { Paging } from "../types";
import { formatUnits } from "ethers";
import address from "../address";
import pageIndicator from "./page-indicator";
import groupby from "lodash.groupby";
import { HOMEPAGE } from "../constant";
import type {
  VaultTransferTx,
  TransferTx,
  Tx,
  OnchainTx,
  OffchainTx,
  DepositTx,
  WithdrawTx,
  AirdropTx,
  PayLinkTx,
  PayMeTx,
} from "@consolelabs/mochi-rest";
import API from "@consolelabs/mochi-rest";
import string from "../string";
import amountComp from "./amount";

type Props = {
  txns: Array<Tx>;
  on?: TransactionSupportedPlatform;
  api?: API;
  top?: number;
  groupDate?: boolean;
  withTitle?: boolean;
  /**
   * by default the txn component only renders the "other" in a txn, it assumes the caller is also the "from"
   * so if you use this option it will switch format mode to "A to B" instead of "from B", "to B"
   * also using this will auto set groupDate to true
   */
  global?: boolean;
};

export type TransactionSupportedPlatform =
  | Platform.Web
  | Platform.Telegram
  | Platform.Discord;

function isVault(
  tx: VaultTransferTx | TransferTx,
  source: "from" | "to"
): tx is VaultTransferTx {
  return (
    (source === "from" ? tx.from_profile_source : tx.other_profile_source) ===
      "mochi-vault" && tx.action === "vault_transfer"
  );
}

const PLUS_SIGN = "+";
const MINUS_SIGN = "-";

/**
 * Get formatted transaction to show on different platforms.
 *
 * @param tx - The transation payload
 * @param onPlatform - The platform (discord, tele, web) would show the formatted transaction
 * @param global - if global: show both sender and receiver of transaction, otherwise just the actor who transaction belongs to
 * @param groupDate - The platform (discord, tele, web) would show the formatted transaction
 * @param api - api service to get the token emoji, and amount
 * @returns The formatted transaction
 */
export async function formatTxn(
  tx: Tx,
  onPlatform: TransactionSupportedPlatform,
  global: boolean,
  groupDate: boolean,
  api?: API
) {
  // the onchain tx will have `has_transfer` field in payload
  const isOnchainTx = "has_transfer" in tx;
  if (isOnchainTx) {
    return await formatOnchainTxns(tx, groupDate);
  }

  return await formatOffchainTxns(tx, onPlatform, global, groupDate, api);
}

/**
 * Get formatted onchain transaction.
 *
 * @param tx - The onchain transation payload
 * @param groupDate - The date of tx should be in long or short form
 * @returns The formatted transaction
 */
async function formatOnchainTxns(tx: OnchainTx, groupDate: boolean) {
  // 0. get transaction time
  const date = new Date(tx.signed_at);
  const t = groupDate
    ? time.relative(date.getTime())
    : time.relativeShort(date.getTime());

  // 1. prepare result shape
  const result = {
    time: t,
    emoji: "",
    amount: "",
    text: "",
    external_id: "",
  };

  // 2. get transfer transaction
  const transferTx = tx.actions.find((a) => {
    return a.native_transfer || (a.from && a.to && a.unit && a.amount != 0);
  });
  if (!transferTx) return result;

  // 3. get amount of transaction
  const amount = transferTx.amount ?? 0;
  if (amount === 0) return result;

  // 4. get target of transaction
  const isDebit = Math.sign(amount) < 0;
  let target = isDebit ? transferTx.to : transferTx.from;
  if (!target) return result;
  target = await address.normalizeAddress(target);
  target = address.shorten(target);

  // 5. format transaction
  const prefix = isDebit ? "" : PLUS_SIGN;
  const unit = transferTx.unit ?? "";
  const preposition = isDebit ? "to" : "from";
  result.text = `${prefix}${amount} ${unit} ${preposition} \`${target}\``;

  // 6. return result
  return result;
}

/**
 * Get formatted offchain transaction to show on different platforms.
 *
 * @param tx - The offchain transation payload
 * @param onPlatform - The platform (discord, tele, web) would show the formatted transaction
 * @param global - If global: show both sender and receiver of transaction, otherwise just the actor who transaction belongs to
 * @param groupDate - The date of tx should be in long or short form
 * @param api - The api service to get the token emoji, and amount
 * @returns The formatted transaction
 */
async function formatOffchainTxns(
  tx: OffchainTx,
  onPlatform: TransactionSupportedPlatform,
  global: boolean,
  groupDate: boolean,
  api?: API
) {
  // 0. get transaction time
  const date = new Date(tx.created_at);
  const t = groupDate
    ? time.relative(date.getTime())
    : time.relativeShort(date.getTime());

  // 1. get transaction link by external_id
  const external_id = string.receiptLink(tx.external_id, true);

  // 2. prepare result shape
  let result = {
    emoji: "",
    amount: "",
    text: "",
    time: t,
    external_id,
  };

  // 3. format transaction by transaction action
  switch (tx.action) {
    case "transfer":
      result = {
        ...result,
        ...(await renderTransferTx(tx, onPlatform, global, api)),
      };
      break;
    case "vault_transfer":
      result = {
        ...result,
        ...(await renderVaultTransferTx(tx, onPlatform, global, api)),
      };
      break;
    case "deposit":
      result = { ...result, ...(await renderDepositTx(tx, onPlatform, api)) };
      break;
    case "withdraw":
      result = { ...result, ...(await renderWithdrawTx(tx, onPlatform, api)) };
      break;
    case "airdrop":
      result = { ...result, ...(await renderAirdropTx(tx, onPlatform, api)) };
      break;
    case "paylink":
      result = { ...result, ...(await renderPaylinkTx(tx, onPlatform, api)) };
      break;
    case "payme":
      result = { ...result, ...(await renderPaymeTx(tx, onPlatform, api)) };
      break;
  }

  // 4. return result
  return result;
}

async function renderTransferTx(
  tx: TransferTx,
  onPlatform: TransactionSupportedPlatform,
  global: boolean,
  api?: API
) {
  // 0. Prepare result shape
  const result = {
    emoji: "",
    amount: "",
    text: "",
    external_id: "",
  };

  // 1. Check if tx type is in or out
  const isTransferIn = tx.type === "in";

  // 2. Get token emoji and token amount of the transaction
  const {
    text,
    emoji,
    full: fullAmount,
  } = await amountComp({
    on: onPlatform,
    amount: formatUnits(tx.amount || 0, tx.token.decimal),
    symbol: tx.token.symbol.toUpperCase(),
    api,
    prefix: isTransferIn ? PLUS_SIGN : MINUS_SIGN,
  });
  result.amount = text;
  result.emoji = emoji;

  // 3. Format the transaction description
  const [actor] = await UI.resolve(onPlatform, tx.other_profile_id);
  const actorLbl = actor?.value ?? "";
  result.text = isTransferIn
    ? `${fullAmount} from ${actorLbl}`
    : `${fullAmount} to ${actorLbl}`;

  // if global we will should both sender and receiver
  // otherwise just show the actor (the one who trigger the function)
  if (global) {
    const [from, to] = await UI.resolve(
      onPlatform,
      tx.from_profile_id,
      tx.other_profile_id
    );
    if (from?.value && to?.value) {
      result.text = isTransferIn
        ? `${to.value} to ${from.value}`
        : `${from.value} to ${to.value}`;
    }
  }

  // 4. Return the result
  return result;
}

async function renderVaultTransferTx(
  tx: VaultTransferTx,
  onPlatform: TransactionSupportedPlatform,
  global: boolean,
  api?: API
) {
  // 0. Prepare the result shape
  const result = {
    emoji: "",
    amount: "",
    text: "",
    external_id: "",
  };

  // 1. check if tx type if in or out
  const isTransferIn = tx.type === "in";

  // 2. get the token amount, and token emoji of the transaction
  const {
    text,
    emoji,
    full: fullAmount,
  } = await amountComp({
    on: onPlatform,
    amount: formatUnits(tx.amount || 0, tx.token.decimal),
    symbol: tx.token.symbol.toUpperCase(),
    api,
    prefix: isTransferIn ? PLUS_SIGN : MINUS_SIGN,
  });
  result.amount = text;
  result.emoji = emoji;

  // 3. Format the vault transaction description
  const [actor] = await UI.resolve(
    onPlatform,
    isVault(tx, "to")
      ? {
          type: "vault",
          id: tx.metadata.vault_request.vault_id.toString(),
        }
      : (tx as VaultTransferTx).other_profile_id
  );
  const actorLbl = actor?.value ?? "";
  result.text = isTransferIn
    ? `${fullAmount} from ${actorLbl}`
    : `${fullAmount} to ${actorLbl}`;

  // if global we will should show both sender and receiver
  // otherwise just show the actor (the one who trigger the function)
  // if sender or receiver is vault, we would render it specially
  if (global) {
    const [from, to] = await UI.resolve(
      onPlatform,
      isVault(tx, "from")
        ? {
            type: "vault",
            id: tx.metadata.vault_request.vault_id.toString(),
          }
        : (tx as VaultTransferTx).from_profile_id,
      isVault(tx, "to")
        ? {
            type: "vault",
            id: tx.metadata.vault_request.vault_id.toString(),
          }
        : (tx as VaultTransferTx).other_profile_id
    );
    if (from?.value && to?.value) {
      result.text = isTransferIn
        ? `${to.value} to ${from.value}`
        : `${from.value} to ${to.value}`;
    }
  }

  // 4. Return the result
  return result;
}

async function renderDepositTx(
  tx: DepositTx,
  onPlatform: TransactionSupportedPlatform,
  api?: API
) {
  // 0. Get the token amount and token emoji of the transaction
  const { full: amount, emoji } = await amountComp({
    on: onPlatform,
    api,
    symbol: tx.token.symbol.toUpperCase(),
    amount: formatUnits(tx.amount, tx.token.decimal),
    prefix: PLUS_SIGN,
  });

  // 1. Prepare the deposit transaction description
  const normalized = await address.normalizeAddress(tx.other_profile_source);
  const text = `${amount} deposited to \`${address.shorten(normalized)}\``;

  // 2. Return the result
  return {
    emoji,
    text,
  };
}

async function renderWithdrawTx(
  tx: WithdrawTx,
  onPlatform: TransactionSupportedPlatform,
  api?: API
) {
  // 0. Get the token amount and token emoji of the transaction
  const { full: amount, emoji } = await amountComp({
    on: onPlatform,
    api,
    symbol: tx.token.symbol.toUpperCase(),
    amount: formatUnits(tx.amount, tx.token.decimal),
    prefix: MINUS_SIGN,
  });

  // 1. Prepare the withdraw transaction description
  const resolved = await address.lookup(tx.other_profile_source);
  const text = `${amount} withdrawn to \`${resolved}\``;

  // 2. return the result
  return {
    emoji,
    text,
  };
}

async function renderAirdropTx(
  tx: AirdropTx,
  onPlatform: TransactionSupportedPlatform,
  api?: API
) {
  // 0. Get the token amount and token emoji of the transaction
  const { full: amount, emoji } = await amountComp({
    on: onPlatform,
    api,
    symbol: tx.token.symbol.toUpperCase(),
    amount: formatUnits(tx.amount, tx.token.decimal),
    prefix: MINUS_SIGN,
  });

  // 1. Prepare the withdraw transaction description
  const numOfWinners = tx.other_profile_ids.length;
  const text = `${amount} airdropped${
    numOfWinners > 0
      ? ` to ${numOfWinners} ${numOfWinners > 1 ? "people" : "person"}`
      : " but no one joined"
  }`;

  // 2. Return the result
  return {
    emoji,
    text,
  };
}

async function renderPaylinkTx(
  tx: PayLinkTx,
  onPlatform: TransactionSupportedPlatform,
  api?: API
) {
  // 0. Get the token amount, token emoji of the tx
  const { full: amount, emoji } = await amountComp({
    on: onPlatform,
    api,
    symbol: tx.token.symbol.toUpperCase(),
    amount: formatUnits(tx.amount, tx.token.decimal),
    prefix: MINUS_SIGN,
  });

  // 1. get the paylink receiver
  let by: string | undefined;
  if (tx.other_profile_id) {
    const [sender] = await UI.resolve(onPlatform, tx.other_profile_id);
    by = sender?.value;
  }
  if (tx.other_profile_source) {
    by = await address.lookup(tx.other_profile_source);
  }

  // 2. prepare the paylink tx description
  let text = `${amount} [Pay Link](${HOMEPAGE}/pay/${tx.metadata.code})`;
  if (by) {
    text = `${amount} [Pay Link](${HOMEPAGE}/pay/${tx.metadata.code}) ${
      tx.status === "success" ? `to ${by}` : ""
    }`;
  }

  // 3. Return result
  return {
    emoji,
    text,
  };
}

async function renderPaymeTx(
  tx: PayMeTx,
  onPlatform: TransactionSupportedPlatform,
  api?: API
) {
  // 0. Get the token amount and token emoji of the tx
  const { full: amount, emoji } = await amountComp({
    on: onPlatform,
    api,
    symbol: tx.token.symbol.toUpperCase(),
    amount: formatUnits(tx.amount, tx.token.decimal),
    prefix: PLUS_SIGN,
  });

  // 1. Get the payme sender
  let by: string | undefined;
  if (tx.other_profile_id) {
    const [sender] = await UI.resolve(onPlatform, tx.other_profile_id);
    by = sender?.value;
  }
  if (tx.other_profile_source) {
    by = await address.lookup(tx.other_profile_source);
  }

  // 2. Prepare the payme tx description
  let text = `${amount} [Pay Me](${HOMEPAGE}/pay)`;
  if (by) {
    text = `${amount} [Pay Me](${HOMEPAGE}/pay) ${
      tx.status === "success" ? "from" : "request sent to"
    } ${by}`;
  }

  // 3. Return result
  return {
    text,
    emoji,
  };
}

function filterSpamToken(tx: Tx) {
  if ("token" in tx) {
    const symbol = tx?.token?.symbol ?? "";

    return symbol.length >= 3 && symbol.length <= 6;
  }
  if ("has_transfer" in tx) {
    const transferTx = tx.actions.find((a) => {
      if (a.native_transfer) return true;
      if (a.from && a.to && a.amount !== 0 && a.unit) return true;
      return false;
    });
    if (!transferTx) return false;
    const symbol = transferTx.unit ?? "";
    return symbol.length >= 3 && symbol.length <= 6;
  }
  return true;
}

function filterOnchainOnlyTransfer(tx: Tx) {
  if ("has_transfer" in tx) {
    // transfer tx = first tx to have "from", "to", "amount" and "unit"
    const transferTx = tx.actions.find((a) => {
      if (a.native_transfer) return true;
      if (a.from && a.to && a.amount !== 0 && a.unit) return true;
      return false;
    });

    return !!transferTx;
  }

  return true;
}

export function filterNoise(tx: Tx) {
  for (const checker of [filterSpamToken, filterOnchainOnlyTransfer]) {
    const stillValid = checker(tx);
    if (!stillValid) {
      return false;
    }
  }

  return true;
}

export function latest(tx1: Tx, tx2: Tx) {
  let time1, time2;
  if ("signed_at" in tx1) {
    time1 = new Date(tx1.signed_at).getTime();
  } else {
    time1 = new Date(tx1.created_at).getTime();
  }

  if ("signed_at" in tx2) {
    time2 = new Date(tx2.signed_at).getTime();
  } else {
    time2 = new Date(tx2.created_at).getTime();
  }

  return time2 - time1;
}

export default async function (
  {
    txns,
    top,
    page = 0,
    // size = PageSize.Standard,
    total = 1,
    on = Platform.Web,
    groupDate = false,
    withTitle = false,
    global = false,
    api,
  }: Props & Paging,
  tableParams?: Parameters<typeof mdTable>[1]
) {
  if (global) {
    groupDate = true;
  }

  let data = (
    await Promise.all(
      txns
        .sort(latest)
        .filter(filterNoise)
        .map((tx) => formatTxn(tx, on, global, groupDate, api))
    )
  ).filter((t) => t.text);

  if (typeof top === "number") {
    data = data.slice(0, top);
  }

  let text;
  if (groupDate) {
    const groupByDate = groupby(data, "time");
    const lines = Object.entries(groupByDate).map((e, i) => {
      const isLast = i === Object.keys(groupByDate).length - 1;
      const [time, txns] = e;
      return [
        `🗓 ${on === Platform.Telegram ? "*" : "**"}${time}${
          on === Platform.Telegram ? "*" : "**"
        }`,
        mdTable(txns, {
          ...(tableParams ?? {}),
          cols: global ? ["amount", "text"] : ["external_id", "text"],
          alignment: ["left", "left"],
          wrapCol: [global, false],
          row: (f, i) =>
            global && on === Platform.Discord ? `${txns[i].emoji}${f}` : f,
        }),
        ...(isLast ? [] : [""]),
      ].join("\n");
    });

    text = lines.join("\n");
  } else {
    text = mdTable(data, {
      ...(tableParams ?? {}),
      wrapCol: [true, false, false],
      cols: ["time", "external_id", "text"],
      alignment: ["left", "left", "left"],
    });
  }

  if (!text) {
    text = "There is no transaction, yet 🙁";
  }

  const { text: pager } = await pageIndicator({
    page,
    totalPage: total,
  });

  let emoji = "📜";
  if (api && on === Platform.Discord) {
    const { ok, data } = await api.base.metadata.getEmojis({
      codes: ["PROPOSAL"],
    });
    if (ok) {
      emoji = data.at(0)?.emoji ?? "📜";
    }
  }

  return {
    text: [
      ...(withTitle
        ? [
            `${emoji} ${on === Platform.Discord ? "**" : "*"}History${
              on === Platform.Discord ? "**" : "*"
            }`,
          ]
        : []),
      ...(groupDate && withTitle ? [""] : []),
      text,
      "",
      ...(pager ? [pager] : []),
    ].join("\n"),
    totalPage: total,
    length: data.length,
  };
}
