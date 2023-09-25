import time from "../time";
import UI, { Platform } from "..";
import { mdTable } from "../markdownTable";
import type { Paging } from "../types";
import { formatTokenDigit } from "../formatDigit";
import { formatUnits } from "ethers";
import pageIndicator from "./page-indicator";
import type { PayMe, PaylinkStatus } from "@consolelabs/mochi-rest";
import groupBy from "lodash.groupby";
import string from "../string";

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
  payMes: Array<PayMe>;
  on?: Platform.Discord | Platform.Telegram | Platform.Web;
  withTitle?: boolean;
  groupDate?: boolean;
  title?: string;
};

async function formatPayMe(
  pm: PayMe,
  on: Platform.Web | Platform.Telegram | Platform.Discord
) {
  const expiredDate = new Date(pm.expired_at);
  const createdDate = new Date(pm.created_at);
  const t = time.relative(createdDate.getTime(), "Created");
  const status = updateStatus(pm.status, expiredDate);
  const code = pm.code;
  const statusIcon = STATUS_MAP[status] || "🔵";
  const amount = formatTokenDigit(
    formatUnits(pm.amount || 0, pm.token.decimal)
  );

  let text = "";
  switch (status) {
    case "failed":
    case "expired":
    case "expire_soon":
    case "pending": {
      if (!pm.to_profile_id) {
        text = "You requested";
        break;
      }
      if (pm.type === "out") {
        const [author] = await UI.resolve(on, pm.to_profile_id);
        text = `${author?.value} requested you`;
      } else {
        const [claimer] = await UI.resolve(on, pm.to_profile_id);
        text = `You requested ${claimer?.value}`;
      }
      break;
    }
    case "success": {
      if (!pm.to_profile_id) break;
      if (pm.type === "out") {
        const [author] = await UI.resolve(on, pm.to_profile_id);
        text = `You paid ${author?.value}`;
      } else {
        const [claimer] = await UI.resolve(on, pm.to_profile_id);
        text = `${claimer?.value} paid you`;
      }
      break;
    }
    default:
      break;
  }

  const result = {
    status: statusIcon,
    time: t,
    amount: amount + " " + pm.token.symbol.toUpperCase(),
    shortCode: string.receiptLink(code, true),
    text: text,
  };

  return result;
}

function latest(pm1: PayMe, pm2: PayMe) {
  let time1, time2;
  time1 = new Date(pm1.created_at).getTime();
  time2 = new Date(pm2.created_at).getTime();
  return time2 - time1;
}

export default async function (
  {
    payMes,
    page = 0,
    total = 1,
    on = Platform.Telegram,
    withTitle,
    groupDate,
  }: Props & Paging,
  tableParams?: Parameters<typeof mdTable>[1]
) {
  let data = await Promise.all(
    payMes.sort(latest).map((pl: PayMe) => formatPayMe(pl, on))
  );

  let text;

  if (groupDate) {
    const groupByDate = groupBy(data, "time");
    const lines = Object.entries(groupByDate).map((e, i) => {
      const isLast = i === Object.keys(groupByDate).length - 1;
      const [time, payMes] = e;
      return [
        `🗓 *${time}*`,
        mdTable(payMes, {
          ...(tableParams ?? {}),
          cols: ["shortCode", "amount", "text"],
          alignment: ["left", "left", "left"],
          wrapCol: [false, true, false],
          row(formatted, index) {
            return payMes[index].status + " " + formatted;
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
      ...(withTitle ? ["📜 *Pay me request status*"] : []),
      "Need help? Try `/payme -h`",
      ...(groupDate && withTitle ? [""] : []),
      text,
      "",
      ...pager,
    ].join("\n"),
    totalPage: total,
  };
}
