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
  SimplifiedTokensSchema,
  SimplifiedToken,
} from "../schemas";
import { FullOptions } from "../mochi";
import endpoints from "../endpoints";

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

  getWhilteListToken: Fetcher<{ symbol?: string }, Array<SimplifiedToken>>;

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

    if (apiKey) {
      api = api.auth(`Bearer ${apiKey}`);
    }

    this.profile = {
      stats: async function (id) {
        return api
          .url(endpoints.MOCHI_PAY.MONTHLY_STATS(id))
          .resolve(parse(StatsSchema))
          .get();
      },
      getTransactions: async function ({ page = 0, ...rest }) {
        return api
          .url(endpoints.MOCHI_PAY.PROFILE_TRANSACTIONS)
          .resolve(parse(ListOffchainTxSchema))
          .query({ ...rest, page })
          .get();
      },
    };

    this.payRequest = {
      generateCode: async function (payload) {
        return api
          .url(endpoints.MOCHI_PAY.PAY_REQUESTS)
          .resolve(parse(CodeSchema))
          .post(payload);
      },
    };

    this.mochiWallet = {
      withdraw: async function (payload) {
        return api
          .url(endpoints.MOCHI_PAY.WITHDRAW)
          .resolve(parse(AnySchema))
          .post(payload);
      },
      deposit: async function ({ profileId, token }) {
        return api
          .url(endpoints.MOCHI_PAY.DEPOSIT)
          .resolve(parse(DepositInfoSchema))
          .post({ profileId, token });
      },
      getBalance: async function ({ profileId, token }) {
        return api
          .url(endpoints.MOCHI_PAY.GET_BALANCE(profileId, token))
          .resolve(parse(BalancesSchema))
          .get();
      },
      getWallets: async function (profileId) {
        let result = await api
          .url(endpoints.MOCHI_PAY.GET_WALLETS(profileId))
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
        return api
          .url(endpoints.MOCHI_PAY.GLOBAL_TRANSACTIONS)
          .query({ page, size, action })
          .resolve(parse(ListOffchainTxSchema))
          .get();
      },
    };

    this.tokens = {
      getSupported: async function (symbol?: string) {
        return api
          .url(endpoints.MOCHI_PAY.SUPPORTED_TOKENS)
          .query(symbol ? { symbol } : {})
          .resolve(parse(TokensSchema))
          .get();
      },
    };

    this.getWhilteListToken = async function (query: { symbol?: string }) {
      return api
        .url(endpoints.MOCHI_PAY.CONSOLE_TOKENS)
        .query(query)
        .resolve(parse(SimplifiedTokensSchema))
        .get();
    };

    this.chains = {
      getSupported: async function () {
        return api
          .url(endpoints.MOCHI_PAY.SUPPORTED_CHAINS)
          .resolve(parse(ChainsSchema))
          .get();
      },
    };

    this.users = {
      getLeaderboard: async function () {
        return api
          .url(endpoints.MOCHI_PAY.LEADERBOARD)
          .query({ size: 10 })
          .resolve(parse(LeaderboardSchema))
          .get();
      },
    };
  }
}
