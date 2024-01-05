import changelog from "../components/changelog";
import { Platform } from "../ui";

describe("changelog", () => {
  const title = "Changelog Jan 5 2024";
  const content =
    "## ✨ What’s News\n\n**Neko Wallet now support Facebook**\nRight now, everyone can login to their facebook account, and use tip widget as an alternative way to interact with their balances, including searching user in facebook, etc etc\n\n![](https://i.imgur.com/m2RkgNB.png)\n\n**New transactions table component**\n\nLast week we also upgrade the visual for our transactions table, new UI includes more data, right-in-a-row CTA and more. check it out at https://beta.mochi.gg\n\n**New changelog preview in Discord**\n\nTo be frank, our current component does not good so good, so we replace it with new one.\n\n**Design systems**\n\nApply the transition animation for Dropdown, Modal, Sidebar,… No annoying bolder on the button anymore.\n\n## 💎 Improvements\n\n**Tip Widget**\n\nTo optimize the display space and also ensure the experience, all the small number like 0.00….01 will be used the subscript to render with the format:\n\n**Settings**\n\nThe Settings page improved its logic on default message and transaction limit. Moreover, it applied the standard page scale which improve the interface on different screen size.\n\nSaving alert for unsaved changes.\n\n**Receipt Page**\n\nReceipt page also has a new looks, to support our new ‘join tip’ feature coming, receipt page now showing full senders or recipients including all sub-transactions\n\n![](https://i.imgur.com/7QVFe8G.jpg)\n\n**[Discord] Ticker**\n\nCurrently, ticker always makes an assumption to show just one result, based on various condition, like is that native token, how about the marketcap, etc. But sometimes, we do have a few cases when more than 1 result is expected from users.\n\nSo we add a button to let users choose what is best for them\n\n**Overview**\n\nThe Overview page has improved the scroll bar of every part which bring a better experience.\n\n**Explore Transactions**\n\nTo give user the quick stats of the app performance, we render the stat of success transactions by Mochi right on the top of the page. Furthermore, our team has enhanced the page speed to show all transactions.\n\n## 🐛 Fixes\n\n**Settings:** Fix the edit default message and transaction limit\n\n**Settings:** Remove some invalid option in the settings options\n\n**Settings:** The logic of adding new default message and limit\n\n**Tip Widget**: insufficient balance when users have enough balance.\n\n**Tip Widget**: sometimes tip widget show incorrect token after select from profile balance.\n\n**Tx Receipt**: missing image in sharing url.\n\n**Tx Receipt:** microcopy does not match with tx data (Tip instead of Transfer)\n\n**Tx Receipt**: copyright 2023 → 2024\n\n**Tx Receipt**: remove subscript number & now show full usd total amount\n\n**Tx Receipt**: showing UTC time instead of local time\n\n**Tx Receipt**: show info if send from vault or application\n\n**Transaction table:** fix pagination issues\n\n**Transaction table:** filter\n\n**Transaction table:** render full 5 transactions in the table preview on Overview page\n\n**[Discord] recent tx**: show info if send from vault or application\n\n**[Discord] profile**: show binance data";
  it("should render correct on discord", async () => {
    const on = Platform.Discord;
    const { text } = await changelog({ title, content, on });
    console.log(text);
  });
});
