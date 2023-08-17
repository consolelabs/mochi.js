import { stringUtils } from "utils";

export function replyData(message: string) {
  return {
    context: {},
    text: stringUtils.escape(message),
    options: {
      disable_web_page_preview: true,
      parse_mode: "MarkdownV2" as any,
    },
  };
}
