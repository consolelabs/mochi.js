import { profileApi } from "adapters";
import { Context } from "telegraf";
import { PAY_ACTIVITY } from "constant";
import { stringUtils } from "utils";

import {
  route,
  paginationButtons,
  MachineConfig,
  RouterSpecialAction,
} from "utils/router";
import { machineConfig as profileActivityMachineConfig } from "./profileactivity";
import { fmt } from "utils/formatter";
import { PageSize, Platform } from "@consolelabs/mochi-formatter";

export const machineConfig: MachineConfig = {
  id: "transaction_activity",
  initial: "transaction_activity",
  context: {
    renderer: {
      transaction_activity: (tgCtx, ev, ctx) => {
        if (ev == RouterSpecialAction.BACK) {
          ctx.page = 0;
        }
        return render(tgCtx, ctx.page);
      },
    },
    page: 0,
  },
  states: {
    transaction_activity: {
      on: {
        VIEW_PROFILE_LOG: "profile_activity",
        [RouterSpecialAction.PREV_PAGE]: "transaction_activity",
        [RouterSpecialAction.NEXT_PAGE]: "transaction_activity",
      },
    },
    profile_activity: {
      on: {
        [RouterSpecialAction.BACK]: "transaction_activity",
      },
      ...profileActivityMachineConfig,
    },
  },
};

async function render(ctx: Context, page: number) {
  const profileData = await profileApi.getByTelegram(
    ctx.from?.id.toString() ?? ""
  );
  if (profileData.err) throw new Error("Couldn't get profile data");

  const lines = [];
  lines.push("🕘️ *Transaction Activity Logs*\n");

  if (!profileData) {
    lines.push("There is no Transaction Activity Logs.");
    return {
      text: stringUtils.escape(lines.join("\n")),
    };
  }

  const res = await profileApi.getUserActivities(profileData.id, {
    actions: PAY_ACTIVITY,
    page,
    size: PageSize.Medium,
  });

  if (!res?.data?.length) {
    lines.push("There is no Transaction Activity Logs.");
    return {
      text: stringUtils.escape(lines.join("\n")),
    };
  }

  const { text } = await fmt.components.activities({
    activities: res.data ?? [],
    on: Platform.Telegram,
    total: res.pagination.totalPage,
    page,
    groupDate: true,
  });
  if (text.length == 0) {
    lines.push("There is no Transaction Activity Logs.");
  } else {
    lines.push("Recent transactions");
    lines.push("⎯".repeat(5));
    lines.push(stringUtils.escape(text));
  }

  return {
    text: lines.join("\n"),
    options: {
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🤖 Profile Logs",
              callback_data: "VIEW_PROFILE_LOG",
            },
          ],
          paginationButtons(page, res.pagination.totalPage),
        ],
      },
    },
  };
}

export default {
  activity: async function (ctx: Context) {
    const { text, options } = await render(ctx, 0);

    const msg = await ctx.replyWithMarkdownV2(text, options);

    route(ctx, msg, machineConfig);
  },
};
