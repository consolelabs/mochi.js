import render, { Platform, Profile } from "../ui/render";
import { A, B } from "./fixture/ui";

test.each<
  [Platform.Web | Platform.Telegram | Platform.Discord, Profile, Profile]
>([[Platform.Web, A, B]])("UI.render", (on, A, B) => {
  const [a, b] = render(on, A, B);
  expect(a?.plain).toBe("👾 0xlight");
  expect(b?.plain).toBe("👾 baddeed");
});
