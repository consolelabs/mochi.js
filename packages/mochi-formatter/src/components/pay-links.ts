import time from "../time";
import UI, { Platform } from "..";
import { mdTable } from "../markdownTable";
import type { Paging } from "../types";
import { formatTokenDigit } from "../formatDigit";
import { formatUnits } from "ethers";
import pageIndicator from "./page-indicator";
import type { PayLink, PaylinkStatus } from "@consolelabs/mochi-rest";
import groupBy from "lodash.groupby";
import string from "../string";
import API from "@consolelabs/mochi-rest";
import { VERTICAL_BAR } from "../constant";

const STATUS_MAP: Record<PaylinkStatus | "expire_soon", string> = {
  success: "✅",
  failed: "❌",
  pending: "🔵",
  expired: "⚪",
  expire_soon: "⚠️",
};

const updateStatus = (status: PaylinkStatus, date: Date) => {
  const today = new Date();

  if (date.getTime() < today.getTime()) {
    return status;
  }

  const diff = date.getTime() - today.getTime();
  const diffDay = Math.ceil(diff / (1000 * 3600 * 24));
  if (diffDay <= 3) {
    return "expire_soon";
  }
  return status;
};

type Props = {
  payLinks: Array<PayLink>;
  on?: Platform.Discord | Platform.Telegram | Platform.Web;
  withTitle?: boolean;
  groupDate?: boolean;
  api?: API;
};

async function formatPayLink(
  pl: PayLink,
  on: Platform.Web | Platform.Telegram | Platform.Discord,
  api?: API
) {
  const settledDate = pl.settled_at ? new Date(pl.settled_at) : new Date();
  const expiredDate = new Date(pl.expired_at);
  const createdDate = new Date(pl.created_at);
  const t = time.relative(createdDate);
  const code = pl.code;
  const status = updateStatus(pl.status, expiredDate);
  const statusIcon = STATUS_MAP[status] || "🔵";
  const amount = formatTokenDigit(
    formatUnits(pl.amount || 0, pl.token.decimal)
  );
  let emoji = "";
  if (api) {
    const { data } = await api.base.metadata.getEmojis({
      codes: [pl.token.symbol],
    });
    const e = data?.at(0);
    if (e) {
      emoji = e.emoji;
    } else {
      emoji = api.fallbackCoinEmoji.emoji;
    }
  }

  let text = "";
  switch (status) {
    case "pending": {
      text = "new";
      break;
    }
    case "success": {
      if (!pl.to_profile_id) break;
      if (pl.type !== "in") {
        const [claimer] = await UI.formatProfile(on, pl.to_profile_id);
        text = `claimed by ${claimer?.value} ${time.relative(settledDate)}`;
      } else {
        const [author] = await UI.formatProfile(on, pl.to_profile_id);
        text = `claimed from ${author?.value} ${time.relative(settledDate)}`;
      }
      break;
    }
    case "expired": {
      text = `expired ${time.relative(expiredDate)}`;
      break;
    }
    case "expire_soon":
    case "failed":
    default:
      break;
  }

  const result = {
    status: `${on === Platform.Discord ? "\\" + statusIcon : statusIcon}`,
    time: t,
    amount: amount + " " + pl.token.symbol.toUpperCase(),
    shortCode: string.receiptLink(code, true),
    text,
    emoji,
  };

  return result;
}

function latest(pl1: PayLink, pl2: PayLink) {
  let time1, time2;
  time1 = new Date(pl1.created_at).getTime();
  time2 = new Date(pl2.created_at).getTime();
  return time2 - time1;
}

export default async function (
  {
    payLinks,
    page = 0,
    total = 1,
    on = Platform.Telegram,
    withTitle,
    groupDate,
    api,
  }: Props & Paging,
  tableParams?: Parameters<typeof mdTable>[1]
) {
  let data = await Promise.all(
    payLinks.sort(latest).map((pl: PayLink) => formatPayLink(pl, on, api))
  );

  let text;

  if (groupDate) {
    const groupByDate = groupBy(data, "time");
    const lines = Object.entries(groupByDate).map((e, i) => {
      const isLast = i === Object.keys(groupByDate).length - 1;
      const [time, payLinks] = e;
      return [
        `${on === Platform.Telegram ? "🗓 *" : "\\🗓 **"}${time}${
          on === Platform.Telegram ? "*" : "**"
        }`,
        mdTable(payLinks, {
          ...(tableParams ?? {}),
          cols: ["shortCode", "amount", "text"],
          alignment: ["left", "left", "left"],
          wrapCol: [false, true, false],
          row(formatted, index) {
            if (on === Platform.Discord) {
              const [code, amount, text] = formatted.split(VERTICAL_BAR);
              return (
                payLinks[index].status +
                " " +
                code +
                VERTICAL_BAR +
                payLinks[index].emoji +
                " " +
                amount +
                VERTICAL_BAR +
                text
              );
            }
            return payLinks[index].status + " " + formatted;
          },
        }),
        ...(isLast ? [] : [""]),
      ].join("\n");
    });

    text = lines.join("\n");
  } else {
    text = mdTable(data, {
      ...(tableParams ?? {}),
      cols: ["shortCode", "amount", "text"],
      alignment: ["left", "left", "left"],
      wrapCol: [false, true, false],
    });
  }

  if (!text) {
    text = "There is no pay link, yet 🙁";
  }

  const { text: pager } = await pageIndicator({
    page,
    totalPage: total,
  });

  let proposalEmoji = "";
  if (api) {
    const { data } = await api.base.metadata.getEmojis({
      codes: ["PROPOSAL"],
    });
    const e = data?.at(0);
    if (e) {
      proposalEmoji = e.emoji;
    } else {
      proposalEmoji = api.fallbackCoinEmoji.emoji;
    }
  }

  return {
    text: [
      ...(withTitle
        ? [
            `${
              on === Platform.Telegram ? `📜 *` : proposalEmoji + " **"
            }Pay link request status${on === Platform.Telegram ? "*" : "**"}`,
          ]
        : []),
      `${
        on === Platform.Telegram ? "Need help? Try `/paylink -h`" : "undefined"
      }`,
      ...(groupDate && withTitle ? [""] : []),
      text,
      "",
      ...pager,
    ]
      .filter((line) => line != "undefined")
      .join("\n"),
    totalPage: total,
  };
}
