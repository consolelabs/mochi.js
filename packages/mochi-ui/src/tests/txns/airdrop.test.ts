import { formatTxn } from "../../components/txns";
import { Platform } from "../../ui";
import { AirdropTx } from "../fixture/txns";

describe("formatTxn.AirdropTx", () => {
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
    const tx = AirdropTx;
    const platform = Platform.Discord;
    const global = true;
    const groupDate = true;

    // act
    const actual = await formatTxn(tx, platform, global, groupDate);

    // assert
    expect(actual).toEqual({
      amount: "",
      emoji: "",
      time: "35d ago",
      text: "-10 MINU airdropped but no one joined",
      external_id: "[`52425`](https://mochi.gg/tx/5242596071ea)",
    });
  });

  it("should render corrected format on tele", async () => {
    // arrange
    const tx = AirdropTx;
    const platform = Platform.Telegram;
    const global = true;
    const groupDate = true;

    // act
    const actual = await formatTxn(tx, platform, global, groupDate);

    // assert
    expect(actual).toEqual({
      amount: "",
      emoji: "",
      time: "35d ago",
      text: "-10 MINU airdropped but no one joined",
      external_id: "[`52425`](https://mochi.gg/tx/5242596071ea)",
    });
  });

  it("should render corrected format on web", async () => {
    // arrange
    const tx = AirdropTx;
    const platform = Platform.Web;
    const global = true;
    const groupDate = true;

    // act
    const actual = await formatTxn(tx, platform, global, groupDate);

    // assert
    expect(actual).toEqual({
      amount: "",
      emoji: "",
      time: "35d ago",
      text: "-10 MINU airdropped but no one joined",
      external_id: "[`52425`](https://mochi.gg/tx/5242596071ea)",
    });
  });
});
