import { formatTxn } from "../../components/txns";
import { Platform } from "../../ui";
import { DepositTx } from "../fixture/txns";

describe("formatTxn.DepositTx", () => {
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
    const tx = DepositTx;
    const platform = Platform.Discord;
    const global = true;
    const groupDate = true;

    // act
    const actual = await formatTxn(tx, platform, global, groupDate);

    // assert
    expect(actual).toEqual({
      amount: "",
      emoji: "",
      time: "8d ago",
      text: "+1 FTM deposited from `0x70c..77af9`",
      external_id: "[`a9950`](https://mochi.gg/tx/a9950d3cebc1)",
    });
  });

  it("should render corrected format on tele", async () => {
    // arrange
    const tx = DepositTx;
    const platform = Platform.Telegram;
    const global = true;
    const groupDate = true;

    // act
    const actual = await formatTxn(tx, platform, global, groupDate);

    // assert
    expect(actual).toEqual({
      amount: "",
      emoji: "",
      time: "8d ago",
      text: "+1 FTM deposited from `0x70c..77af9`",
      external_id: "[`a9950`](https://mochi.gg/tx/a9950d3cebc1)",
    });
  });

  it("should render corrected format on web", async () => {
    // arrange
    const tx = DepositTx;
    const platform = Platform.Web;
    const global = true;
    const groupDate = true;

    // act
    const actual = await formatTxn(tx, platform, global, groupDate);

    // assert
    expect(actual).toEqual({
      amount: "",
      emoji: "",
      time: "8d ago",
      text: "+1 FTM deposited from `0x70c..77af9`",
      external_id: "[`a9950`](https://mochi.gg/tx/a9950d3cebc1)",
    });
  });
});
