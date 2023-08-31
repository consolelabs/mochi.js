import time from "../time";
import UI, { Platform } from "..";
import { mdTable } from "../markdownTable";
import type { Paging } from "../types";
import { formatTokenDigit } from "../formatDigit";
import { formatUnits } from "ethers";
import pageIndicator from "./page-indicator";
import type { PayLink } from "@consolelabs/mochi-rest";
import groupBy from "lodash.groupby";

const STATUS_MAP = {
  claimed: "✅",
  new: "🔵",
  submitted: "🔵",
  expired: "⚪",
  expire_soon: "⚠️",
};

const updateStatus = (status: PayLink["status"], date: Date) => {
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
  payMes: Array<PayLink>;
  on?: Platform.Discord | Platform.Telegram | Platform.Web;
  withTitle?: boolean;
  groupDate?: boolean;
  title?: string;
  profileId: string;
};

async function formatPayMe(
  pm: PayLink,
  on: Platform.Web | Platform.Telegram | Platform.Discord,
  profileId: string
) {
  // const claimedDate = new Date(pm.claimed_at);
  const expiredDate = new Date(pm.expired_at);
  const createdDate = new Date(pm.created_at);
  const t = time.relative(createdDate.getTime());
  const code = pm.code;
  const status = updateStatus(pm.status, expiredDate);
  const statusIcon = STATUS_MAP[status] || "🔵";
  const shortCode = `${code.slice(0, 2)}..${code.slice(-3)}`;
  const amount = formatTokenDigit(
    formatUnits(pm.amount || 0, pm.token.decimal)
  );

  const isRequester = pm.from_profile_id === profileId;
  const [otherProfile] = await UI.resolve(on, pm.to_profile_id);

  const action = status === "claimed" ? "paid" : "requested";

  let text = `You ${action} ${otherProfile?.value}`;
  if (!isRequester) {
    text = `${otherProfile?.value} ${action} you`;
  }

  const result = {
    status: statusIcon,
    time: t,
    amount: amount + " " + pm.token.symbol.toUpperCase(),
    shortCode,
    text: text,
  };

  return result;
}

function latest(pm1: PayLink, pm2: PayLink) {
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
    profileId,
    withTitle,
    groupDate,
  }: Props & Paging,
  tableParams?: Parameters<typeof mdTable>[1]
) {
  let data = await Promise.all(
    payMes.sort(latest).map((pl: PayLink) => formatPayMe(pl, on, profileId))
  );

  let text;

  if (groupDate) {
    const groupByDate = groupBy(data, "time");
    const lines = Object.entries(groupByDate).map((e, i) => {
      const isLast = i === Object.keys(groupByDate).length - 1;
      const [time, payMes] = e;
      return [
        `🗓 *Created ${time}*`,
        mdTable(payMes, {
          ...(tableParams ?? {}),
          cols: ["shortCode", "amount", "text"],
          alignment: ["left", "right", "left"],
          wrapCol: [true, true, false],
          wrapLastCol: false,
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
      ...(withTitle ? ["📜 *Pay me request status*"] : []),
      ...(groupDate && withTitle ? [""] : []),
      text,
      "",
      ...pager,
    ].join("\n"),
    totalPage: total,
  };
}
