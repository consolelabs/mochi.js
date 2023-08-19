import { Context } from "telegraf";
import {
  MachineConfig,
  RouterSpecialAction,
  paginationButtons,
  route,
} from "utils/router";

// This is a config for this command's state machine
//
// It allows the command author to easily build complex interaction flow
// base on user's actions
//
// Each state corresponds to 1 view that the command can be in when showing on the UI
const machineConfig: MachineConfig = {
  // should be unique
  id: "__COMMAND_NAME",
  // the initial state
  initial: "parent",
  // the state's machine context, a list of state's renderers
  // must be present in order to render the view
  // it can also holds any arbitrary data
  context: {
    renderer: {
      parent: async () => ({
        context: {
          page: 0,
        },
        text: "this is parent",
        options: {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "go to child 1 view",
                  callback_data: "to_child_1",
                },
                {
                  text: "go to child 2 view",
                  callback_data: "to_child_2",
                },
              ],
            ],
          },
        },
      }),
      child1: async () => ({ text: "this is child1" }),
      child2: async (_tgCtx: Context, _ev: string, ctx) => ({
        text: `this is child2, page ${ctx.page + 1}/10`,
        options: {
          reply_markup: {
            inline_keyboard: [paginationButtons(ctx.page, 10)],
          },
        },
      }),
    },
    page: 0,
  },
  // declare the states that this command
  states: {
    parent: {
      // defines actions that transition state
      // actions must be in UPPERCASE
      on: {
        TO_CHILD_1: "child1",
        TO_CHILD_2: "child2",
      },
    },
    child1: {
      on: {
        [RouterSpecialAction.BACK]: "parent",
      },
    },
    child2: {
      on: {
        [RouterSpecialAction.BACK]: "parent",
        [RouterSpecialAction.PREV_PAGE]: "child2",
        [RouterSpecialAction.NEXT_PAGE]: "child2",
      },
    },
  },
};

export default {
  __COMMAND_NAME: async function (ctx: Context) {
    const msg = await ctx.replyWithMarkdownV2(
      "Hello from command __COMMAND_NAME",
      {
        // this is from Telegram API
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "go to child 1 view",
                callback_data: "to_child_1",
              },
              {
                text: "go to child 2 view",
                callback_data: "to_child_2",
              },
            ],
          ],
        },
      }
    );

    // the `route` is where the state machine starts
    route(ctx, msg, machineConfig);
  },
};
