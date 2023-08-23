import time from "../time";
import UI, { Platform } from "..";
import { mdTable } from "../markdownTable";
import type { Paging } from "../types";
import { formatTokenDigit } from "../formatDigit";
import { formatUnits } from "ethers";
import pageIndicator from "./page-indicator";
import { HOMEPAGE } from "../constant";
import type { PayLink } from "@consolelabs/mochi-rest";
import groupBy from "lodash.groupby";

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
  const claimedDate = new Date(pl.claimed_at);
  const expiredDate = new Date(pl.expired_at);
  const createdDate = new Date(pl.created_at);
  const t = time.relative(createdDate.getTime());
  const code = pl.code;
  const shortCode = code.slice(0, 2) + ".." + code.slice(-3);
  const link = `[Link](${HOMEPAGE}/pay/${code})`;
  const amount = formatTokenDigit(
    formatUnits(pl.amount || 0, pl.token.decimal)
  );

  let text = `${pl.status}`;
  switch (pl.status) {
    case "claimed":
      const [claimer] = await UI.resolve(on, pl.claimer || pl.to_profile_id);
      text = `claimed by ${claimer?.value} ${time.relative(
        claimedDate.getTime()
      )}`;
      break;
    case "expired":
      text = `expired ${time.relative(expiredDate.getTime())}`;
      break;

    default:
      break;
  }

  const result = {
    time: t,
    amount: amount + " " + pl.token.symbol.toUpperCase(),
    shortCode,
    link,
    text: text + ` \\[${link}\\]`,
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
        `🗓 ${time}`,
        mdTable(payLinks, {
          ...(tableParams ?? {}),
          cols: ["shortCode", "amount", "text"],
          alignment: ["left", "right", "left"],
          wrapCol: [true, true, false],
          wrapLastCol: false,
        }),
        ...(isLast ? [] : [""]),
      ].join("\n");
    });

    text = lines.join("\n");
  } else {
    text = mdTable(data, {
      ...(tableParams ?? {}),
      cols: ["shortCode", "amount", "text"],
      wrapCol: [true, true, false],
      alignment: ["left", "right", "left"],
    });
  }

  const { text: pager } = await pageIndicator({
    page,
    totalPage: total,
  });

  return {
    text: [
      ...(withTitle ? ["📜 *Pay Link*"] : []),
      ...(groupDate && withTitle ? [""] : []),
      text,
      "",
      ...pager,
    ].join("\n"),
    totalPage: total,
  };
}
