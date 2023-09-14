import { remark } from "remark";
import { Platform } from "../index";
import remarkGfm from "remark-gfm";
import API from "@consolelabs/mochi-rest";

type Props = {
  title: string;
  // expect content to be markdown format
  content: string;
  on: Platform.Discord | Platform.Telegram;
  api?: API;
};

type Context = {
  images: string[];
  firstParagraph: boolean;
  firstHeading: boolean;
};

const markdownConverter: Record<
  Platform.Discord | Platform.Telegram,
  (content: any, ctx: any) => string
> = {
  [Platform.Telegram]: telegram,
  [Platform.Discord]: discord,
};

function discord(content: any, ctx: Context) {
  let text = "";
  if (Array.isArray(content)) {
    content.forEach((c) => {
      text += discord(c, ctx);
    });
  } else {
    switch (content.type) {
      case "strong":
      case "list":
      case "listItem":
      case "link":
      case "inlineCode":
      case "code":
      case "text": {
        text += content.value;
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
      case "strong":
      case "list":
      case "listItem":
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

function emojiByPlatform(on: Platform.Telegram | Platform.Discord, api?: API) {
  switch (on) {
    case Platform.Telegram:
      return "🎊";
    case Platform.Discord:
      return api?.emojis.get("ANIMATED_PARTY_POPPER")?.emoji ?? "🎊";
    default:
      return "🎊";
  }
}

export default async function ({ api, title, content, on }: Props) {
  const ast = remark().use(remarkGfm).parse(content);
  const convert = markdownConverter[on];

  const ctx: Context = {
    images: [],
    firstHeading: false,
    firstParagraph: false,
  };
  const text = convert(ast.children, ctx);

  return {
    images: ctx.images.filter((i) => i.includes("imgur.com")),
    text: [
      `${emojiByPlatform(on, api)} Product Update: ${title} ${emojiByPlatform(
        on,
        api
      )}`,
      text,
    ]
      .join("\n")
      .replaceAll("#", "\\#")
      .replaceAll(".", "\\."),
  };
}
