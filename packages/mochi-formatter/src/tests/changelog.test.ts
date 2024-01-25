import changelog from "../components/changelog";
import { Platform } from "../ui";

describe("changelog", () => {
  const title = "Changelog Jan 5 2024";
  const content =
    "### ✨ What’s News\n\n**Neko Wallet now support Facebook**\n\nRight now, everyone can login to their facebook account, and use tip widget as an alternative way to interact with their balances, including searching user in facebook, etc etc\n\n![](https://i.imgur.com/hvn6kkm.png)\n\n**New transactions table component**\n\nLast week we also upgrade the visual for our transactions table, new UI includes more data, right-in-a-row CTA and more. check it out at [Mochi Explore](https://beta.mochi.gg)\n\n![](https://i.imgur.com/kG8lSbt.png)\n\n**New changelog preview in Discord**\n\nTo be frank, our current component does not good so good, so we replace it with new one.\n\n[//]: new_line\n\n**Design systems**\n\nApply the transition animation for Dropdown, Modal, Sidebar,… No annoying bolder on the button anymore.\n\n[//]: break\n\n### 💎 Improvements\n\n- **Tip Widget**: To optimize the display space and also ensure the experience, all the small number like 0.00….01 will be used the subscript to render with the format:\n- **Settings**: The Settings page improved its logic on default message and transaction limit. Moreover, it applied the standard page scale which improve the interface on different screen size and saving alert for unsaved changes.\n- **Receipt Page**: Receipt page also has a new looks, to support our new ‘join tip’ feature coming, receipt page now showing full senders or recipients including all sub-transactions\n- **[Discord] Ticker**: Currently, ticker always makes an assumption to show just one result, based on various condition, like is that native token, how about the marketcap, etc. But sometimes, we do have a few cases when more than 1 result is expected from users. So we add a button to let users choose what is best for them\n- **Overview**: The Overview page has improved the scroll bar of every part which bring a better experience.\n- **Explore Transactions**: To give user the quick stats of the app performance, we render the stat of success transactions by Mochi right on the top of the page. Furthermore, our team has enhanced the page speed to show all transactions.\n\n### 🐛 Fixes\n\n- **Settings:** Fix the edit default message and transaction limit\n- **Settings:** Remove some invalid option in the settings options\n- **Settings:** The logic of adding new default message and limit\n- **Tip Widget**: insufficient balance when users have enough balance\n- **Tip Widget**: sometimes tip widget show incorrect token after select from profile balance.\n- **Tx Receipt**: missing image in sharing url.\n- **Tx Receipt:** microcopy does not match with tx data (Tip instead of Transfer)\n- **Tx Receipt**: copyright 2023 → 2024\n- **Tx Receipt**: remove subscript number & now show full usd total amount\n- **Tx Receipt**: showing UTC time instead of local time\n- **Tx Receipt**: show info if send from vault or application\n- **Transaction table:** fix pagination issues\n- **Transaction table:** filter\n- **Transaction table:** render full 5 transactions in the table preview on Overview page\n- **[Discord] recent tx**: show info if send from vault or application\n- **[Discord] profile**: show binance data";
  it("should render correct on discord", async () => {
    const on = Platform.Discord;
    const { text } = await changelog({ title, content, on });
    console.log(text);
  });
});
