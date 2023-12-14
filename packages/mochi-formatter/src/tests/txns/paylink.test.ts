import { formatTxn } from "../../components/txns";
import { Platform } from "../../ui";
import { PaylinkTx } from "../fixture/txns";

describe("formatTxn.PaylinkTx", () => {
  beforeAll(() => {
    jest
      .useFakeTimers({ advanceTimers: true })
      .setSystemTime(new Date("2023-12-13"));
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it("should render corrected format on discord", async () => {
    // arrange
    const tx = PaylinkTx;
    const platform = Platform.Discord;
    const global = true;
    const groupDate = true;

    // act
    const actual = await formatTxn(tx, platform, global, groupDate);

    // assert
    expect(actual).toEqual({
      amount: "",
      emoji: "",
      time: "5d ago",
      text: "-1 SPELL [Pay Link](https://mochi.gg/pay/0ddac19357ecbab724a9)",
      external_id: "[`45ce7`](https://mochi.gg/tx/45ce7563380d)",
    });
  });

  it("should render corrected format on tele", async () => {
    // arrange
    const tx = PaylinkTx;
    const platform = Platform.Telegram;
    const global = true;
    const groupDate = true;

    // act
    const actual = await formatTxn(tx, platform, global, groupDate);

    // assert
    expect(actual).toEqual({
      amount: "",
      emoji: "",
      time: "5d ago",
      text: "-1 SPELL [Pay Link](https://mochi.gg/pay/0ddac19357ecbab724a9)",
      external_id: "[`45ce7`](https://mochi.gg/tx/45ce7563380d)",
    });
  });

  it("should render corrected format on web", async () => {
    // arrange
    const tx = PaylinkTx;
    const platform = Platform.Web;
    const global = true;
    const groupDate = true;

    // act
    const actual = await formatTxn(tx, platform, global, groupDate);

    // assert
    expect(actual).toEqual({
      amount: "",
      emoji: "",
      time: "5d ago",
      text: "-1 SPELL [Pay Link](https://mochi.gg/pay/0ddac19357ecbab724a9)",
      external_id: "[`45ce7`](https://mochi.gg/tx/45ce7563380d)",
    });
  });
});
