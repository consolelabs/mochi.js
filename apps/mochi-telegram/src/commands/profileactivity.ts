import { profileApi } from "adapters";
import { Context } from "telegraf";
import { PROFILE_ACTIVITY } from "constant";
import { stringUtils } from "utils";
import {
  MachineConfig,
  paginationButtons,
  route,
  RouterSpecialAction,
} from "utils/router";
import { Platform, PageSize } from "@consolelabs/mochi-formatter";
import { fmt } from "utils/formatter";

export const machineConfig: MachineConfig = {
  id: "profile_activity",
  initial: "profile_activity",
  context: {
    renderer: {
      profile_activity: (tgCtx, ev, ctx) => {
        if (ev === "VIEW_PROFILE_LOG") {
          ctx.page = 0;
        }
        return render(tgCtx, ctx.page);
      },
    },
    page: 0,
  },
  states: {
    profile_activity: {
      on: {
        [RouterSpecialAction.NEXT_PAGE]: "profile_activity",
        [RouterSpecialAction.PREV_PAGE]: "profile_activity",
      },
    },
  },
};

async function render(ctx: Context, page: number) {
  const profileData = await profileApi.getByTelegram(
    ctx.from?.id.toString() ?? ""
  );
  if (profileData.err) throw new Error("Couldn't get profile data");

  const lines = [];
  lines.push("🕘️ *Profile Activity Logs*\n");

  if (!profileData) {
    lines.push("There is no Profile Activity Logs");
    return {
      text: stringUtils.escape(lines.join("\n")),
    };
  }

  const res = await profileApi.getUserActivities(profileData.id, {
    actions: PROFILE_ACTIVITY,
    page,
    size: PageSize.Medium,
  });

  if (!res.data?.length) {
    lines.push("There is no Profile Activity Logs");
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
    lines.push("There is no Profile Activity Logs");
  } else {
    lines.push("Recent profile activity logs");
    lines.push("⎯".repeat(5));
    lines.push(stringUtils.escape(text));
  }

  return {
    text: lines.join("\n"),
    options: {
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [paginationButtons(page, res.pagination.totalPage)],
      },
    },
  };
}

export default {
  profile_activity: async function (ctx: Context) {
    const { text, options } = await render(ctx, 0);

    const msg = await ctx.replyWithMarkdownV2(text, options);

    route(ctx, msg, machineConfig);
  },
};
