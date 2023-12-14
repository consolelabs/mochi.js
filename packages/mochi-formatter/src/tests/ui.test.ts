import render, { Platform, Profile } from "../ui/render";
import { A, B } from "./fixture/ui";

test.each<
  [
    Platform.Web | Platform.Telegram | Platform.Discord,
    Profile,
    Profile,
    string,
    string
  ]
>([
  [
    Platform.Web,
    A,
    B,
    "👾 [0xlight](https://mochi.gg/profile/43000)",
    "👾 [baddeed](https://mochi.gg/profile/40409)",
  ],
  [
    Platform.Telegram,
    A,
    B,
    "[@Light_Huy_Tieu](https://mochi.gg/profile/43000)",
    "[@nntruonghan](https://mochi.gg/profile/40409)",
  ],
  [Platform.Discord, A, B, "<@361172853326086144>", "<@151497832853929986>"],
])("UI.render", (on, A, B, outputA, outputB) => {
  const [a, b] = render(on, A, B);
  expect(a?.value).toBe(outputA);
  expect(b?.value).toBe(outputB);
});
