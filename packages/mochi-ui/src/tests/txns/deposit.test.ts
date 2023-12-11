import { Tx } from "@consolelabs/mochi-rest";
import API from "@consolelabs/mochi-rest";
import { TransactionSupportedPlatform, formatTxn } from "../../components/txns";
import { Platform } from "../../ui";
import { DepositTx } from "../fixture/txns";

type Input = {
  tx: Tx;
  platform: TransactionSupportedPlatform;
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

// test cases
test.each<[Input, Output]>([
  [
    {
      tx: DepositTx,
      platform: Platform.Discord,
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
      platform: Platform.Telegram,
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
])("components.formatTxn.deposit", (input, expected) => {
  const { tx, platform, global, groupDate, api } = input;
  const res = formatTxn(tx, platform, global, groupDate, api);
  expect(res).toBe(expected);
});
