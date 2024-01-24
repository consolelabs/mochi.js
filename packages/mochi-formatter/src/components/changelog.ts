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
  images: string[];
  firstParagraph: boolean;
  firstHeading: boolean;
  firstHeading3: boolean;
  breakPreview: boolean;
  emoji: string;
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
      if (ctx.breakPreview) {
        return text;
      }
      text += discord(c, ctx);
    });
  } else {
    switch (content.type) {
      case "list":
      case "listItem":
        content.children.forEach((c: any) => {
          text += discord(c, ctx);
        });
        break;
      case "strong":
        text += `**${discord(content.children, ctx)}**`;
        break;
      case "link":
        text += `[${discord(content.children, ctx)}](${content.url})`;
        break;
      case "inlineCode":
      case "text": {
        text += `${content.value}`;
        break;
      }
      case "heading": {
        if (ctx.firstHeading3 && content.depth === 3) {
          ctx.firstHeading3 = false;
          break;
        }
        text += `${ctx.firstHeading ? `${ctx.emoji} ` : ""}**${discord(
          content.children,
          ctx
        )}**${ctx.firstHeading ? ` ${ctx.emoji}\n` : ""}`;
        ctx.firstHeading = false;
        break;
      }
      case "paragraph": {
        text += `\n${discord(content.children, ctx)}`;
        break;
      }
      case "image": {
        ctx.images.push(content.url);
        break;
      }
      case "delete": {
        if (content.children.at(0)) {
          text += `~~${content.children.at(0).value}~~`;
        }
        break;
      }
      case "definition":
        ctx.breakPreview = true;
        break;
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
      if (ctx.breakPreview) {
        return text;
      }
      text += telegram(c, ctx);
    });
  } else {
    switch (content.type) {
      case "list":
      case "listItem":
        content.children.forEach((c: any) => {
          text += telegram(c, ctx);
        });
        break;
      case "strong":
        text += `<b>${telegram(content.children, ctx)}</b>`;
        break;
      case "link":
        text += `<a href="${content.url}">${telegram(
          content.children,
          ctx
        )}</a>`;
        break;
      case "inlineCode":
      case "code":
      case "text": {
        text += content.value;
        break;
      }
      case "heading": {
        if (ctx.firstHeading3 && content.depth === 3) {
          ctx.firstHeading3 = false;
          break;
        }
        text += `${ctx.firstHeading ? `${ctx.emoji} ` : ""}<b>${telegram(
          content.children,
          ctx
        )}</b>${ctx.firstHeading ? ` ${ctx.emoji}\n` : ""}`;
        ctx.firstHeading = false;
        break;
      }
      case "paragraph": {
        text += `\n${telegram(content.children, ctx)}`;
        ctx.firstParagraph = true;
        break;
      }
      case "image": {
        ctx.images.push(content.url);
        break;
      }
      case "delete": {
        if (content.children.at(0)) {
          text += `~${content.children.at(0).value}~`;
        }
        break;
      }
      case "definition":
        ctx.breakPreview = true;
        break;
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
    images: [],
    firstHeading: true,
    firstHeading3: true,
    firstParagraph: true,
    breakPreview: false,
    emoji: await emojiByPlatform(on, api),
  };
  const text = convert(ast.children, ctx);
  return {
    images: ctx.images.filter((i) => i.includes("imgur.com")),
    text,
  };
}
