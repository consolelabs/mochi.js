import UI, { Platform, utils as mochiUtils } from "..";
import { formatUnits } from "ethers";
import { APPROX } from "../constant";
import API, { Stats } from "@consolelabs/mochi-rest";

type Props = {
  on: Platform.Discord | Platform.Telegram;
  api: API;
  profileId: string;
};

async function mostSpend(
  stats: Stats,
  on: Platform.Discord | Platform.Telegram,
  api: API
) {
  let emojis: Record<string, string> | null = null;
  if (on == Platform.Discord) {
    const codes = stats.spending.map((s) => s.token.symbol);
    const { ok, data } = await api.base.metadata.getEmojis({ codes });
    if (ok) {
      emojis = Object.fromEntries(data.map((d) => [d.code, d.emoji]));
    }
  }
  const topSpendToken = [
    `${on === Platform.Telegram ? "*" : "**"}Top ${
      stats.spending.length
    } spent token${stats.spending.length > 1 ? "s" : ""}${
      on === Platform.Telegram ? "*" : "**"
    }`,
    mochiUtils.mdTable(
      stats.spending.map((spend: any) => ({
        token: `${mochiUtils.formatTokenDigit(
          formatUnits(spend.amount, spend.token.decimal)
        )} ${spend.token.symbol}`,
        amount: mochiUtils.formatUsdDigit(spend.usd_amount),
      })),
      {
        cols: ["token", "amount"],
        separator: [` ${APPROX} `],
        row: (f, i) =>
          emojis ? `${emojis[stats.spending[i].token.symbol]} ${f}` : f,
      }
    ),
  ];

  const [to] = await UI.resolve(on, stats.most_send?.other_profile_id);

  const empty = !stats.spending.length && !to?.value;

  return {
    highlight: `${on === Platform.Discord ? "\\" : ""}🔹 You spent the most ${
      on === Platform.Telegram ? "*" : "**"
    }${stats.most_send?.token.symbol}${on === Platform.Telegram ? "*" : "**"}${
      to?.value ? ` to ${to.value}` : ""
    }`,
    text: [
      ...(stats.spending.length ? topSpendToken : []),
      ...(empty
        ? [
            "\nMochi couldn't query the data, please contact the team for further support",
          ]
        : []),
    ].join("\n"),
  };
}

async function mostReceive(
  stats: Stats,
  on: Platform.Discord | Platform.Telegram,
  api: API
) {
  let emojis: Record<string, string> | null = null;
  if (on == Platform.Discord) {
    const codes = stats.receive.map((s) => s.token.symbol);
    const { ok, data } = await api.base.metadata.getEmojis({ codes });
    if (ok) {
      emojis = Object.fromEntries(data.map((d) => [d.code, d.emoji]));
    }
  }
  const topReceiveToken = [
    `${on === Platform.Telegram ? "*" : "**"}Top ${
      stats.receive.length
    } received token${stats.receive.length > 1 ? "s" : ""}${
      on === Platform.Telegram ? "*" : "**"
    }`,
    mochiUtils.mdTable(
      stats.receive.map((receive: any) => ({
        token: `${mochiUtils.formatTokenDigit(
          formatUnits(receive.amount, receive.token.decimal)
        )} ${receive.token.symbol}`,
        amount: mochiUtils.formatUsdDigit(receive.usd_amount),
      })),
      {
        cols: ["token", "amount"],
        separator: [` ${APPROX} `],
        row: (f, i) =>
          emojis ? `${emojis[stats.receive[i].token.symbol]} ${f}` : f,
      }
    ),
  ];

  const [from] = await UI.resolve(on, stats.most_receive?.other_profile_id);

  const empty = !stats.receive.length && !from?.value;

  return {
    highlight: `${on === Platform.Discord ? "\\" : ""}🔸 You received most ${
      on === Platform.Telegram ? "*" : "**"
    }${stats.most_receive?.token.symbol}${
      on === Platform.Telegram ? "*" : "**"
    }${from?.value ? ` from ${from.value}` : ""}`,
    text: [
      ...(stats.receive.length ? topReceiveToken : []),
      ...(empty
        ? [
            "\nMochi couldn't query the data, please contact the team for further support",
          ]
        : []),
    ].join("\n"),
  };
}

async function history(stats: Stats, on: Platform.Discord | Platform.Telegram) {
  const empty = stats.history.length === 0;

  const { text } = await UI.components.txns({
    on,
    txns: stats.history,
    withTitle: true,
  });

  return {
    text: [
      ...(empty
        ? [
            "Mochi couldn't query the data, please contact the team for further support",
          ]
        : [text]),
    ].join("\n"),
  };
}

export default async function ({ on, api, profileId }: Props) {
  const { ok: okStats, data: stats } = await api.pay.profile.stats(profileId);

  if (!okStats) {
    throw new Error("Cannot get user stats");
  }

  const isNeg = Math.sign(stats.total_volume) < 0;
  const isPos = Math.sign(stats.total_volume) > 0;

  const { highlight: hlSpend, text: spendText } = await mostSpend(
    stats,
    on,
    api
  );
  const { highlight: hlReceive, text: receiveText } = await mostReceive(
    stats,
    on,
    api
  );
  const { text: historyText } = await history(stats, on);

  console.log(
    "aaa",
    `${on === Platform.Telegram ? "*" : ""}Your last 30 days recap${
      on === Platform.Telegram ? "*" : ""
    }`
  );

  return {
    title: `${on === Platform.Telegram ? "*" : ""}Your last 30 days recap${
      on === Platform.Telegram ? "*" : ""
    }`,
    text: [
      isNeg
        ? `${
            on === Platform.Discord ? "\\" : ""
          }🔴 You spend more than you receive`
        : isPos
        ? `${
            on === Platform.Discord ? "\\" : ""
          }🟢 You receive more than you spend`
        : "Your spend = your receive",
      hlSpend,
      hlReceive,
      "",
      `${on === Platform.Telegram ? "*" : "**"}Details${
        on === Platform.Telegram ? "*" : "**"
      }`,
      mochiUtils.mdTable(
        [
          {
            label: "Spending",
            value: mochiUtils.formatUsdDigit(stats.total_spending),
          },
          {
            label: "Receive",
            value: mochiUtils.formatUsdDigit(stats.total_receive),
          },
          {
            label: "Net",
            value: mochiUtils.formatUsdDigit(stats.total_volume),
          },
        ],
        {
          cols: ["label", "value"],
        }
      ),
      "",
      spendText,
      "",
      receiveText,
      "",
      historyText,
    ].join("\n"),
  };
}
