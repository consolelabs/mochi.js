import base from "./base";
import type { Fetcher } from "../utils";
import {
  AnySchema,
  Code,
  CodeSchema,
  Leaderboard,
  LeaderboardSchema,
  Stats,
  StatsSchema,
  getParser,
  Balance,
  BalancesSchema,
  Chain,
  ChainsSchema,
  DepositInfo,
  DepositInfoSchema,
  ListOffchainTxSchema,
  OffchainTx,
  Token,
  TokensSchema,
  WithdrawRequest,
  InAppWallet,
  InAppWalletsSchema,
} from "../schemas";
import { FullOptions } from "../mochi";

export class PayModule {
  profile: {
    stats: Fetcher<string, Stats>;
    getTransactions: Fetcher<
      { profileId: string; action?: string[]; page?: number },
      Array<OffchainTx>
    >;
  };

  payRequest: {
    generateCode: Fetcher<
      {
        profileId: string;
        amount: string;
        token: string;
        note: string;
        type: "paylink" | "payme";
      },
      Code
    >;
  };

  mochiWallet: {
    withdraw: Fetcher<WithdrawRequest>;
    deposit: Fetcher<{ profileId: string; token: string }, DepositInfo>;
    getBalance: Fetcher<{ profileId: string; token?: string }, Array<Balance>>;
    // in-app-wallets
    getWallets: Fetcher<string, Array<InAppWallet>>;
  };

  transactions: {
    getAll: Fetcher<
      { page?: number; size?: number; action?: string },
      Array<OffchainTx>
    >;
  };

  tokens: {
    getSupported: Fetcher<string, Array<Token>>;
  };

  chains: {
    getSupported: Fetcher<void, Array<Chain>>;
  };

  users: {
    getLeaderboard: Fetcher<void, Leaderboard>;
  };

  constructor({ payUrl, apiKey, catcher, log }: FullOptions) {
    const parse = getParser(catcher);
    let api = base.url(payUrl, true);
    api = api.options({ log });

    if (catcher) {
      api = api.catcherFallback(catcher);
    }

    let mochiWallet = api.url("/mochi-wallet");
    let inAppWallets = api.url("/in-app-wallets");
    let transactions = api.url("/transactions");
    let payRequest = api.url("/pay-requests");
    let profile = api.url("/profile");
    if (apiKey) {
      mochiWallet = mochiWallet.auth(`Bearer ${apiKey}`);
      inAppWallets = inAppWallets.auth(`Bearer ${apiKey}`);
      transactions = transactions.auth(`Bearer ${apiKey}`);
      payRequest = payRequest.auth(`Bearer ${apiKey}`);
      profile = profile.auth(`Bearer ${apiKey}`);
    }

    this.profile = {
      stats: async function (id) {
        return profile
          .url(`/${id}/monthly-stats`)
          .resolve(parse(StatsSchema))
          .get();
      },
      getTransactions: async function ({ page = 0, ...rest }) {
        return profile
          .url("/transactions")
          .resolve(parse(ListOffchainTxSchema))
          .query({ ...rest, page })
          .get();
      },
    };

    this.payRequest = {
      generateCode: async function (payload) {
        return payRequest.url("/").resolve(parse(CodeSchema)).post(payload);
      },
    };

    this.mochiWallet = {
      withdraw: async function (payload) {
        return mochiWallet
          .url("/withdraw")
          .resolve(parse(AnySchema))
          .post(payload);
      },
      deposit: async function ({ profileId, token }) {
        return mochiWallet
          .url("/deposit")
          .resolve(parse(DepositInfoSchema))
          .post({ profileId, token });
      },
      getBalance: async function ({ profileId, token }) {
        return mochiWallet
          .url(`/${profileId}/balances/${token}`)
          .resolve(parse(BalancesSchema))
          .get();
      },
      getWallets: async function (profileId) {
        let result = await inAppWallets
          .url(`/get-by-profile/${profileId}`)
          .resolve(parse(InAppWalletsSchema))
          .post();

        if (!result.ok) return { ok: true, data: [], error: null };

        let wallets = result.data;

        // group all EVM wallets into 1
        wallets = wallets.filter((w, i: number) => {
          if (!w.chain.is_evm) return true;
          if (
            w.chain.is_evm &&
            wallets.findIndex(
              (wa) => wa.wallet_address === w.wallet_address
            ) === i
          ) {
            return true;
          }

          return false;
        });

        // change ETH wallet to EVM
        wallets = wallets.map((w) => ({
          ...w,
          chain: {
            ...w.chain,
            symbol: w.chain.symbol === "ETH" ? "EVM" : w.chain.symbol,
          },
        }));

        return {
          ok: true,
          error: null,
          data: wallets,
        };
      },
    };

    this.transactions = {
      getAll: async function ({ size = 40, page = 0, action }) {
        return transactions
          .url("/")
          .query({ page, size, action })
          .resolve(parse(ListOffchainTxSchema))
          .get();
      },
    };

    this.tokens = {
      getSupported: async function (symbol?: string) {
        return api
          .url("/tokens")
          .query(symbol ? { symbol } : {})
          .resolve(parse(TokensSchema))
          .get();
      },
    };

    this.chains = {
      getSupported: async function () {
        return api.url("/chains").resolve(parse(ChainsSchema)).get();
      },
    };

    this.users = {
      getLeaderboard: async function () {
        return api
          .url(`/leaderboard`)
          .query({ size: 10 })
          .resolve(parse(LeaderboardSchema))
          .get();
      },
    };
  }
}
