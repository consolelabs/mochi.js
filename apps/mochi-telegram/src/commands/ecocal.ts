import { ecocalApi } from "adapters";
import { Context } from "telegraf";
import { stringUtils } from "utils";
import { VERTICAL_BAR } from "constant";
import { MachineConfig, route } from "utils/router";
import { ECOCAL_API_KEY } from "env";
import moment from "moment-timezone";
import { utils } from "@consolelabs/mochi-formatter";

export const machineConfig: MachineConfig = {
  id: "ecocal",
  initial: "ecocal",
  context: {
    renderer: {
      ecocal: (_tgCxt, ev, ctx) => {
        if (ev == "TODAY") {
          ctx.dateNumber = 0;
        }

        if (ev == "NEXT_DATE") {
          if (ctx.dateNumber <= 30) {
            ctx.dateNumber++;
          }
        }

        if (ev == "PREV_DATE") {
          if (ctx.dateNumber >= -30) {
            ctx.dateNumber--;
          }
        }

        if (ev == "LOW_IMPACT") {
          ctx.impact = "1";
        }

        if (ev == "MEDIUM_IMPACT") {
          ctx.impact = "2";
        }

        if (ev == "HIGH_IMPACT") {
          ctx.impact = "3";
        }

        return render(ctx.dateNumber, ctx.impact);
      },
    },
    impact: "3",
    dateNumber: 0,
  },
  states: {
    ecocal: {
      on: {
        NEXT_DATE: "ecocal",
        TODAY: "ecocal",
        PREV_DATE: "ecocal",
        LOW_IMPACT: "ecocal",
        MEDIUM_IMPACT: "ecocal",
        HIGH_IMPACT: "ecocal",
      },
    },
  },
};

async function render(dateNumber: number, impact: string) {
  const now = new Date();
  now.setDate(now.getDate() + dateNumber);

  const startDate = moment(now).tz("Asia/Ho_Chi_Minh").startOf("day");
  const endDate = moment(now).tz("Asia/Ho_Chi_Minh").endOf("day");
  const formatDate = startDate.format("MMM DD, YYYY");
  const utcStartDate = startDate.utc();
  const utcEndDate = endDate.utc();

  const ecocalData = await ecocalApi.ecocal.get(
    impact,
    utcStartDate.toISOString(),
    utcEndDate.toISOString(),
    ECOCAL_API_KEY
  );
  if (ecocalData.err) throw new Error("Couldn't get profile data");

  const text = utils.mdTable(
    ecocalData.map((t: any) => {
      const actual = t.actual?.trim() !== "" ? t.actual : "N/A";
      const forecast = t.forecast?.trim() !== "" ? t.forecast : "N/A";
      const previous = t.previous?.trim() !== "" ? t.previous : "N/A";

      return {
        event_name: t.event_name ?? "",
        currency: (t.currency ?? "").toUpperCase(),
        actual: "A: " + actual ?? "",
        previous: "P: " + previous ?? "",
        forecast: "F: " + forecast ?? "",
      };
    }),
    {
      cols: ["actual", "previous", "forecast"],
      separator: [VERTICAL_BAR, VERTICAL_BAR, VERTICAL_BAR],
      row: (f, i) => {
        const impact = ecocalData[i].impact ?? "";
        let impactSign = "🔹";
        switch (impact) {
          case "1":
            impactSign = "🔹";
            break;
          case "2":
            impactSign = "🔸";
            break;
          case "3":
            impactSign = "🔺";
        }

        const countryName = ecocalData[i].country_name ?? "";
        let countryFlag = "🏳️";
        switch (countryName) {
          case "United States":
            countryFlag = "🇺🇸";
            break;
          case "Euro Zone":
            countryFlag = "🇪🇺";
            break;
          case "United Kingdom":
            countryFlag = "🇬🇧";
        }

        const eventName = ecocalData[i].event_name
          .replaceAll("(", "\\(")
          .replaceAll(")", "\\)");
        const eventTimeStr = moment(ecocalData[i].time).format("HH:mm");
        return `${countryFlag} [*${eventTimeStr} • ${eventName}*](${ecocalData[i].url})\n${impactSign} ${f}\n`;
      },
    }
  );

  const lines = [];
  lines.push(`🗓️ *ECONOMIC CALENDAR* • *${formatDate}*`);
  lines.push(
    "\n_Indicators in real\\-time as economic events are announced and see the immediate global market impact\\._"
  );
  lines.push("");

  if (text.length == 0) {
    lines.push("There is no Economic Event in this day\\.");
  } else {
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
              text: "🔹 Low",
              callback_data: "LOW_IMPACT",
            },
            {
              text: "🔸 Medium",
              callback_data: "MEDIUM_IMPACT",
            },
            {
              text: "🔺 High",
              callback_data: "HIGH_IMPACT",
            },
          ],
          [
            {
              text: "⬅️",
              callback_data: "PREV_DATE",
            },
            {
              text: "📅 Today",
              callback_data: "TODAY",
            },
            {
              text: "➡️",
              callback_data: "NEXT_DATE",
            },
          ],
        ],
      },
    },
  };
}

export default {
  ecocal: async function (ctx: Context) {
    const { text, options } = await render(0, "3");

    const msg = await ctx.replyWithMarkdownV2(text, options);
    return route(ctx, msg, machineConfig);
  },
};
