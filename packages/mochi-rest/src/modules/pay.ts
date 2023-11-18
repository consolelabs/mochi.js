import base from "./base";
import type { Fetcher } from "../utils";
import {
  Code,
  CodeSchema,
  Leaderboard,
  LeaderboardSchema,
  Stats,
  StatsSchema,
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
  PayLink,
  Pagination,
  PayMe,
  ListPayLinkSchema,
  ListPayMeSchema,
} from "../schemas";
import { AnySchema, getParser } from "../schemas/utils";
import { Options } from "../mochi";
import endpoints from "../endpoints";
import { Module } from "./module";

export class PayModule extends Module {
  profile: {
    stats: Fetcher<string, Stats>;
    getTransactions: Fetcher<
      { profileId: string; action?: string[]; page?: number },
      Array<OffchainTx>
    >;
    getPaylinks: Fetcher<string, Array<PayLink>, Pagination>;
    getPaymes: Fetcher<string, Array<PayMe>, Pagination>;
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
    getBalance: Fetcher<
      { profileId: string; token?: string },
      { usd_total: number; balances: Array<Balance & { usd_amount: number }> }
    >;
    // in-app-wallets
    getWallets: Fetcher<string, Array<InAppWallet>>;
  };

  transactions: {
    getAll: Fetcher<
      { page?: number; size?: number; action?: string[] },
      Array<OffchainTx>
    >;
  };

  tokens: {
    getSupported: Fetcher<string, Array<Token>>;
  };

  getWhiteListToken: Fetcher<string | void, Array<SimplifiedToken>>;

  chains: {
    getSupported: Fetcher<void, Array<Chain>>;
  };

  users: {
    getLeaderboard: Fetcher<
      void | "alltime" | "weekly" | "monthly",
      Leaderboard
    >;
  };

  constructor({ addons, payUrl, catcher, log }: Options) {
    super(base.url(payUrl, true).options({ log }));
    const parse = getParser(catcher);

    if (addons?.length) {
      for (const addon of addons) {
        this.api = this.api.addon(addon);
      }
    }

    if (catcher) {
      this.api = this.api.catcherFallback(catcher);
    }

    this.profile = {
      stats: async (id) => {
        return this.api
          .url(endpoints.MOCHI_PAY.MONTHLY_STATS(id))
          .resolve(parse(StatsSchema))
          .get();
      },
      getTransactions: async ({ page = 0, ...rest }) => {
        return this.api
          .url(endpoints.MOCHI_PAY.PROFILE_TRANSACTIONS)
          .resolve(parse(ListOffchainTxSchema))
          .query({ ...rest, page })
          .get();
      },
      getPaylinks: async (profileId: string) => {
        return this.api
          .url(endpoints.MOCHI_PAY.GET_PAYLINKS(profileId))
          .resolve(parse(ListPayLinkSchema)<Pagination>)
          .get();
      },
      getPaymes: async (profileId: string) => {
        return this.api
          .url(endpoints.MOCHI_PAY.GET_PAYMES(profileId))
          .resolve(parse(ListPayMeSchema)<Pagination>)
          .get();
      },
    };

    this.payRequest = {
      generateCode: async (payload) => {
        return this.api
          .url(endpoints.MOCHI_PAY.PAY_REQUESTS)
          .resolve(parse(CodeSchema))
          .post(payload);
      },
    };

    this.mochiWallet = {
      withdraw: async (payload) => {
        return this.api
          .url(endpoints.MOCHI_PAY.WITHDRAW)
          .resolve(parse(AnySchema))
          .post(payload);
      },
      deposit: async ({ profileId, token }) => {
        return this.api
          .url(endpoints.MOCHI_PAY.DEPOSIT)
          .resolve(parse(DepositInfoSchema))
          .post({ profileId, token });
      },
      getBalance: async ({ profileId, token }) => {
        const result = await this.api
          .url(endpoints.MOCHI_PAY.GET_BALANCE(profileId, token))
          .resolve(parse(BalancesSchema))
          .get();
        if (!result.ok || result.error)
          return {
            ok: true,
            data: { usd_total: 0, balances: [] },
            error: null,
          };

        let usd_total = 0;

        const balances = result.data
          .map<Balance & { usd_amount: number }>((d) => {
            const tokenAmount = parseInt(d.amount, 10) / 10 ** d.token.decimal;
            const usd_amount = tokenAmount * d.token.price;

            usd_total += usd_amount;

            return {
              ...d,
              usd_amount,
            };
          })
          .sort((a, b) => {
            return b.usd_amount - a.usd_amount;
          });

        return {
          ok: true,
          error: null,
          data: { usd_total, balances },
        };
      },
      getWallets: async (profileId) => {
        const result = await this.api
          .url(endpoints.MOCHI_PAY.GET_WALLETS(profileId))
          .resolve(parse(InAppWalletsSchema))
          .post();

        if (!result.ok) return { ok: true, data: [], error: null };

        let wallets = result.data;

        // group all EVM wallets into 1
        wallets = wallets.filter((w, i: number) => {
          if (w.chain.type !== "evm") return true;
          if (
            w.chain.type === "evm" &&
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
      getAll: async ({ size = 40, page = 0, action }) => {
        return this.api
          .url(endpoints.MOCHI_PAY.GLOBAL_TRANSACTIONS)
          .query({ page, size, action: action?.join("|") ?? "transfer" })
          .resolve(parse(ListOffchainTxSchema))
          .get();
      },
    };

    this.tokens = {
      getSupported: async (symbol?: string) => {
        return this.api
          .url(endpoints.MOCHI_PAY.SUPPORTED_TOKENS)
          .query(symbol ? { symbol } : {})
          .resolve(parse(TokensSchema))
          .get();
      },
    };

    this.getWhiteListToken = async (symbol?: string) => {
      return this.api
        .url(endpoints.MOCHI_PAY.CONSOLE_TOKENS)
        .query(symbol ? { symbol } : {})
        .resolve(parse(SimplifiedTokensSchema))
        .get();
    };

    this.chains = {
      getSupported: async () => {
        return this.api
          .url(endpoints.MOCHI_PAY.SUPPORTED_CHAINS)
          .resolve(parse(ChainsSchema))
          .get();
      },
    };

    this.users = {
      getLeaderboard: async (interval = "alltime") => {
        return this.api
          .url(endpoints.MOCHI_PAY.LEADERBOARD)
          .query({ interval, size: 10 })
          .resolve(parse(LeaderboardSchema))
          .get();
      },
    };
  }
}
