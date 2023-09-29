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
  const t = time.relative(createdDate.getTime());
  const code = pl.code;
  const status = updateStatus(pl.status, expiredDate);
  const statusIcon = STATUS_MAP[status] || "🔵";
  const amount = formatTokenDigit(
    formatUnits(pl.amount || 0, pl.token.decimal)
  );

  let text = "";
  switch (status) {
    case "pending": {
      text = "new";
      break;
    }
    case "success": {
      if (!pl.to_profile_id) break;
      if (pl.type !== "in") {
        const [claimer] = await UI.resolve(on, pl.to_profile_id);
        text = `claimed by ${claimer?.value} ${time.relative(
          settledDate.getTime()
        )}`;
      } else {
        const [author] = await UI.resolve(on, pl.to_profile_id);
        text = `claimed from ${author?.value} ${time.relative(
          settledDate.getTime()
        )}`;
      }
      break;
    }
    case "expired": {
      text = `expired ${time.relative(expiredDate.getTime())}`;
      break;
    }
    case "expire_soon":
    case "failed":
    default:
      break;
  }

  let emoji = api?.fallbackCoinEmoji.emoji ?? "";
  if (api) {
    const { data } = await api?.base.metadata.getEmojis({
      codes: [pl.token.symbol.toUpperCase()],
    });
    if (data) {
      emoji = data[0].emoji;
    }
  }

  const result = {
    status: `${on === Platform.Discord ? "\\" + statusIcon : statusIcon}`,
    time: t,
    amount:
      on === Platform.Discord
        ? emoji + `\`${amount} ${pl.token.symbol.toUpperCase()}\``
        : `\`${amount} ${pl.token.symbol.toUpperCase()}\``,
    shortCode: string.receiptLink(code, true),
    text: text,
    emoji: emoji,
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
        `🗓 ${on === Platform.Telegram ? "*" : "**"}${time}${
          on === Platform.Telegram ? "*" : "**"
        }`,
        mdTable(payLinks, {
          ...(tableParams ?? {}),
          cols: ["shortCode", "amount", "text"],
          alignment: ["left", "left", "left"],
          wrapCol: [false, false, false],
          row(formatted, index) {
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

  return {
    text: [
      ...(withTitle
        ? [
            `${on === Platform.Telegram ? `📜 *` : `\\📜 **`}Pay link status${
              on === Platform.Telegram ? "*" : "**"
            }`,
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
