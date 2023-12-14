import { formatTxn } from "../../components/txns";
import { Platform, UI } from "../../ui";
import { TransferTx } from "../fixture/txns";
import API from "@consolelabs/mochi-rest";

describe("formatTxn.TransferTx", () => {
  const api = new API({
    baseUrl: "https://mochi.com",
    profileUrl: "https://mochi-profile.com",
    payUrl: "https://mochi-pay.com",
  });
  beforeAll(() => {
    jest
      .useFakeTimers({ advanceTimers: true })
      .setSystemTime(new Date("2023-12-13"));

    api.base.metadata.getEmojis = jest.fn((codes) => {
      return Promise.resolve({
        ok: true,
        error: null,
        data: [
          {
            code: "",
            emoji: "",
            emoji_url: "",
          },
        ],
        pagination: {
          page: 0,
          size: 1,
          total: 1,
        },
        metadata: {
          page: 0,
          size: 1,
          total: 1,
        },
      });
    });
    UI.api = api;
    UI.profileFormat = jest.fn((on, A, B) => {
      return Promise.resolve([
        {
          value: "A",
          id: "id",
          url: "url",
          plain: "plain",
          platform: Platform.Discord,
        },
        {
          value: "B",
          id: "id",
          url: "url",
          plain: "plain",
          platform: Platform.Discord,
        },
      ]);
    });
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it("should render corrected format on discord", async () => {
    // arrange
    const tx = TransferTx;
    const platform = Platform.Discord;
    const global = true;
    const groupDate = true;

    // act
    const actual = await formatTxn(tx, platform, global, groupDate, api);

    // assert
    expect(actual).toEqual({
      amount: "-149.6 BUTT",
      emoji: "",
      time: "5d ago",
      text: "A to B",
      external_id: "[`27a82`](https://mochi.gg/tx/27a823e486fa)",
    });
  });

  it("should render corrected format on tele", async () => {
    // arrange
    const tx = TransferTx;
    const platform = Platform.Telegram;
    const global = true;
    const groupDate = true;

    // act
    const actual = await formatTxn(tx, platform, global, groupDate, api);

    // assert
    expect(actual).toEqual({
      amount: "-149.6 BUTT",
      emoji: "",
      time: "5d ago",
      text: "A to B",
      external_id: "[`27a82`](https://mochi.gg/tx/27a823e486fa)",
    });
  });

  it("should render corrected format on web", async () => {
    // arrange
    const tx = TransferTx;
    const platform = Platform.Web;
    const global = true;
    const groupDate = true;

    // act
    const actual = await formatTxn(tx, platform, global, groupDate, api);

    // assert
    expect(actual).toEqual({
      amount: "-149.6 BUTT",
      emoji: "",
      time: "5d ago",
      text: "A to B",
      external_id: "[`27a82`](https://mochi.gg/tx/27a823e486fa)",
    });
  });
});
