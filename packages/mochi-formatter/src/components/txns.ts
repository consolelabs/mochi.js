import util from "util";
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
import template from "../templates";

type Props = {
  txns: Array<Tx>;
  on?: TransactionSupportedPlatform;
  api?: API;
  top?: number;
  groupDate?: boolean;
  withTitle?: boolean;
  profileId?: string;
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
 * @param groupDate - The date of tx should be in long or short form
 * @param api - api service to get the token emoji, and amount
 * @param profileId - The one who the transactions belongs to, this will help to indicate the opponent of the transaction
 * @returns The formatted transaction
 */
export async function formatTxn(
  tx: Tx,
  onPlatform: TransactionSupportedPlatform,
  global: boolean,
  groupDate: boolean,
  api?: API,
  profileId?: string
) {
  // 1.0 format onchain txns
  // the onchain tx will have `has_transfer` field in payload
  const isOnchainTx = "has_transfer" in tx;
  if (isOnchainTx) {
    return await formatOnchainTxns(tx, groupDate);
  }

  // 2.0 otherwise format offchain txns
  return await formatOffchainTxns(
    tx,
    onPlatform,
    global,
    groupDate,
    api,
    profileId
  );
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
    ? time.relative(date, new Date(), "hour")
    : time.relativeShort(date);

  // 1. prepare result shape
  const result = {
    time: t,
    emoji: "",
    amount: "",
    text: "",
    external_id: "",
  };

  // 2. get transfer transaction
  const transferTx = tx.actions.find((a: any) => {
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
  api?: API,
  profileId?: string
) {
  // 0. get transaction time
  const date = new Date(tx.created_at);
  const t = groupDate
    ? time.relative(date, new Date(), "hour")
    : time.relativeShort(date);

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
        ...(await renderTransferTx(tx, onPlatform, global, api, profileId)),
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
      result = {
        ...result,
        ...(await renderAirdropTx(tx, onPlatform, api, profileId)),
      };
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
  api?: API,
  profileId?: string
) {
  // 0. Prepare result shape
  const result = {
    emoji: "",
    amount: "",
    text: "",
  };

  // 1. Check if tx type is in or out
  let isTransferIn = tx.type === "in";
  // 1.1 if the other_profile_id of tx is the one who call this function,
  // we will need to invert the side of the transaction (in to out, and out to in)
  if (profileId && tx.other_profile_id === profileId) {
    isTransferIn = !isTransferIn;
  }

  // Render sibling transactions e.g tip for multiple people
  if (!isTransferIn && tx.sibling_txs && tx.sibling_txs.length !== 0) {
    return await renderSiblingsTxns([tx, ...tx.sibling_txs], onPlatform, api);
  }

  // Otherwise render 1 tx normally
  // 2. Get token emoji and token amount of the transaction
  const sign = isTransferIn ? PLUS_SIGN : MINUS_SIGN;
  const {
    text,
    emoji,
    full: fullAmount,
  } = await amountComp({
    on: onPlatform,
    amount: formatUnits(tx.amount || 0, tx.token.decimal),
    symbol: tx.token.symbol.toUpperCase(),
    api,
    prefix: global ? undefined : sign,
  });
  result.amount = text;
  result.emoji = emoji;

  // 3. Format the transaction description

  // 3.1 get the opponent of the transaction, and show only opponent
  // e.g: from B, to B
  let opponentProfileId = tx.other_profile_id;
  if (profileId && opponentProfileId === profileId) {
    opponentProfileId = tx.from_profile_id;
  }
  const [actor] = await UI.formatProfile(onPlatform, opponentProfileId);
  const actorLbl = actor?.value ?? "";
  const tmpl = isTransferIn
    ? template.transaction.transferIn
    : template.transaction.transferOut;
  result.text = util.format(tmpl, fullAmount, actorLbl);

  // 3.2 if global we will show both sender and receiver
  if (global) {
    const [from, to] = await UI.formatProfile(
      onPlatform,
      tx.from_profile_id,
      tx.other_profile_id
    );
    if (from?.value && to?.value) {
      const tmpl = template.transaction.transferGlobal;
      result.text = isTransferIn
        ? util.format(tmpl, fullAmount, to.value, from.value)
        : util.format(tmpl, fullAmount, from.value, to.value);
    }
  }

  // 4. Return the result
  return result;
}

async function renderSiblingsTxns(
  txns: TransferTx[],
  onPlatform: TransactionSupportedPlatform,
  api?: API
) {
  // 0. Prepare result shape
  const result = {
    emoji: "",
    amount: "",
    text: "",
  };

  const amount = txns
    .reduce((acc, current) => +current.amount + acc, 0)
    .toString();

  const {
    text,
    emoji,
    full: fullAmount,
  } = await amountComp({
    on: onPlatform,
    amount: formatUnits(amount, txns[0].token.decimal),
    symbol: txns[0].token.symbol.toUpperCase(),
    api,
    prefix: MINUS_SIGN,
  });
  result.amount = text;
  result.emoji = emoji;

  // build receivers
  const [opponent] = await UI.formatProfile(
    onPlatform,
    txns[0].other_profile_id
  );
  let receivers = `${opponent?.value ?? "Unknown User"} & ${
    txns.length - 1
  } others`;
  if (txns.length === 2) {
    const [opponent2] = await UI.formatProfile(
      onPlatform,
      txns[1].other_profile_id
    );
    receivers = `${opponent?.value ?? "Unknown User"} & ${
      opponent2?.value ?? "Unknown User"
    }`;
  }

  result.text = util.format(
    template.transaction.transferOut,
    fullAmount,
    receivers
  );
  return result;
}

async function getTransferTxData(
  tx: TransferTx,
  onPlatform: TransactionSupportedPlatform,
  api?: API,
  profileId?: string
) {
  // 0. Prepare result shape
  const result = {
    emoji: "",
    amount: "",
    receiver: "",
  };

  // 1. Check if tx type is in or out
  let isTransferIn = tx.type === "in";
  // 1.1 if the other_profile_id of tx is the one who call this function,
  // we will need to invert the side of the transaction (in to out, and out to in)
  if (profileId && tx.other_profile_id === profileId) {
    isTransferIn = !isTransferIn;
  }

  // 2. Get token emoji and token amount of the transaction
  const { text, emoji } = await amountComp({
    on: onPlatform,
    amount: formatUnits(tx.amount || 0, tx.token.decimal),
    symbol: tx.token.symbol.toUpperCase(),
    api,
  });
  result.amount = text;
  result.emoji = emoji;

  // 3. Format the transaction description

  // 3.1 get the opponent of the transaction, and show only opponent
  // e.g: from B, to B
  let opponentProfileId = tx.other_profile_id;
  if (profileId && opponentProfileId === profileId) {
    opponentProfileId = tx.from_profile_id;
  }
  const [actor] = await UI.formatProfile(onPlatform, opponentProfileId);
  const receiver = actor?.value ?? "";
  result.receiver = receiver;

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
  };

  // 1. check if tx type if in or out
  const isTransferIn = tx.type === "in";

  // 2. get the token amount, and token emoji of the transaction
  const sign = isTransferIn ? PLUS_SIGN : MINUS_SIGN;
  const {
    text,
    emoji,
    full: fullAmount,
  } = await amountComp({
    on: onPlatform,
    amount: formatUnits(tx.amount || 0, tx.token.decimal),
    symbol: tx.token.symbol.toUpperCase(),
    api,
    prefix: global ? undefined : sign,
  });
  result.amount = text;
  result.emoji = emoji;

  // 3. Format the vault transaction description
  const [actor] = await UI.formatProfile(
    onPlatform,
    isVault(tx, "to")
      ? {
          type: "vault",
          id: tx.metadata.vault_request.vault_id.toString(),
        }
      : (tx as VaultTransferTx).other_profile_id
  );
  const actorLbl = actor?.value ?? "";
  const templ = isTransferIn
    ? template.transaction.transferIn
    : template.transaction.transferOut;
  result.text = util.format(templ, fullAmount, actorLbl);

  // if global we will should show both sender and receiver
  // otherwise just show the actor (the one who trigger the function)
  // if sender or receiver is vault, we would render it specially
  if (global) {
    const [from, to] = await UI.formatProfile(
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
      const templ = template.transaction.transferGlobal;
      result.text = isTransferIn
        ? util.format(templ, fullAmount, to.value, from.value)
        : util.format(templ, fullAmount, from.value, to.value);
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
  const text = util.format(
    template.transaction.deposit,
    amount,
    address.shorten(normalized)
  );

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
  const text = util.format(template.transaction.withdraw, amount, resolved);

  // 2. return the result
  return {
    emoji,
    text,
  };
}

async function renderAirdropTx(
  tx: AirdropTx,
  onPlatform: TransactionSupportedPlatform,
  api?: API,
  profileId?: string
) {
  // 0. Check if the actor is the one who receive or send airdrop
  const isAirdropReceiver = profileId && profileId === tx.other_profile_id;

  // 1. Get the token amount and token emoji of the transaction
  const { full: amount, emoji } = await amountComp({
    on: onPlatform,
    api,
    symbol: tx.token.symbol.toUpperCase(),
    amount: formatUnits(tx.amount, tx.token.decimal),
    prefix: isAirdropReceiver ? PLUS_SIGN : MINUS_SIGN,
  });

  // 2. Format the transaction description for airdrop receiver
  if (isAirdropReceiver) {
    const [actor] = await UI.formatProfile(onPlatform, tx.from_profile_id);
    const actorLbl = actor?.value ?? "";
    const text = util.format(
      template.transaction.airdropReceive,
      amount,
      actorLbl
    );
    return {
      emoji,
      text,
    };
  }

  // 3. Format the transaction description for airdrop sender
  const numOfWinners = tx.other_profile_ids.length;
  let text = util.format(
    template.transaction.airdropWithoutParticipant,
    amount
  );
  if (numOfWinners > 0) {
    const subject = numOfWinners > 1 ? "people" : "person";
    text = util.format(
      template.transaction.airdropWithParticipant,
      amount,
      numOfWinners,
      subject
    );
  }
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
    const [sender] = await UI.formatProfile(onPlatform, tx.other_profile_id);
    by = sender?.value;
  }
  if (!by && tx.other_profile_source) {
    by = await address.lookup(tx.other_profile_source);
  }

  // 2. prepare the paylink tx description
  let text = util.format(
    template.transaction.paylinkWithoutSender,
    amount,
    HOMEPAGE,
    tx.metadata.code
  );
  if (by && tx.status === "success") {
    text = util.format(
      template.transaction.paylinkWithSender,
      amount,
      HOMEPAGE,
      tx.metadata.code,
      by
    );
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
    const [sender] = await UI.formatProfile(onPlatform, tx.other_profile_id);
    by = sender?.value;
  }
  if (!by && tx.other_profile_source) {
    by = await address.lookup(tx.other_profile_source);
  }

  // 2. Prepare the payme tx description
  let text = util.format(
    template.transaction.paymeWithoutSender,
    amount,
    HOMEPAGE
  );
  if (by) {
    const tmpl =
      tx.status === "success"
        ? template.transaction.paymeWithSenderSuccess
        : template.transaction.paymeWithSender;
    text = util.format(tmpl, amount, HOMEPAGE, by);
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
    const transferTx = tx.actions.find((a: any) => {
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
    const transferTx = tx.actions.find((a: any) => {
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
    profileId,
    api,
  }: Props & Paging,
  tableParams?: Parameters<typeof mdTable>[1]
) {
  let data = (
    await Promise.all(
      txns
        .sort(latest)
        .filter(filterNoise)
        .map((tx) => formatTxn(tx, on, global, groupDate, api, profileId))
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
