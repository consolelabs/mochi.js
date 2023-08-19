import { payApi } from "adapters";
import { Context } from "telegraf";
import { stringUtils } from "utils";
import { MachineConfig, route } from "utils/router";
import { fmt } from "utils/formatter";
import { Platform, utils } from "@consolelabs/mochi-formatter";

enum TimeRange {
  AllTime = "",
  Weekly = "weekly",
  Monthly = "monthly",
}

const allowTimeRangeParams = ["alltime", "weekly", "monthly"];
const TimeRangeParamMapping = {
  alltime: TimeRange.AllTime,
  weekly: TimeRange.Weekly,
  monthly: TimeRange.Monthly,
};

const machineConfig: MachineConfig = {
  id: "leaderboard",
  initial: "leaderboard",
  context: {
    renderer: {
      leaderboard: (_tgCxt, ev, ctx) => {
        if (ev === "ALLTIME") {
          ctx.timeRange = TimeRange.AllTime;
        }

        if (ev === "WEEKLY") {
          ctx.timeRange = TimeRange.Weekly;
        }

        if (ev === "MONTHLY") {
          ctx.timeRange = TimeRange.Monthly;
        }

        return render(ctx.timeRange);
      },
    },
    timeRange: TimeRange.AllTime,
  },
  states: {
    leaderboard: {
      on: {
        LEADERBOARD: "leaderboard",
        ALLTIME: "leaderboard",
        WEEKLY: "leaderboard",
        MONTHLY: "leaderboard",
      },
    },
  },
};

const pos = ["1st", "2nd", "3rd", ...Array(7).fill("")];

async function render(timeRange: TimeRange) {
  const leaderboard = await payApi.getLeaderboard(timeRange);
  if (leaderboard.error || leaderboard.err)
    throw new Error("Couldn't get leaderboard data");

  const topSender = await Promise.all(
    leaderboard.top_sender.map(async (d: any, i: number) => {
      const [name] = await fmt.resolve(Platform.Telegram, d.profile.id);

      return {
        pos: pos[i],
        name: name?.value,
        usd: utils.formatUsdDigit(d.usd_amount),
      };
    })
  );

  const topReceiver = await Promise.all(
    leaderboard.top_receiver.map(async (d: any, i: number) => {
      const [name] = await fmt.resolve(Platform.Telegram, d.profile.id);

      return {
        pos: pos[i],
        name: name?.value,
        usd: utils.formatUsdDigit(d.usd_amount),
      };
    })
  );

  const sender = utils.mdTable(topSender, {
    cols: ["pos", "usd", "name"],
    wrapCol: [true, true, false],
    alignment: ["left", "right", "left"],
  });

  const receiver = utils.mdTable(topReceiver, {
    cols: ["pos", "usd", "name"],
    alignment: ["left", "right", "left"],
    wrapCol: [true, true, false],
  });

  let timePhrase = "";
  let leaderboardTitle = "";
  switch (timeRange) {
    case TimeRange.AllTime:
      timePhrase = "since Mochi was born";
      break;
    case TimeRange.Weekly:
      timePhrase = "in the last 7d";
      leaderboardTitle = "Weekly";
      break;
    case TimeRange.Monthly:
      timePhrase = "in the last 30d";
      leaderboardTitle = "Monthly";
      break;
  }

  const lines = [];
  lines.push(`🏆 *${leaderboardTitle} Tip Leaderboard*`);
  lines.push("");
  lines.push(`*🚀 Top 10 senders*`);

  if (sender.length == 0) {
    lines.push("There are no outstanding senders, yet\\.");
  } else {
    lines.push(stringUtils.escape(sender));
  }

  lines.push("");
  lines.push(`*🎯 Top 10 receivers*`);
  if (receiver.length == 0) {
    lines.push("There are no outstanding receivers, yet\\.");
  } else {
    lines.push(stringUtils.escape(receiver));
  }
  lines.push("");

  lines.push(`_This data is recorded ${timePhrase}_`);

  return {
    text: lines.join("\n"),
    options: {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "All time",
              callback_data: "ALLTIME",
            },
            {
              text: "Weekly",
              callback_data: "WEEKLY",
            },
            {
              text: "Monthly",
              callback_data: "MONTHLY",
            },
          ],
        ],
      },
    },
  };
}

async function handler(ctx: Context) {
  const args = ctx.state.command.args;
  if (args[0] && !allowTimeRangeParams.includes(args[0])) {
    await ctx.replyWithMarkdownV2(
      "Please input correct time range e\\.g\\. `/leaderboard weekly` or `monthly` or `alltime`"
    );
    return;
  }

  const timeRangeParams = args[0] as keyof typeof TimeRangeParamMapping;
  const timeRange = TimeRangeParamMapping[timeRangeParams] || TimeRange.AllTime;
  const { text, options } = await render(timeRange);

  const msg = await ctx.replyWithMarkdownV2(text, options);
  route(ctx, msg, machineConfig);
}

export default {
  leaderboard: handler,
  top: handler,
};
