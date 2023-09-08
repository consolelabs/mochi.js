import time from "../time";
import UI, { Platform } from "..";
import { mdTable } from "../markdownTable";
import type { Paging } from "../types";
import { formatTokenDigit } from "../formatDigit";
import { formatUnits } from "ethers";
import pageIndicator from "./page-indicator";
import type { PayLink, PaylinkStatus } from "@consolelabs/mochi-rest";
import groupBy from "lodash.groupby";

const STATUS_MAP: Record<PaylinkStatus | "expire_soon", string> = {
  success: "✅",
  failed: "❌",
  pending: "🔵",
  expired: "⚪",
  expire_soon: "⚠️",
};

const updateStatus = (status: PaylinkStatus, date: Date) => {
  const today = new Date();
  if (date < today) {
    return status;
  }
  const diff = today.getTime() - date.getTime();
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
};

async function formatPayLink(
  pl: PayLink,
  on: Platform.Web | Platform.Telegram | Platform.Discord
) {
  const settledDate = new Date(pl.settled_at ?? "");
  const expiredDate = new Date(pl.expired_at);
  const createdDate = new Date(pl.created_at);
  const t = time.relative(createdDate.getTime());
  const code = pl.code;
  const status = updateStatus(pl.status, expiredDate);
  const statusIcon = STATUS_MAP[status] || "🔵";
  const shortCode = `${code.slice(0, 2)}..${code.slice(-3)}`;
  const amount = formatTokenDigit(
    formatUnits(pl.amount || 0, pl.token.decimal)
  );

  let text = "";
  switch (status) {
    case "pending": {
      text = "up for grab";
      break;
    }
    case "success": {
      if (pl.type === "in") {
        if (!pl.to_profile_id) {
          text = `claimed from someone ${time.relative(settledDate.getTime())}`;
          break;
        }
        const [author] = await UI.resolve(on, pl.to_profile_id);
        text = `claimed from ${author?.value} ${time.relative(
          settledDate.getTime()
        )}`;
      } else {
        if (!pl.to_profile_id) {
          text = `claimed by someone ${time.relative(settledDate.getTime())}`;
          break;
        }
        const [claimer] = await UI.resolve(on, pl.to_profile_id);
        text = `claimed by ${claimer?.value} ${time.relative(
          settledDate.getTime()
        )}`;
      }
      break;
    }
    case "failed": {
      text = "failed";
      break;
    }
    case "expired": {
      text = `expired ${time.relative(expiredDate.getTime())}`;
      break;
    }
    default:
      break;
  }

  const result = {
    status: statusIcon,
    time: t,
    amount: amount + " " + pl.token.symbol.toUpperCase(),
    shortCode,
    text: text,
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
  }: Props & Paging,
  tableParams?: Parameters<typeof mdTable>[1]
) {
  let data = await Promise.all(
    payLinks.sort(latest).map((pl: PayLink) => formatPayLink(pl, on))
  );

  let text;

  if (groupDate) {
    const groupByDate = groupBy(data, "time");
    const lines = Object.entries(groupByDate).map((e, i) => {
      const isLast = i === Object.keys(groupByDate).length - 1;
      const [time, payLinks] = e;
      return [
        `🗓 Created ${time}`,
        mdTable(payLinks, {
          ...(tableParams ?? {}),
          cols: ["shortCode", "amount", "text"],
          alignment: ["left", "right", "left"],
          wrapCol: [true, true, false],
          wrapLastCol: false,
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
      alignment: ["left", "right", "left"],
      wrapCol: [true, true, false],
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
      ...(withTitle ? ["📜 *Pay link status*"] : []),
      ...(groupDate && withTitle ? [""] : []),
      text,
      "",
      ...pager,
    ].join("\n"),
    totalPage: total,
  };
}
