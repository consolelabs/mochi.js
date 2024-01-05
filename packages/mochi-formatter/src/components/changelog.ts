import { Platform } from "..";
import remarkGfm, { Root } from "remark-gfm";
import API from "@consolelabs/mochi-rest";
import { remark } from "remark";

type Props = {
  title: string;
  // expect content to be markdown format
  content: string;
  on: Platform.Discord | Platform.Telegram;
  api?: API;
};

type Context = {
  sections: string[];
  images: string[];
  firstParagraph: boolean;
  firstHeading: boolean;
};

const markdownConverter: Record<
  Platform.Discord | Platform.Telegram,
  (content: any, ctx: any) => string
> = {
  ["telegram"]: telegram,
  ["discord"]: discord,
};

// split by image sections
function discord(content: any, ctx: Context) {
  let text = "";
  if (Array.isArray(content)) {
    content.forEach((c) => {
      text += discord(c, ctx);
    });
  } else {
    switch (content.type) {
      case "list":
      case "listItem":
        text += `${discord(content.chilren, ctx)}`;
        break;
      case "strong":
        text += `**${discord(content.children, ctx)}**`;
        break;
      case "link":
      case "inlineCode":
      case "code":
      case "text": {
        text += `${content.value}`;
        break;
      }
      case "heading": {
        text += `\n${ctx.firstHeading ? "\n" : ""}**${discord(
          content.children,
          ctx
        )}**`;
        ctx.firstHeading = true;
        break;
      }
      case "paragraph": {
        text += `\n${discord(content.children, ctx)}`;
        break;
      }
      case "image": {
        text += `[.](${content.url})<br>`;
        break;
      }
      case "delete": {
        if (content.children.at(0)) {
          text += `~~${content.children.at(0).value}~~`;
        }
        break;
      }
      default:
        break;
    }
  }
  return text;
}

function telegram(content: any, ctx: Context) {
  let text = "";
  if (Array.isArray(content)) {
    content.forEach((c) => {
      text += telegram(c, ctx);
    });
  } else {
    switch (content.type) {
      case "list":
      case "listItem":
        content.children.forEach((c: any) => {
          text += telegram(c, ctx);
        });
      case "strong":
      case "link":
      case "inlineCode":
      case "code":
      case "text": {
        text += content.value;
        break;
      }
      case "heading": {
        text += `\n${ctx.firstHeading ? "\n" : ""}*${telegram(
          content.children,
          ctx
        )}*`;
        ctx.firstHeading = true;
        break;
      }
      case "paragraph": {
        text += `\n${telegram(content.children, ctx)}`;
        ctx.firstParagraph = true;
        break;
      }
      case "image": {
        text += `[view](${content.url})`;
        ctx.images.push(content.url);
        break;
      }
      case "delete": {
        if (content.children.at(0)) {
          text += `~${content.children.at(0).value}~`;
        }
        break;
      }
      default:
        break;
    }
  }
  return text;
}

async function emojiByPlatform(
  on: Platform.Telegram | Platform.Discord,
  api?: API
) {
  switch (on) {
    case Platform.Telegram:
      return "🎊";
    case Platform.Discord: {
      if (!api) return "🎊";
      const { ok, data } = await api.base.metadata.getEmojis({
        codes: ["ANIMATED_PARTY_POPPER"],
      });
      if (!ok) return "🎊";
      return data.at(0)?.emoji ?? "🎊";
    }
    default:
      return "🎊";
  }
}

export default async function ({ api, title, content, on }: Props) {
  const ast = remark().use(remarkGfm).parse(content);
  const convert = markdownConverter[on];
  const ctx: Context = {
    sections: [],
    images: [],
    firstHeading: false,
    firstParagraph: false,
  };
  let text = convert(ast.children, ctx);
  text = [`## ${title}`, text].join("\n");
  if (on === Platform.Telegram) {
    text = [`${title}`, text]
      .join("\n")
      .replaceAll("#", "\\#")
      .replaceAll(".", "\\.");
  }
  return {
    images: ctx.images.filter((i) => i.includes("imgur.com")),
    sections: ctx.sections,
    text,
  };
}
