import time from "../time";
import UI, { Platform } from "..";
import { mdTable } from "../markdownTable";
import type { Paging } from "../types";
import { formatUnits } from "ethers";
import address from "../address";
import pageIndicator from "./page-indicator";
import groupby from "lodash.groupby";
import { HOMEPAGE } from "../constant";
import type { VaultTransferTx, TransferTx, Tx } from "@consolelabs/mochi-rest";
import API from "@consolelabs/mochi-rest";
import string from "../string";
import amountComp from "./amount";

type Props = {
  txns: Array<Tx>;
  on?: Platform.Discord | Platform.Telegram | Platform.Web;
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

function isVault(
  tx: VaultTransferTx | TransferTx,
  source: "from" | "to"
): tx is VaultTransferTx {
  return (
    (source === "from" ? tx.from_profile_source : tx.other_profile_source) ===
      "mochi-vault" &&
    "metadata" in tx &&
    "vault_request" in tx.metadata &&
    "vault_id" in tx.metadata.vault_request
  );
}

async function formatTxn(
  tx: Tx,
  on: Platform.Web | Platform.Telegram | Platform.Discord,
  global: boolean,
  api?: API
) {
  const date = new Date("created_at" in tx ? tx.created_at : tx.signed_at);
  const t = time.relative(date.getTime());
  const result = {
    time: t,
    amount: "",
    text: "",
    external_id: "",
  };

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

  result.external_id = string.receiptLink(tx.external_id, true);

  if ("action" in tx) {
    switch (tx.action) {
      case "transfer": {
        switch (tx.type) {
          case "in": {
            let amount = "";
            if (!Number.isNaN(Number(tx.token.decimal))) {
              const { text } = await amountComp({
                on,
                amount: formatUnits(tx.amount || 0, tx.token.decimal),
                symbol: tx.token.symbol.toUpperCase(),
                api,
                prefix: "+",
              });
              result.amount = text;
              amount = text;
            }
            if (global) {
              const [from, to] = await UI.resolve(
                on,
                isVault(tx, "from")
                  ? {
                      type: "vault",
                      id: tx.metadata.vault_request.vault_id.toString(),
                    }
                  : tx.from_profile_id,
                isVault(tx, "to")
                  ? {
                      type: "vault",
                      id: tx.metadata.vault_request.vault_id.toString(),
                    }
                  : tx.other_profile_id
              );
              if (from?.value && to?.value) {
                result.text = `${to.value} to ${from.value}`;
              }
            } else {
              const [from] = await UI.resolve(
                on,
                isVault(tx, "to")
                  ? {
                      type: "vault",
                      id: tx.metadata.vault_request.vault_id.toString(),
                    }
                  : tx.other_profile_id
              );

              result.text = `${amount}${
                from?.value ? ` from ${from.value}` : ""
              }`;
            }
            break;
          }
          case "out": {
            let amount = "";
            if (!Number.isNaN(Number(tx.token.decimal))) {
              const { text } = await amountComp({
                on,
                amount: formatUnits(tx.amount || 0, tx.token.decimal),
                symbol: tx.token.symbol.toUpperCase(),
                api,
                prefix: "-",
              });
              result.amount = text;
              amount = text;
            }
            if (global) {
              const [from, to] = await UI.resolve(
                on,
                isVault(tx, "from")
                  ? {
                      type: "vault",
                      id: tx.metadata.vault_request.vault_id.toString(),
                    }
                  : tx.from_profile_id,
                isVault(tx, "to")
                  ? {
                      type: "vault",
                      id: tx.metadata.vault_request.vault_id.toString(),
                    }
                  : tx.other_profile_id
              );
              if (from?.value && to?.value) {
                result.text = `${from.value} to ${to.value}`;
              }
            } else {
              const [to] = await UI.resolve(
                on,
                isVault(tx, "to")
                  ? {
                      type: "vault",
                      id: tx.metadata.vault_request.vault_id.toString(),
                    }
                  : tx.other_profile_id
              );
              result.text = `${amount}${to?.value ? ` to ${to.value}` : ""}`;
            }
            break;
          }
        }
        break;
      }
      case "deposit": {
        const { text: amount } = await amountComp({
          on,
          api,
          symbol: tx.token.symbol.toUpperCase(),
          amount: formatUnits(tx.amount, tx.token.decimal),
          prefix: "+",
        });
        const normalized = await address.normalizeAddress(
          tx.other_profile_source
        );
        result.text = `${amount} deposited to \`${address.shorten(
          normalized
        )}\``;
        break;
      }
      case "withdraw": {
        const { text: amount } = await amountComp({
          on,
          api,
          symbol: tx.token.symbol.toUpperCase(),
          amount: formatUnits(tx.amount, tx.token.decimal),
          prefix: "-",
        });
        const resolved = await address.lookup(tx.other_profile_source);
        result.text = `${amount} withdrawn to \`${resolved}\``;
        break;
      }
      case "airdrop": {
        const { text: amount } = await amountComp({
          on,
          api,
          symbol: tx.token.symbol.toUpperCase(),
          amount: formatUnits(tx.amount, tx.token.decimal),
          prefix: "-",
        });
        const numOfWinners = tx.other_profile_ids.length;
        result.text = `${amount} airdropped${
          numOfWinners > 0
            ? ` to ${numOfWinners} ${numOfWinners > 1 ? "people" : "person"}`
            : " but no one joined"
        }`;
        break;
      }
      case "paylink": {
        const { text: amount } = await amountComp({
          on,
          api,
          symbol: tx.token.symbol.toUpperCase(),
          amount: formatUnits(tx.amount, tx.token.decimal),
          prefix: "-",
        });
        let by;
        if (tx.other_profile_id) {
          const [sender] = await UI.resolve(on, tx.other_profile_id);
          by = sender?.value;
        } else {
          by = address.lookup(tx.other_profile_source);
        }
        result.text = `${amount} [Pay Link](${HOMEPAGE}/pay/${tx.metadata.paylink_code}) claimed by ${by}`;
        break;
      }
      case "payme": {
        const { text: amount } = await amountComp({
          on,
          api,
          symbol: tx.token.symbol.toUpperCase(),
          amount: formatUnits(tx.amount, tx.token.decimal),
          prefix: "+",
        });
        let by;
        if (tx.other_profile_id) {
          const [sender] = await UI.resolve(on, tx.other_profile_id);
          by = sender?.value;
        } else {
          by = address.lookup(tx.other_profile_source);
        }
        result.text = `${amount} [Pay Me](${HOMEPAGE}/pay) paid by ${by}`;
        break;
      }
    }
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
        .filter(beforeMap)
        .map((tx) => formatTxn(tx, on, global, api))
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
          cols: global ? ["amount", "text"] : ["external_id", "text"],
          alignment: ["left", "left"],
          wrapCol: global ? [true, false] : [false, false],
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

  return {
    text: [
      ...(withTitle ? ["📜 *History*"] : []),
      ...(groupDate && withTitle ? [""] : []),
      text,
      "",
      ...(pager ? [pager] : []),
    ].join("\n"),
    totalPage: total,
    length: data.length,
  };
}
