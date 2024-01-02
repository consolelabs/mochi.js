import { formatTxn } from "../../components/txns";
import { Platform } from "../../ui";
import { WithdrawTx } from "../fixture/txns";

describe("formatTxn.WithdrawTx", () => {
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
    const tx = WithdrawTx;
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
      text: "-60 ICY withdrawn to `0x053..3249`",
      external_id: "[`68b47`](https://mochi.gg/tx/68b47c5d102c)",
    });
  });

  it("should render corrected format on tele", async () => {
    // arrange
    const tx = WithdrawTx;
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
      text: "-60 ICY withdrawn to `0x053..3249`",
      external_id: "[`68b47`](https://mochi.gg/tx/68b47c5d102c)",
    });
  });

  it("should render corrected format on web", async () => {
    // arrange
    const tx = WithdrawTx;
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
      text: "-60 ICY withdrawn to `0x053..3249`",
      external_id: "[`68b47`](https://mochi.gg/tx/68b47c5d102c)",
    });
  });
});
