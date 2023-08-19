import { API_PAY_SERVER_URL, API_PAY_SERVER_URL_V2 } from "env";
import base from "./base";

const api = base.url(API_PAY_SERVER_URL, true);
const apiV2 = base.url(API_PAY_SERVER_URL_V2, true);
const mochiWallet = api.url("/mochi-wallet");
const transactions = api.url("/transactions");
const payRequest = api.url("/pay-requests");
const profile = api.url("/profile");

export default {
  profile: {
    stats: async (id: string) =>
      profile
        .url(`/${id}/monthly-stats`)
        .get()
        .json((r) => r.data),
    getOffchainTxns: (profile_id: string, action = "", page = 0) => {
      return profile
        .url(`/${profile_id}/transactions`)
        .query({
          action:
            action ||
            ["deposit", "withdraw", "transfer", "airdrop", "paylink"].join("|"),
          status: "success",
          page,
        })
        .get()
        .json<any>((r) => ({
          ...r,
          pagination: {
            ...r.pagination,
            totalPage: Math.ceil(r.pagination.total / r.pagination.size),
          },
        }));
    },
  },
  payRequest: {
    generatePaymentCode: async (payload: any) =>
      payRequest
        .url("/")
        .post(payload)
        .json((r) => r.data),
  },
  mochiWallet: {
    withdraw: async (payload: any) =>
      mochiWallet.url("/withdraw").post(payload).json(),
    deposit: async (profileId: string, token: string) =>
      mochiWallet
        .url("/deposit")
        .post({ profileId, token, platform: "telegram" })
        .json<any>((r) => r.data),
    getOffchainBalances: (profileId: string, token = "") => {
      return mochiWallet
        .url(`/${profileId}/balances/${token}`)
        .get()
        .json<any>((r) => r.data);
    },
  },
  transactions: {
    getAllTransactions: (page: number, size: number, action: string) => {
      return transactions
        .url("/")
        .query({ page, size, action })
        .get()
        .json<any>((r) => r.data);
    },
  },
  getTokens: async (symbol?: string) =>
    api
      .url("/tokens")
      .query(symbol ? { symbol } : {})
      .get()
      .json<any>((r) => r.data),
  getUserWallets: async (profileId: string) => {
    let wallets = await api
      .url(`/in-app-wallets/get-by-profile/${profileId}`)
      .post()
      .internalError(() => [])
      .json<any>((r) => r.data || []);

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
  getChains: async () => api.url("/chains").get().json<any>(),
  getLeaderboard: async (timeRange: string) =>
    api
      .url(`/leaderboard`)
      .query({ interval: timeRange, size: 10 })
      .get()
      .json<any>((r) => r.data),
  withdrawV2: async (payload: any) =>
    apiV2.url("/withdraw").post(payload).json(),
};
