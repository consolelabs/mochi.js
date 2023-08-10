import { API_PAY_SERVER_URL } from "../constant";
import base from "./base";
import type { Fetcher } from "../utils";

const api = base.url(API_PAY_SERVER_URL, true);

let mochiWallet = api.url("/mochi-wallet");
let inAppWallets = api.url("/in-app-wallets");
let transactions = api.url("/transactions");
let payRequest = api.url("/pay-requests");
let profile = api.url("/profile");

export class PayModule {
  profile: {
    stats: Fetcher<string>;
  };

  payRequest: {
    generateCode: Fetcher;
  };

  mochiWallet: {
    withdraw: Fetcher;
    deposit: Fetcher<{ profileId: string; token: string }>;
    getBalance: Fetcher<{ profileId: string; token?: string }>;
    getTransactions: Fetcher<string>;
    // in-app-wallets
    getWallets: Fetcher<string>;
  };

  transactions: {
    getAll: Fetcher<{ page?: number; size?: number; action?: string }>;
  };

  tokens: {
    getSupported: Fetcher;
  };

  chains: {
    getSupported: Fetcher;
  };

  users: {
    getLeaderboard: Fetcher<string>;
  };

  constructor(apiKey?: string) {
    mochiWallet = mochiWallet.auth(`Bearer ${apiKey}`);
    inAppWallets = inAppWallets.auth(`Bearer ${apiKey}`);
    transactions = transactions.auth(`Bearer ${apiKey}`);
    payRequest = payRequest.auth(`Bearer ${apiKey}`);
    profile = profile.auth(`Bearer ${apiKey}`);

    this.profile = {
      stats: async function (id) {
        return profile.url(`/${id}/monthly-stats`).get();
      },
    };

    this.payRequest = {
      generateCode: async function (payload) {
        return payRequest.url("/").post(payload);
      },
    };

    this.mochiWallet = {
      withdraw: async function (payload) {
        return mochiWallet.url("/withdraw").post(payload);
      },
      deposit: async function ({ profileId, token }) {
        return mochiWallet.url("/deposit").post({ profileId, token });
      },
      getBalance: async function ({ profileId, token }) {
        return mochiWallet.url(`/${profileId}/balances/${token}`).get();
      },
      getTransactions: async function (profileId) {
        return mochiWallet.url("/transactions").query({ profileId }).get();
      },
      getWallets: async function (profileId) {
        let wallets = await api
          .url(`/in-app-wallets/get-by-profile/${profileId}`)
          .post();

        // group all EVM wallets into 1
        wallets = wallets.filter((w: any, i: number) => {
          if (!w.chain.is_evm) return true;
          if (
            w.chain.is_evm &&
            wallets.findIndex(
              (wa: any) => wa.wallet_address === w.wallet_address
            ) === i
          ) {
            return true;
          }

          return false;
        });

        // change ETH wallet to EVM
        wallets = wallets.map((w: any) => ({
          ...w,
          chain: {
            ...w.chain,
            symbol: w.chain.symbol === "ETH" ? "EVM" : w.chain.symbol,
          },
        }));

        return wallets;
      },
    };

    this.transactions = {
      getAll: async function ({ size = 40, page = 0, action }) {
        return transactions.url("/").query({ page, size, action }).get();
      },
    };

    this.tokens = {
      getSupported: async function () {
        return api.url("/tokens").get();
      },
    };

    this.chains = {
      getSupported: async function () {
        return api.url("/chains").get();
      },
    };

    this.users = {
      getLeaderboard: async function (timeRange) {
        return api
          .url(`/leaderboard`)
          .query({ interval: timeRange, size: 10 })
          .get();
      },
    };
  }
}
