import { Tx } from "@consolelabs/mochi-rest";
import API from "@consolelabs/mochi-rest";
import { formatTxn } from "../components/txns";
import { Platform } from "../ui";
import {
  AirdropTx,
  DepositTx,
  PaylinkTx,
  PaymeTx,
  TransferOutTx,
  WithdrawTx,
} from "./fixture/txns";

type Input = {
  tx: Tx;
  platform: Platform.Web | Platform.Telegram | Platform.Discord;
  global: boolean;
  groupDate: boolean;
  api?: API;
};

type Output = {
  time: string;
  emoji: string;
  amount: string;
  text: string;
  external_id: string;
};

test.each<[Input, Output]>([
  [
    {
      tx: TransferOutTx,
      platform: Platform.Web,
      global: true,
      groupDate: true,
    },
    {
      time: "",
      emoji: "",
      amount: "",
      text: "",
      external_id: "",
    },
  ],
  [
    {
      tx: DepositTx,
      platform: Platform.Web,
      global: true,
      groupDate: true,
    },
    {
      time: "",
      emoji: "",
      amount: "",
      text: "",
      external_id: "",
    },
  ],
  [
    {
      tx: WithdrawTx,
      platform: Platform.Web,
      global: true,
      groupDate: true,
    },
    {
      time: "",
      emoji: "",
      amount: "",
      text: "",
      external_id: "",
    },
  ],
  [
    {
      tx: AirdropTx,
      platform: Platform.Web,
      global: true,
      groupDate: true,
    },
    {
      time: "",
      emoji: "",
      amount: "",
      text: "",
      external_id: "",
    },
  ],
  [
    {
      tx: PaymeTx,
      platform: Platform.Web,
      global: true,
      groupDate: true,
    },
    {
      time: "",
      emoji: "",
      amount: "",
      text: "",
      external_id: "",
    },
  ],
  [
    {
      tx: PaylinkTx,
      platform: Platform.Web,
      global: true,
      groupDate: true,
    },
    {
      time: "",
      emoji: "",
      amount: "",
      text: "",
      external_id: "",
    },
  ],
])("omponents.formatTxn", (input, expected) => {
  const { tx, platform, global, groupDate, api } = input;
  const res = formatTxn(tx, platform, global, groupDate, api);
  expect(res).toBe(expected);
});

// describe("Component Transactions", () => {
//   it("Should return right format for transfer out transaction", () => {
//     const input = {
//       tx: TransferOutTx,
//       platform: Platform.Web,
//       global: true,
//       groupDate: true,
//     };
//     const expectedFormat = {
//       time: "",
//       emoji: "",
//       amount: "",
//       text: "",
//       external_id: "",
//     };
//     const format = formatTxn(
//       input.tx,
//       Platform.Telegram,
//       input.global,
//       input.groupDate
//     );

//     expect(format).toEqual(expectedFormat);
//   });
// });
