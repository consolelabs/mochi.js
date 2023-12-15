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
import { VERTICAL_BAR } from "../constant";
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
  payMes: Array<PayMe>;
  on?: Platform.Discord | Platform.Telegram | Platform.Web;
  withTitle?: boolean;
  groupDate?: boolean;
  title?: string;
  api?: API;
};

async function formatPayMe(
  pm: PayMe,
  on: Platform.Web | Platform.Telegram | Platform.Discord,
  api?: API
) {
  const expiredDate = new Date(pm.expired_at);
  const createdDate = new Date(pm.created_at);
  const t = time.relative(createdDate);
  const status = updateStatus(pm.status, expiredDate);
  const code = pm.code;
  const statusIcon = STATUS_MAP[status] || "🔵";
  const amount = formatTokenDigit(
    formatUnits(pm.amount || 0, pm.token.decimal)
  );
  let emoji = "";
  if (api) {
    const { data } = await api.base.metadata.getEmojis({
      codes: [pm.token.symbol],
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
    case "failed":
    case "expired":
    case "expire_soon":
    case "pending": {
      if (!pm.to_profile_id) {
        text = "You created a request";
        break;
      }
      if (pm.type === "out") {
        const [author] = await UI.formatProfile(on, pm.to_profile_id);
        text = `${author?.value} requested you`;
      } else {
        const [claimer] = await UI.formatProfile(on, pm.to_profile_id);
        text = `You requested ${claimer?.value}`;
      }
      break;
    }
    case "success": {
      if (!pm.to_profile_id) break;
      if (pm.type === "out") {
        const [author] = await UI.formatProfile(on, pm.to_profile_id);
        text = `You paid ${author?.value}`;
      } else {
        const [claimer] = await UI.formatProfile(on, pm.to_profile_id);
        text = `${claimer?.value} paid you`;
      }
      break;
    }
    default:
      break;
  }

  const result = {
    status: `${on === Platform.Discord ? "\\" + statusIcon : statusIcon}`,
    time: t,
    amount: amount + " " + pm.token.symbol.toUpperCase(),
    shortCode: string.receiptLink(code, true),
    text,
    emoji,
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
    api,
  }: Props & Paging,
  tableParams?: Parameters<typeof mdTable>[1]
) {
  let data = await Promise.all(
    payMes.sort(latest).map((pl: PayMe) => formatPayMe(pl, on, api))
  );

  let text;

  if (groupDate) {
    const groupByDate = groupBy(data, "time");
    const lines = Object.entries(groupByDate).map((e, i) => {
      const isLast = i === Object.keys(groupByDate).length - 1;
      const [time, payMes] = e;

      return [
        `${on === Platform.Telegram ? "🗓 *" : "\\🗓 **"}${time}${
          on === Platform.Telegram ? "*" : "**"
        }`,
        mdTable(payMes, {
          ...(tableParams ?? {}),
          cols: ["shortCode", "amount", "text"],
          alignment: ["left", "left", "left"],
          wrapCol: [false, true, false],
          row(formatted, index) {
            if (on === Platform.Discord) {
              const [code, amount, text] = formatted.split(VERTICAL_BAR);
              return (
                payMes[index].status +
                " " +
                code +
                VERTICAL_BAR +
                payMes[index].emoji +
                " " +
                amount +
                VERTICAL_BAR +
                text
              );
            }
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
      wrapCol: [false, false, false],
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
            }Pay me request status${on === Platform.Telegram ? "*" : "**"}`,
          ]
        : []),
      `${
        on === Platform.Telegram ? "Need help? Try `/payme -h`" : "undefined"
      }`,
      ...(groupDate && withTitle ? [""] : []),
      text,
      "",
      ...pager,
    ]
      .filter((line) => line !== "undefined")
      .join("\n"),
    totalPage: total,
  };
}
