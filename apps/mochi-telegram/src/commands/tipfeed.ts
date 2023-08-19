import { Context } from "telegraf";
import { MachineConfig, RouterSpecialAction, route } from "utils/router";
import { payApi } from "../adapters";
import { stringUtils, timeUtils } from "../utils";
import { formatUnits } from "ethers";
import { fmt } from "utils/formatter";
import { Platform, utils } from "@consolelabs/mochi-formatter";

// This is a config for this command's state machine
//
// It allows the command author to easily build complex interaction flow
// base on user's actions
//
// Each state corresponds to 1 view that the command can be in when showing on the UI
const machineConfig: MachineConfig = {
  // should be unique
  id: "tipfeed",
  // the initial state
  initial: "tipfeed",
  // the state's machine context, a list of state's renderers
  // must be present in order to render the view
  // it can also holds any arbitrary data
  context: {
    renderer: {
      tipfeed: render,
    },
    page: 0,
  },
  // declare the states that this command
  states: {
    tipfeed: {
      on: {
        [RouterSpecialAction.PREV_PAGE]: "tipfeed",
        [RouterSpecialAction.NEXT_PAGE]: "tipfeed",
      },
    },
  },
};

export default {
  feed: async function (ctx: Context) {
    const { text, options } = await render();

    const msg = await ctx.replyWithMarkdownV2(text, options);

    // the `route` is where the state machine starts
    route(ctx, msg, machineConfig);
  },
};

async function render() {
  const txnsRes = await payApi.transactions.getAllTransactions(
    0,
    40,
    "transfer"
  );
  if (txnsRes.error || txnsRes.err)
    throw new Error("Couldn't get transaction data");
  const txns = await Promise.all([
    ...txnsRes
      .filter((tx: any) => tx.type === "out")
      .slice(0, 10)
      .map(async (tx: any) => {
        const [sender, receiver] = await fmt.resolve(
          Platform.Telegram,
          tx.from_profile_id,
          tx.other_profile_id
        );

        const amount = `${utils.formatTokenDigit(
          formatUnits(tx.amount || 0, tx.token?.decimal ?? 18)
        )} ${tx.token.symbol}`;

        return {
          content: stringUtils.escape(
            `${sender?.value || "?"} to ${receiver?.value || "?"}`
          ),
          amount,
          time: timeUtils.relative(new Date(tx.created_at).getTime()),
        };
      }),
  ]);

  const dateArray = [...new Set(txns.map((item: any) => item.time))];

  const lines = [];
  lines.push("🌏 *Latest tips*");
  lines.push("👇 This is the 10 latest transactions on mochi\\.gg");
  lines.push("");

  dateArray.forEach((value) => {
    lines.push("🗓 " + `${value}`);
    const filterTxn = [...txns.filter((tx: any) => tx.time === value)];
    const text = utils.mdTable(filterTxn, {
      cols: ["amount", "content"],
      alignment: ["left", "left"],
      wrapCol: [true, false],
    });
    lines.push(text);
    lines.push("");
  });

  return {
    text: lines.join("\n"),
    options: {
      footer: "/tip your frens to be on top",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [],
      },
    },
  };
}
