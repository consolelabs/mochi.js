import wretch from "wretch";
import QueryStringAddon from "wretch/addons/queryString";
import {
  attachRequestId,
  convertBodyToSnakeCase,
  convertQueryToSnakeCase,
  log,
} from "./middlewares";
import { throttlingCache } from "wretch/middlewares";
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
  ViewChangelog,
  ListViewChangelogSchema,
} from "../schemas";
import { FullOptions } from "../mochi";
import endpoints from "../endpoints";
import { MockAddOn } from "@consolelabs/mochi-mock";

const base = wretch()
  .content("application/json")
  .middlewares([
    attachRequestId,
    convertQueryToSnakeCase,
    convertBodyToSnakeCase,
    log,
    throttlingCache(),
  ])
  .addon(QueryStringAddon)
  .addon(MockAddOn);

export default base;

export class BaseModule {
  vault: {
    getById: Fetcher<number, Vault>;
  };

  metadata: {
    getCopy: Fetcher<string | void, Copy>;
    getCommands: Fetcher<void, Array<Command>>;
    getChangelogs: Fetcher<void, Array<Changelog>>;
    getChangelogView: Fetcher<string, Array<ViewChangelog>>;
    markChangelogRead: Fetcher<{ key: string; changelogName: string }>;
  };

  tip: {
    transferV2: Fetcher<TransferRequest, TransferResult>;
  };

  defi: {
    getGasTrackers: Fetcher<void, Array<Gas>>;
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

  constructor({ baseUrl, apiKey, catcher, log }: FullOptions) {
    const parse = getParser(catcher);
    let api = base.url(baseUrl, true);
    api = api.options({ log });

    if (catcher) {
      api = api.catcherFallback(catcher);
    }

    if (apiKey) {
      api = api.auth(`Bearer ${apiKey}`);
    }

    this.vault = {
      getById: async function (id: number) {
        return api
          .url(endpoints.MOCHI.GET_VAULT_BY_ID(id))
          .resolve(parse(VaultSchema))
          .get();
      },
    };

    this.defi = {
      getGasTrackers: async function () {
        return api
          .url(endpoints.MOCHI.GAS_TRACKER)
          .resolve(parse(ListGasSchema))
          .get();
      },
      searchCoin: async function ({ query, chain = "" }) {
        return api
          .url(endpoints.MOCHI.COINS)
          .query({ query, chain })
          .resolve(parse(ListQueryCoinSchema))
          .get();
      },
      getCoin: async function ({
        id,
        isDominanceChart = false,
        isWithCoingeckoInfo = false,
        chains,
      }) {
        return api
          .url(endpoints.MOCHI.GET_COIN_BY_ID(id))
          .query({ isDominanceChart, isWithCoingeckoInfo, chains })
          .resolve(parse(CoinSchema))
          .get();
      },
      getHistoricalMarketData: async function ({
        coinId,
        currency,
        days,
        isDominanceChart,
      }) {
        return api
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
      getSupportTokens: async function ({ page = 0, size = 10 }) {
        return api
          .url(endpoints.MOCHI.SUPPORTED_TOKENS)
          .query({
            page,
            size,
          })
          .resolve(parse(SimplifiedTokensSchema)<Pagination>)
          .get();
      },
      getTopGainerLoser: async function (duration) {
        return api
          .url(endpoints.MOCHI.GAINER_LOSER)
          .url(`/top-gainer-loser`)
          .query({ duration })
          .resolve(parse(TopGainerLoserSchema))
          .get();
      },
    };

    this.tip = {
      transferV2: async function (body) {
        return api
          .url(endpoints.MOCHI.TRANSFER_V2)
          .resolve(parse(TransferResultSchema))
          .post(body);
      },
    };

    this.users = {
      getListTrackingWallets: async function (profileId) {
        return api
          .url(endpoints.MOCHI.GET_TRACKING_WALLETS(profileId))
          .resolve(parse(TrackWalletListSchema))
          .get();
      },
      untrackWallet: async function ({ profileId, address, alias }) {
        return api
          .url(endpoints.MOCHI.UNTRACK_WALLET(profileId))
          .resolve(parse(AnySchema))
          .post({ profileId, address, alias });
      },
      trackWallet: async function ({
        alias,
        address,
        profileId,
        type,
        chainType,
      }) {
        return api
          .url(endpoints.MOCHI.TRACK_WALLET(profileId))
          .resolve(parse(AnySchema))
          .post({ alias, address, profileId, type, chainType });
      },
      getUserWatchlist: async function ({ profileId, page = 0, size = 16 }) {
        return api
          .url(endpoints.MOCHI.GET_TOKEN_WATCHLIST(profileId))
          .query({ page, size })
          .resolve(parse(WatchlistTokenDataListSchema)<Pagination>)
          .get();
      },
      trackToken: async function ({ isFiat, profileId, symbol, coinGeckoId }) {
        return api
          .url(endpoints.MOCHI.TRACK_TOKEN(profileId))
          .resolve(parse(AnySchema))
          .post({ isFiat, profileId, symbol, coinGeckoId });
      },
      untrackToken: async function ({ symbol, profileId }) {
        return api
          .url(endpoints.MOCHI.UNTRACK_TOKEN(profileId))
          .resolve(parse(QueryCoinResponseSchema))
          .post({ symbol, profileId });
      },
      cex: {
        binance: {
          futurePositions: async function (profileId) {
            return (
              api
                .url(endpoints.MOCHI.GET_BINANCE_FUTURE_POSITIONS(profileId))
                // TODO
                .resolve(parse(AnySchema))
                .get()
            );
          },
        },
      },
      getWalletAssets: async function ({ profileId, chainType, address }) {
        return api
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
      getWalletTransactions: async function ({
        address,
        chainType,
        profileId,
      }) {
        return api
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
      getDetailTrackingWallet: async function ({ profileId, query }) {
        return api
          .url(endpoints.MOCHI.GET_DETAIL_TRACKING_WALLET(profileId, query))
          .resolve(parse(UserTrackingWalletSchema))
          .get();
      },
    };

    this.community = {
      sendFeedback: async function (body) {
        return (
          api
            .url(endpoints.MOCHI.FEEDBACK)
            // TODO
            .resolve(parse(AnySchema))
            .post({ ...body })
        );
      },
      listFeedback: async function ({ profileId, page = 0, size = 5 }) {
        return (
          api
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
      getCopy: async function (type: string = "") {
        return api
          .url(endpoints.MOCHI.METADATA_COPY(type))
          .resolve(parse(CopySchema))
          .get();
      },
      getCommands: async function () {
        return api
          .url(endpoints.MOCHI.METADATA_COMMANDS)
          .resolve(parse(ListCommandSchema))
          .get();
      },
      getChangelogs: async function () {
        return api
          .url(endpoints.MOCHI.METADATA_GET_CHANGELOGS)
          .resolve(parse(ListChangelogSchema))
          .get();
      },
      getChangelogView: async function (key: string) {
        return api
          .url(endpoints.MOCHI.METADATA_CHANGELOG_VIEW)
          .query({ key })
          .resolve(parse(ListViewChangelogSchema))
          .get();
      },
      markChangelogRead: async function ({ key, changelogName }) {
        return api
          .url(endpoints.MOCHI.METADATA_CHANGELOG_VIEW)
          .resolve(parse(AnySchema))
          .post({ key, changelogName });
      },
    };

    this.configDefi = {
      getDefaultMonikers: async function () {
        return api
          .url(endpoints.MOCHI.GET_DEFAULT_MONIKERS)
          .resolve(parse(MonikersSchema))
          .get();
      },
    };
  }
}
