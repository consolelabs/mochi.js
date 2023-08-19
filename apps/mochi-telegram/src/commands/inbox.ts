import { profileApi } from "adapters";
import { Context } from "telegraf";
import { stringUtils } from "utils";
import { PAY_ACTIVITY } from "constant";
import {
  MachineConfig,
  route,
  RouterSpecialAction,
  paginationButtons,
} from "utils/router";
import { PageSize, Platform } from "@consolelabs/mochi-formatter";
import { fmt } from "utils/formatter";
import { capitalCase } from "change-case";

const enum Tab {
  Read = "read",
  Unread = "unread",
}
export const machineConfig: MachineConfig = {
  id: "inbox",
  initial: "inbox",
  context: {
    renderer: {
      inbox: (_tgCxt, ev, ctx) => {
        if (ev === "READ") {
          ctx.tab = Tab.Read;
        }

        if (ev === "UNREAD") {
          ctx.tab = Tab.Unread;
        }

        return render(_tgCxt, ctx as any);
      },
    },
    tab: Tab.Unread,
    page: 0,
  },
  states: {
    inbox: {
      on: {
        [RouterSpecialAction.NEXT_PAGE]: "inbox",
        [RouterSpecialAction.PREV_PAGE]: "inbox",
        READ: "inbox",
        UNREAD: "inbox",
      },
    },
  },
};

async function render(tgCtx: Context, ctx: { tab: Tab; page: number }) {
  const profileData = await profileApi.getByTelegram(
    tgCtx.from?.id.toString() ?? ""
  );
  if (profileData.err) throw new Error("Couldn't get profile data");

  const lines = [];
  lines.push(`🔔 *${capitalCase(ctx.tab)}*`);
  lines.push("");

  if (!profileData) {
    lines.push("There is no inbox");
    return {
      text: stringUtils.escape(lines.join("\n")),
    };
  }
  let status: "new" | "read" = "new";
  if (ctx.tab === Tab.Read) {
    status = "read";
  }
  const { data, pagination } = await profileApi.getUserActivities(
    profileData.id,
    {
      actions: PAY_ACTIVITY,
      status,
      page: ctx.page,
      size: PageSize.Medium,
    }
  );

  if (!data?.length) {
    lines.push("There is no inbox");
    lines.push(
      `You don't have any new notifications, why not try /withdraw or /deposit`
    );
    lines.push("After that, maybe /tip some of your friends");
    return {
      text: lines.join("\n"),
      options: {
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📨 Unread",
                callback_data: "UNREAD",
              },
              {
                text: "☑️ Read",
                callback_data: "READ",
              },
            ],
          ],
        },
      },
    };
  }

  const { text } = await fmt.components.activities({
    activities: data ?? [],
    on: Platform.Telegram,
    total: pagination.totalPage,
    page: ctx.page,
    groupDate: true,
  });

  lines.push(
    `Showing ${ctx.tab} messages \\- total ${
      (pagination?.total ?? 0) > 999 ? "999+" : pagination?.total
    }`
  );
  lines.push("⎯".repeat(5));
  lines.push(stringUtils.escape(text));

  const ids = data.map((activity: any) => activity.id).filter(Boolean);
  await profileApi
    .markReadActivities(profileData.id, { ids })
    .catch(() => null);

  // so that the api always call with page=0, because we
  // automatically mark read all the above data so all the subsequent pages now shift up 1 page
  ctx.page = -1;

  return {
    text: lines.join("\n"),
    options: {
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          paginationButtons(0, pagination.totalPage),
          [
            {
              text: "📨 Unread",
              callback_data: "UNREAD",
            },
            {
              text: "☑️ Read",
              callback_data: "READ",
            },
          ],
        ],
      },
    },
  };
}

export default {
  inbox: async function (ctx: Context) {
    const { text, options } = await render(ctx, { tab: Tab.Unread, page: 0 });

    const msg = await ctx.replyWithMarkdownV2(text, options);
    route(ctx, msg, machineConfig);
  },
};
