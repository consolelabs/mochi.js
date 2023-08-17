import time from "../time";
import UI, { Platform } from "..";
import { mdTable } from "../markdownTable";
import type { Paging, Token } from "../types";
import { formatTokenDigit } from "../formatDigit";
import { formatUnits } from "ethers";
import address from "../address";
import pageIndicator from "./page-indicator";
import groupby from "lodash.groupby";
import { HOMEPAGE } from "../constant";

// other types except OnchainTx are all offchain
type Tx =
  | OnchainTx
  | PayLinkTx
  | PayMeTx
  | AirdropTx
  | TransferTx
  | DepositTx
  | WithdrawTx
  | SwapTx;

interface BaseTx {
  type: "in" | "out";
  created_at: string;
}

// onchain tx doesn't have the same data shape as others
interface OnchainTx {
  type: "in" | "out";
  tx_hash: string;
  signed_at: string;
  has_transfer: boolean;
  actions: Array<{
    from?: string;
    to?: string;
    amount?: number;
    unit?: string;
    native_transfer: boolean;
  }>;
  scan_base_url: string;
}

interface TransferTx extends BaseTx {
  action: "transfer";
  other_profile_id: string;
  external_id: string;
  amount: string;
  token: Token;
}

interface DepositTx extends BaseTx {
  action: "deposit";
  contract_id: string;
  tx_hash: string;
  amount: string;
  from: string;
  token: Token;
  other_profile_source: string;
}

interface WithdrawTx extends BaseTx {
  action: "withdraw";
  tx_hash: string;
  amount: string;
  token: Token;
  other_profile_source: string;
}

interface AirdropTx extends BaseTx {
  action: "airdrop";
  amount: string;
  token: Token;
  other_profile_ids: string[];
}

interface SwapTx extends BaseTx {
  action: "swap";
  amount_in: string;
  amount_out: string;
  tx_hash: string;
  from_token: Token;
  to_token: Token;
}

interface PayLinkTx extends BaseTx {
  action: "paylink";
  other_profile_id: string;
  other_profile_source: string;
  metadata: {
    paylink_code: string;
  };
  amount: string;
  token: Token;
}

interface PayMeTx extends BaseTx {
  action: "payme";
  other_profile_id: string;
  other_profile_source: string;
  metadata: Record<string, any>;
  amount: string;
  token: Token;
}

type Props = {
  txns: Array<Tx>;
  on?: Platform.Discord | Platform.Telegram | Platform.Web;
  top?: number;
  groupDate?: boolean;
  withTitle?: boolean;
};

async function formatTxn(
  tx: Tx,
  on: Platform.Web | Platform.Telegram | Platform.Discord
) {
  const date = new Date("created_at" in tx ? tx.created_at : tx.signed_at);
  const t = time.relative(date.getTime());
  const isMochiTx = "external_id" in tx;
  const receiptUrl = isMochiTx
    ? ` → [view receipt](${HOMEPAGE}/transfer/${tx.external_id})`
    : "";
  const result = {
    time: t,
    text: "",
  };

  if ("action" in tx) {
    switch (tx.action) {
      case "transfer": {
        switch (tx.type) {
          case "in": {
            const [from] = await UI.account(on, tx.other_profile_id);
            if (!Number.isNaN(Number(tx.token.decimal))) {
              const amount = formatTokenDigit(
                formatUnits(tx.amount || 0, tx.token.decimal)
              );

              result.text = `+${amount} ${tx.token.symbol.toUpperCase()}${
                from?.value ? ` from ${from.value}` : ""
              }`;
            }
            break;
          }
          case "out": {
            const [to] = await UI.account(on, tx.other_profile_id);
            if (!Number.isNaN(Number(tx.token.decimal))) {
              const amount = formatTokenDigit(
                formatUnits(tx.amount || 0, tx.token.decimal)
              );
              result.text = `-${amount} ${tx.token.symbol.toUpperCase()}${
                to?.value ? ` to ${to.value}` : ""
              }`;
            }
          }
        }
        break;
      }
      case "deposit": {
        const amount = formatTokenDigit(
          formatUnits(tx.amount, tx.token.decimal)
        );
        const normalized = await address.normalizeAddress(
          tx.other_profile_source
        );
        result.text = `+${amount} ${tx.token.symbol.toUpperCase()} deposited to \`${address.shorten(
          normalized
        )}\``;
        break;
      }
      case "withdraw": {
        const amount = formatTokenDigit(
          formatUnits(tx.amount, tx.token.decimal)
        );
        const resolved = await address.lookup(tx.other_profile_source);
        result.text = `-${amount} ${tx.token.symbol.toUpperCase()} withdrawn to \`${resolved}\``;
        break;
      }
      case "airdrop": {
        const amount = formatTokenDigit(
          formatUnits(tx.amount, tx.token.decimal)
        );
        const numOfWinners = tx.other_profile_ids.length;
        result.text = `-${amount} ${tx.token.symbol.toUpperCase()} airdropped${
          numOfWinners > 0
            ? ` to ${numOfWinners} ${numOfWinners > 1 ? "people" : "person"}`
            : " but no one joined"
        }`;
        break;
      }
      case "paylink": {
        const amount = formatTokenDigit(
          formatUnits(tx.amount, tx.token.decimal)
        );
        let by;
        if (tx.other_profile_id) {
          const [sender] = await UI.account(on, tx.other_profile_id);
          by = sender?.value;
        } else {
          by = address.lookup(tx.other_profile_source);
        }
        result.text = `-${amount} ${tx.token.symbol.toUpperCase()} [Pay Link](${HOMEPAGE}/pay/${
          tx.metadata.paylink_code
        }) claimed by ${by}`;
        break;
      }
      case "payme": {
        const amount = formatTokenDigit(
          formatUnits(tx.amount, tx.token.decimal)
        );
        let by;
        if (tx.other_profile_id) {
          const [sender] = await UI.account(on, tx.other_profile_id);
          by = sender?.value;
        } else {
          by = address.lookup(tx.other_profile_source);
        }
        result.text = `+${amount} ${tx.token.symbol.toUpperCase()} [Pay Me](${HOMEPAGE}/pay) paid by ${by}`;
        break;
      }
    }
    result.text += receiptUrl;
    return result;

    // swap
    // if ("from_token" in tx) {
    //   const fromToken = tx.from_token.symbol.toUpperCase();
    //   const toToken = tx.to_token.symbol.toUpperCase();
    //   if (tx.amount_in && tx.amount_out) {
    //     result.text = `-${formatTokenDigit(
    //       formatUnits(tx.amount_in, tx.from_token.decimal)
    //     )} ${fromToken} 🔁 +${formatTokenDigit(
    //       formatUnits(tx.amount_out, tx.to_token.decimal)
    //     )} ${toToken}`;
    //   }
    //   return result;
    // }
  }

  if ("has_transfer" in tx) {
    const transferTx = tx.actions.find((a) => {
      if (a.native_transfer) return true;
      if (a.from && a.to && a.amount !== 0 && a.unit) return true;
      return false;
    });
    if (!transferTx) return result;
    const amount = transferTx.amount ?? 0;
    if (amount === 0) return result;
    const isDebit = Math.sign(amount) < 0;
    let target = isDebit ? transferTx.to : transferTx.from;
    if (!target) return result;
    target = await address.normalizeAddress(target);
    target = address.shorten(target);

    result.text = `${!isDebit ? "+" : ""}${transferTx.amount ?? 0} ${
      transferTx.unit ?? ""
    } ${isDebit ? "to" : "from"} \`${target}\``;
    return result;
  }

  return result;
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

function beforeMap(tx: Tx) {
  for (const checker of [filterSpamToken, filterOnchainOnlyTransfer]) {
    const stillValid = checker(tx);
    if (!stillValid) {
      return false;
    }
  }

  return true;
}

function latest(tx1: Tx, tx2: Tx) {
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
  }: Props & Paging,
  tableParams?: Parameters<typeof mdTable>[1]
) {
  let data = (
    await Promise.all(
      txns
        .sort(latest)
        .filter(beforeMap)
        .map((tx) => formatTxn(tx, on))
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
        `🗓 ${time}`,
        mdTable(txns, {
          ...(tableParams ?? {}),
          cols: ["text"],
          wrapLastCol: false,
        }),
        ...(isLast ? [] : [""]),
      ].join("\n");
    });

    text = lines.join("\n");
  } else {
    text = mdTable(data, {
      ...(tableParams ?? {}),
      wrapLastCol: false,
      cols: ["time", "text"],
      alignment: ["left", "left"],
    });
  }

  if (!text) {
    text = "There is no transaction, yet 🙁";
  }

  const { text: pager } = await pageIndicator({
    page,
    totalPage: total,
  });

  return {
    text: [
      ...(withTitle ? ["📜 *History*"] : []),
      ...(groupDate && withTitle ? [""] : []),
      text,
      "",
      ...pager,
    ].join("\n"),
    totalPage: total,
  };
}
