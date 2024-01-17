import { formatTxn } from "../../components/txns";
import { Platform, UI } from "../../ui";
import {
  TransferOutTx,
  TransferInTx,
  SiblingTransferTx,
} from "../fixture/txns";
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
    UI.formatProfile = jest.fn((on, A, B) => {
      return Promise.resolve([
        {
          value: `${A}`,
          id: "id",
          url: "url",
          plain: "plain",
          platform: Platform.Discord,
        },
        {
          value: `${B}`,
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

  it("should render corrected format on discord globally", async () => {
    // arrange
    const tx = TransferOutTx;
    const platform = Platform.Discord;
    const global = true;
    const groupDate = true;

    // act
    const actual = await formatTxn(tx, platform, global, groupDate, api);

    // assert
    expect(actual).toEqual({
      amount: "149.6 BUTT",
      emoji: "",
      time: "5d ago",
      text: "149.6 BUTT 48438 to 40409",
      external_id: "[`27a82`](https://mochi.gg/tx/27a823e486fa)",
    });
  });

  it("should render corrected format on tele globally", async () => {
    // arrange
    const tx = TransferOutTx;
    const platform = Platform.Telegram;
    const global = true;
    const groupDate = true;

    // act
    const actual = await formatTxn(tx, platform, global, groupDate, api);

    // assert
    expect(actual).toEqual({
      amount: "149.6 BUTT",
      emoji: "",
      time: "5d ago",
      text: "149.6 BUTT 48438 to 40409",
      external_id: "[`27a82`](https://mochi.gg/tx/27a823e486fa)",
    });
  });

  it("should render corrected one-side out transfer on discord", async () => {
    // arrange
    const tx = TransferOutTx;
    const platform = Platform.Discord;
    const global = false;
    const groupDate = false;
    const profileId = "48438";
    // act
    const actual = await formatTxn(
      tx,
      platform,
      global,
      groupDate,
      api,
      profileId
    );

    // assert
    expect(actual).toEqual({
      amount: "-149.6 BUTT",
      emoji: "",
      time: "5d ago",
      text: "-149.6 BUTT to 40409",
      external_id: "[`27a82`](https://mochi.gg/tx/27a823e486fa)",
    });
  });

  it("should render corrected one-side in transfer on discord", async () => {
    // arrange
    const tx = TransferInTx;
    const platform = Platform.Discord;
    const global = false;
    const groupDate = false;
    const profileId = "48036";
    // act
    const actual = await formatTxn(
      tx,
      platform,
      global,
      groupDate,
      api,
      profileId
    );

    // assert
    expect(actual).toEqual({
      amount: "-3 ICY",
      emoji: "",
      time: "5d ago",
      text: "-3 ICY to 55834",
      external_id: "[`27a82`](https://mochi.gg/tx/27a823e486fa)",
    });
  });

  it("should render corrected siblings txs", async () => {
    // arrange
    const tx = SiblingTransferTx;
    const platform = Platform.Discord;
    const global = false;
    const groupDate = false;
    const profileId = "48036";
    // act
    const actual = await formatTxn(
      tx,
      platform,
      global,
      groupDate,
      api,
      profileId
    );

    // assert
    expect(actual).toEqual({
      amount: "-1 DOGE",
      emoji: "",
      time: "in 29d",
      text: "-1 DOGE to 55834 & 1640552476807532544",
      external_id: "[`60039`](https://mochi.gg/tx/60039b1eac36)",
    });
  });
});
