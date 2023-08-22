import time from "../time";
import UI, { Platform } from "..";
import { mdTable } from "../markdownTable";
import { formatTokenDigit } from "../formatDigit";
import { formatUnits } from "ethers";
import { ActivityType } from "../constant";
import address from "../address";
import { capitalCase } from "change-case";
import type { Paging } from "../types";
import groupBy from "lodash.groupby";

interface Activity {
  created_at: string;
  id: number;
  type: ActivityType;
  status: "new" | "read";
  changes: Array<{ key: string; value: string }>;
  user_profile_id: string;
  target_profile_id: string;
  content_raw: string;
}

type Props = {
  activities: Array<Activity>;
  onlyShow?: ActivityType[];
  top?: number;
  on: Platform.Web | Platform.Discord | Platform.Telegram;
  groupDate?: boolean;
};

function formatActivity(
  on: Platform.Web | Platform.Discord | Platform.Telegram
) {
  return async function (activity: Activity) {
    const date = new Date(activity.created_at);
    const t = time.relative(date.getTime());
    const result = {
      time: t,
      text: "",
    };

    const notEnoughDataError = new Error(
      `MochiFormatter: activity type ${activity.type} data not enough to render`
    );

    switch (activity.type) {
      case ActivityType.AddOnchainWallet: {
        const wallet = activity.changes.find((c) => c.key === "wallet")?.value;
        const chain = activity.changes.find((c) => c.key === "chain")?.value;

        if (!wallet || !chain) throw notEnoughDataError;

        result.text = activity.content_raw
          .replace("{.wallet}", `\`${address.shorten(wallet)}\``)
          .replace("{.chain}", capitalCase(chain));
        break;
      }
      case ActivityType.Withdraw: {
        const amount = activity.changes.find((c) => c.key === "amount")?.value;
        // const decimal = activity.changes.find(
        //   (c) => c.key === "decimal"
        // )?.value;
        const token = activity.changes.find((c) => c.key === "token")?.value;

        if (!amount || !token) throw notEnoughDataError;

        result.text = activity.content_raw
          .replace("{.amount}", amount)
          .replace("{.token}", token);
        break;
      }
      case ActivityType.Receive: {
        const amount = activity.changes.find((c) => c.key === "amount")?.value;
        const decimal = activity.changes.find(
          (c) => c.key === "decimal"
        )?.value;
        const token = activity.changes.find((c) => c.key === "token")?.value;
        const otherPid = activity.target_profile_id;
        const [username] = await UI.resolve(on, otherPid);

        if (!username)
          throw new Error("MochiFormatter: activity platform not supported");
        if (!amount || !decimal || !token) throw notEnoughDataError;

        const formattedAmount = formatTokenDigit(formatUnits(amount, +decimal));
        result.text = activity.content_raw
          .replace("{.amount}", formattedAmount)
          .replace("{.token}", token)
          .replace("{.target_profile_id}", username.value);
        break;
      }
      case ActivityType.Send: {
        const amount = activity.changes.find((c) => c.key === "amount")?.value;
        const decimal = activity.changes.find(
          (c) => c.key === "decimal"
        )?.value;
        const token = activity.changes.find((c) => c.key === "token")?.value;
        const otherPid = activity.target_profile_id;
        const [username] = await UI.resolve(on, otherPid);

        if (!username)
          throw new Error("MochiFormatter: activity platform not supported");
        if (!amount || !decimal || !token) throw notEnoughDataError;

        const formattedAmount = formatTokenDigit(formatUnits(amount, +decimal));
        result.text = activity.content_raw
          .replace("{.amount}", formattedAmount)
          .replace("{.token}", token)
          .replace("{.target_profile_id}", username.value);
        break;
      }
      default:
        break;
    }

    return result;
  };
}

function latest(a1: Activity, a2: Activity) {
  const time1 = new Date(a1.created_at).getTime();
  const time2 = new Date(a2.created_at).getTime();

  return time2 - time1;
}

function filterType(types?: ActivityType[]) {
  return async function (activity: Activity) {
    return !types || types.includes(activity.type);
  };
}

export default async function (
  {
    activities,
    page = 0,
    // size = PageSize.Medium,
    total = 1,
    top,
    onlyShow,
    on,
    groupDate = false,
  }: Props & Paging,
  tableParams?: Parameters<typeof mdTable>[1]
) {
  let data = (
    await Promise.all(
      activities
        .filter(filterType(onlyShow))
        .sort(latest)
        .map(formatActivity(on))
    )
  ).filter((t) => t.text);

  if (typeof top === "number") {
    data = data.slice(0, top);
  }

  let text;
  if (groupDate) {
    const groupByDate = groupBy(data, "time");
    const lines = Object.entries(groupByDate).map((e, i) => {
      const isLast = i === Object.keys(groupByDate).length - 1;
      const [time, activities] = e;

      return [
        `🗓 ${time}`,
        mdTable(activities, {
          ...(tableParams ?? {}),
          cols: ["text"],
          wrapCol: [false],
        }),
        ...(isLast ? [] : [""]),
      ].join("\n");
    });

    text = lines.join("\n");
  } else {
    text = mdTable(data, {
      ...(tableParams ?? {}),
      wrapCol: [true, false],
      cols: ["time", "text"],
      alignment: ["left", "left"],
    });
  }

  if (!text) {
    text = `There is no activity, yet 🙁`;
  }

  const { text: pager } = await UI.components.pageIndicator({
    page,
    totalPage: total,
  });

  return {
    totalPage: total,
    text: [text, "", ...pager].join("\n"),
  };
}
