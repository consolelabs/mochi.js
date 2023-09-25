import API from "@consolelabs/mochi-rest";
import UI, { Platform, utils } from "..";
import { VERTICAL_BAR } from "../constant";

type Props = {
  on: Platform.Discord | Platform.Telegram;
  timerange: "alltime" | "weekly" | "monthly";
  api: API;
};

let pos: Array<string> = [];

export default async function ({ api, on, timerange }: Props) {
  if (on === Platform.Discord) {
    if (!pos.length) {
      const { ok, data } = await api.base.metadata.getEmojis({
        codes: [
          "ANIMATED_BADGE_1",
          "ANIMATED_BADGE_2",
          "ANIMATED_BADGE_3",
          "BLANK",
        ],
      });
      if (ok) {
        const [badge1, badge2, badge3, blank] = data;
        pos = [
          badge3.emoji,
          badge1.emoji,
          badge2.emoji,
          ...Array(7).fill(blank.emoji),
        ];
      }
    }
  } else {
    pos = ["1st", "2nd", "3rd", ...Array(7).fill("")];
  }
  const { ok, data: leaderboard } = await api.pay.users.getLeaderboard(
    timerange
  );
  if (!ok) throw new Error("Couldn't get leaderboard data");

  const topSender = leaderboard.top_sender.map((d, i) => {
    const [name] = UI.render(on, d.profile as any);

    return {
      pos: pos[i],
      name: name?.value ?? "",
      usd: utils.formatUsdDigit(d.usd_amount),
    };
  });

  const topReceiver = leaderboard.top_receiver.map((d, i) => {
    const [name] = UI.render(on, d.profile as any);

    return {
      pos: pos[i],
      name: name?.value ?? "",
      usd: utils.formatUsdDigit(d.usd_amount),
    };
  });

  const sender = utils.mdTable(topSender, {
    cols: on === Platform.Discord ? ["usd", "name"] : ["pos", "usd", "name"],
    wrapCol: on === Platform.Discord ? [true, false] : [true, true, false],
    alignment:
      on === Platform.Discord ? ["right", "left"] : ["left", "right", "left"],
    row: (f, i) =>
      on === Platform.Discord ? `${pos[i]}${VERTICAL_BAR}${f}` : f,
  });

  const receiver = utils.mdTable(topReceiver, {
    cols: on === Platform.Discord ? ["usd", "name"] : ["pos", "usd", "name"],
    wrapCol: on === Platform.Discord ? [true, false] : [true, true, false],
    alignment:
      on === Platform.Discord ? ["right", "left"] : ["left", "right", "left"],
    row: (f, i) =>
      on === Platform.Discord ? `${pos[i]}${VERTICAL_BAR}${f}` : f,
  });

  let timePhrase = "";
  let leaderboardTitle = "";
  switch (timerange) {
    case "weekly":
      timePhrase = "in the last 7d";
      leaderboardTitle = "Weekly";
      break;
    case "monthly":
      timePhrase = "in the last 30d";
      leaderboardTitle = "Monthly";
      break;
    case "alltime":
    default:
      timePhrase = "since Mochi was born";
      break;
  }

  const lines = [];
  lines.push(
    `${on === Platform.Telegram ? "*" : "**"}🚀 Top 10 senders${
      on === Platform.Telegram ? "*" : "**"
    }`
  );

  if (sender.length == 0) {
    lines.push("There are no outstanding senders, yet\\.");
  } else {
    lines.push(sender);
  }

  lines.push("");
  lines.push(
    `${on === Platform.Telegram ? "*" : "**"}🎯 Top 10 receivers${
      on === Platform.Telegram ? "*" : "**"
    }`
  );
  if (receiver.length == 0) {
    lines.push("There are no outstanding receivers, yet\\.");
  } else {
    lines.push(receiver);
  }
  lines.push("");

  lines.push(`This data is recorded ${timePhrase}`);

  return {
    title: `${
      on === Platform.Telegram ? "*" : ""
    }${leaderboardTitle} Tip Leaderboard${on === Platform.Telegram ? "*" : ""}`,
    text: lines.join("\n"),
  };
}
