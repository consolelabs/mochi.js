import wretch from "wretch";
import QueryStringAddon from "wretch/addons/queryString";
import {
  attachRequestId,
  convertBodyToSnakeCase,
  convertQueryToSnakeCase,
  log,
} from "./middlewares";
import type { Fetcher } from "../utils";
import {
  AnySchema,
  Command,
  Copy,
  CopySchema,
  ListCommandSchema,
  Vault,
  VaultSchema,
  getParser,
  Coin,
  CoinChartData,
  CoinChartDataSchema,
  CoinSchema,
  ListQueryCoinSchema,
  QueryCoin,
  TopGainerLoser,
  TopGainerLoserSchema,
  TransferRequest,
  TransferResult,
  TransferResultSchema,
  Gas,
  ListGasSchema,
  SimplifiedToken,
  SimplifiedTokensSchema,
  TrackWalletList,
  TrackWalletListSchema,
  WatchlistTokenData,
  WatchlistTokenDataListSchema,
  QueryCoinResponse,
  QueryCoinResponseSchema,
  OnchainWalletBalance,
  OnchainWalletBalanceSchema,
  OnchainWalletTxn,
  OnchainWalletTxnListSchema,
  UserTrackingWallet,
  UserTrackingWalletSchema,
  Pagination,
  MonikersSchema,
  Moniker,
  Changelog,
  ListChangelogSchema,
  SwapRoute,
  SwapRouteSchema,
  CompareCoin,
  CompareCoinSchema,
  Emoji,
  EmojiListSchema,
  Theme,
  ListThemeSchema,
} from "../schemas";
import { Options } from "../mochi";
import endpoints from "../endpoints";
import { Module } from "./module";

const base = wretch()
  .content("application/json")
  .middlewares([
    attachRequestId,
    convertQueryToSnakeCase,
    convertBodyToSnakeCase,
    log,
  ])
  .addon(QueryStringAddon);

export default base;

export class BaseModule extends Module {
  swap: {
    getRoute: Fetcher<
      { amount: string; from: string; to: string; profileId: string },
      SwapRoute
    >;
  };

  vault: {
    getById: Fetcher<number, Vault>;
  };

  metadata: {
    getCopy: Fetcher<string | void, Copy>;
    getCommands: Fetcher<void, Array<Command>>;
    getChangelogs: Fetcher<void, Array<Changelog>>;
    getEmojis: Fetcher<{ codes: string[] } | void, Array<Emoji>, Pagination>;
    getThemes: Fetcher<void, Array<Theme>>;
  };

  tip: {
    transferV2: Fetcher<TransferRequest, TransferResult>;
  };

  defi: {
    getGasTrackers: Fetcher<void, Array<Gas>>;
    compareCoins: Fetcher<
      { base: string; target: string; interval: number },
      CompareCoin
    >;
    searchCoin: Fetcher<{ query: string; chain?: string }, Array<QueryCoin>>;
    getCoin: Fetcher<
      {
        id: string;
        isDominanceChart?: boolean;
        isWithCoingeckoInfo?: boolean;
        chains?: string;
      },
      Coin
    >;
    getHistoricalMarketData: Fetcher<
      {
        coinId: string;
        currency: string;
        days: 1 | 7 | 30 | 60 | 90 | 365 | 730 | 1095;
        isDominanceChart: boolean;
      },
      CoinChartData
    >;
    getSupportTokens: Fetcher<
      { page: number; size: number },
      Array<SimplifiedToken>,
      Pagination
    >;
    getTopGainerLoser: Fetcher<string, TopGainerLoser>;
  };

  users: {
    getListTrackingWallets: Fetcher<string, TrackWalletList>;
    untrackWallet: Fetcher<{
      profileId: string;
      address: string;
      alias: string;
    }>;
    trackWallet: Fetcher<{
      profileId: string;
      address: string;
      alias: string;
      chainType: string;
      type?: "follow" | "track" | "copy";
    }>;
    getUserWatchlist: Fetcher<
      {
        profileId: string;
        page?: number;
        size?: number;
      },
      Array<WatchlistTokenData>,
      Pagination
    >;
    trackToken: Fetcher<
      {
        profileId: string;
        symbol: string;
        coinGeckoId?: string;
        isFiat: boolean;
      },
      QueryCoinResponse
    >;
    untrackToken: Fetcher<{
      profileId: string;
      symbol: string;
    }>;
    cex: {
      binance: {
        futurePositions: Fetcher<string>;
      };
    };
    getWalletAssets: Fetcher<
      {
        profileId: string;
        address: string;
        chainType: string;
      },
      OnchainWalletBalance
    >;
    getWalletTransactions: Fetcher<
      {
        profileId: string;
        address: string;
        chainType: string;
      },
      Array<OnchainWalletTxn>
    >;
    getDetailTrackingWallet: Fetcher<
      { profileId: string; query: string },
      UserTrackingWallet
    >;
  };

  community: {
    sendFeedback: Fetcher<{
      profileId: string;
      command: string;
      feedback: string;
    }>;
    listFeedback: Fetcher<{
      profileId?: string;
      page?: number;
      size?: number;
    }>;
  };

  configDefi: {
    getDefaultMonikers: Fetcher<void, Array<Moniker>>;
  };

  token(t: string) {
    if (this.api) {
      this.api = this.api.auth(`Bearer ${t}`);
    }
  }

  constructor({ addons, baseUrl, catcher, log }: Options) {
    super(base.url(baseUrl, true).options({ log }));

    const parse = getParser(catcher);

    if (addons?.length) {
      for (const addon of addons) {
        this.api = this.api.addon(addon);
      }
    }

    if (catcher) {
      this.api = this.api.catcherFallback(catcher);
    }

    this.swap = {
      getRoute: async ({ to, from, amount, profileId }) => {
        return this.api
          .url(endpoints.MOCHI.GET_SWAP_ROUTE)
          .options({ convertSnakeCase: false })
          .query({
            from,
            to,
            amount,
            profileId,
          })
          .resolve(parse(SwapRouteSchema))
          .get();
      },
    };

    this.vault = {
      getById: async (id: number) => {
        return this.api
          .url(endpoints.MOCHI.GET_VAULT_BY_ID(id))
          .resolve(parse(VaultSchema))
          .get();
      },
    };

    this.defi = {
      getGasTrackers: async () => {
        return this.api
          .url(endpoints.MOCHI.GAS_TRACKER)
          .resolve(parse(ListGasSchema))
          .get();
      },
      compareCoins: async ({ base, target, interval }) => {
        return this.api
          .url(endpoints.MOCHI.COMPARE_COINS)
          .query({ base, target, interval })
          .resolve(parse(CompareCoinSchema))
          .get();
      },
      searchCoin: async ({ query, chain = "" }) => {
        return this.api
          .url(endpoints.MOCHI.COINS)
          .query({ query, chain })
          .resolve(parse(ListQueryCoinSchema))
          .get();
      },
      getCoin: async ({
        id,
        isDominanceChart = false,
        isWithCoingeckoInfo = false,
        chains,
      }) => {
        return this.api
          .url(endpoints.MOCHI.GET_COIN_BY_ID(id))
          .query({ isDominanceChart, isWithCoingeckoInfo, chains })
          .resolve(parse(CoinSchema))
          .get();
      },
      getHistoricalMarketData: async ({
        coinId,
        currency,
        days,
        isDominanceChart,
      }) => {
        return this.api
          .url(endpoints.MOCHI.MARKET_CHART)
          .query({
            coinId,
            currency,
            days,
            isDominanceChart,
          })
          .resolve(parse(CoinChartDataSchema))
          .get();
      },
      getSupportTokens: async ({ page = 0, size = 10 }) => {
        return this.api
          .url(endpoints.MOCHI.SUPPORTED_TOKENS)
          .query({
            page,
            size,
          })
          .resolve(parse(SimplifiedTokensSchema)<Pagination>)
          .get();
      },
      getTopGainerLoser: async (duration) => {
        return this.api
          .url(endpoints.MOCHI.GAINER_LOSER)
          .url(`/top-gainer-loser`)
          .query({ duration })
          .resolve(parse(TopGainerLoserSchema))
          .get();
      },
    };

    this.tip = {
      transferV2: async (body) => {
        return this.api
          .url(endpoints.MOCHI.TRANSFER_V2)
          .resolve(parse(TransferResultSchema))
          .post(body);
      },
    };

    this.users = {
      getListTrackingWallets: async (profileId) => {
        return this.api
          .url(endpoints.MOCHI.GET_TRACKING_WALLETS(profileId))
          .resolve(parse(TrackWalletListSchema))
          .get();
      },
      untrackWallet: async ({ profileId, address, alias }) => {
        return this.api
          .url(endpoints.MOCHI.UNTRACK_WALLET(profileId))
          .resolve(parse(AnySchema))
          .post({ profileId, address, alias });
      },
      trackWallet: async ({ alias, address, profileId, type, chainType }) => {
        return this.api
          .url(endpoints.MOCHI.TRACK_WALLET(profileId))
          .resolve(parse(AnySchema))
          .post({ alias, address, profileId, type, chainType });
      },
      getUserWatchlist: async ({ profileId, page = 0, size = 16 }) => {
        return this.api
          .url(endpoints.MOCHI.GET_TOKEN_WATCHLIST(profileId))
          .query({ page, size })
          .resolve(parse(WatchlistTokenDataListSchema)<Pagination>)
          .get();
      },
      trackToken: async ({ isFiat, profileId, symbol, coinGeckoId }) => {
        return this.api
          .url(endpoints.MOCHI.TRACK_TOKEN(profileId))
          .resolve(parse(AnySchema))
          .post({ isFiat, profileId, symbol, coinGeckoId });
      },
      untrackToken: async ({ symbol, profileId }) => {
        return this.api
          .url(endpoints.MOCHI.UNTRACK_TOKEN(profileId))
          .resolve(parse(QueryCoinResponseSchema))
          .post({ symbol, profileId });
      },
      cex: {
        binance: {
          futurePositions: async (profileId) => {
            return (
              this.api
                .url(endpoints.MOCHI.GET_BINANCE_FUTURE_POSITIONS(profileId))
                // TODO
                .resolve(parse(AnySchema))
                .get()
            );
          },
        },
      },
      getWalletAssets: async ({ profileId, chainType, address }) => {
        return this.api
          .url(
            endpoints.MOCHI.GET_WALLET_ASSET(
              profileId,
              address,
              chainType.toLowerCase()
            )
          )
          .resolve(parse(OnchainWalletBalanceSchema))
          .get();
      },
      getWalletTransactions: async ({ address, chainType, profileId }) => {
        return this.api
          .url(
            endpoints.MOCHI.GET_WALLET_TXN(
              profileId,
              address,
              chainType.toLowerCase()
            )
          )
          .resolve(parse(OnchainWalletTxnListSchema))
          .get();
      },
      getDetailTrackingWallet: async ({ profileId, query }) => {
        return this.api
          .url(endpoints.MOCHI.GET_DETAIL_TRACKING_WALLET(profileId, query))
          .resolve(parse(UserTrackingWalletSchema))
          .get();
      },
    };

    this.community = {
      sendFeedback: async (body) => {
        return (
          this.api
            .url(endpoints.MOCHI.FEEDBACK)
            // TODO
            .resolve(parse(AnySchema))
            .post({ ...body })
        );
      },
      listFeedback: async ({ profileId, page = 0, size = 5 }) => {
        return (
          this.api
            .url(endpoints.MOCHI.FEEDBACK)
            .query({
              profileId,
              page,
              size,
            })
            // TODO
            .resolve(parse(AnySchema))
            .get()
        );
      },
    };

    this.metadata = {
      getCopy: async (type: string = "") => {
        return this.api
          .url(endpoints.MOCHI.METADATA_COPY(type))
          .resolve(parse(CopySchema))
          .get();
      },
      getCommands: async () => {
        return this.api
          .url(endpoints.MOCHI.METADATA_COMMANDS)
          .resolve(parse(ListCommandSchema))
          .get();
      },
      getChangelogs: async () => {
        return this.api
          .url(endpoints.MOCHI.METADATA_GET_CHANGELOGS)
          .resolve(parse(ListChangelogSchema))
          .get();
      },
      getEmojis: async (param) => {
        return this.api
          .url(endpoints.MOCHI.METADATA_GET_EMOJIS)
          .query({ codes: param?.codes.join(",") ?? "" })
          .resolve(parse(EmojiListSchema)<Pagination>)
          .get();
      },
      getThemes: async () => {
        return this.api
          .url(endpoints.MOCHI.METADATA_GET_THEMES)
          .resolve(parse(ListThemeSchema))
          .get();
      },
    };

    this.configDefi = {
      getDefaultMonikers: async () => {
        return this.api
          .url(endpoints.MOCHI.GET_DEFAULT_MONIKERS)
          .resolve(parse(MonikersSchema))
          .get();
      },
    };
  }
}
