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
} from "../schemas";
import { FullOptions } from "../mochi";

const base = wretch()
  .content("application/json")
  .middlewares([
    attachRequestId,
    convertQueryToSnakeCase,
    convertBodyToSnakeCase,
    log,
    throttlingCache(),
  ])
  .addon(QueryStringAddon);

export default base;

export class BaseModule {
  vault: {
    getById: Fetcher<number, Vault>;
  };

  metadata: {
    getCopy: Fetcher<string | void, Copy>;
    getCommands: Fetcher<void, Array<Command>>;
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
    getSupportTokens: Fetcher<{ page: number; size: number }>;
    getTopGainerLoser: Fetcher<string, TopGainerLoser>;
  };

  users: {
    getListTrackingWallets: Fetcher<string>;
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
    getUserWatchlist: Fetcher<{
      profileId: string;
      page?: number;
      size?: number;
    }>;
    trackToken: Fetcher<{
      profileId: string;
      symbol: string;
      coinGeckoId?: string;
      isFiat: boolean;
    }>;
    untrackToken: Fetcher<{
      profileId: string;
      symbol: string;
    }>;
    cex: {
      binance: {
        futurePositions: Fetcher<string>;
      };
    };
    getWalletAssets: Fetcher<{
      profileId: string;
      address: string;
      chainType: string;
    }>;
    getWalletTransactions: Fetcher<{
      profileId: string;
      address: string;
      chainType: string;
    }>;
    getUserTrackingWallet: Fetcher<{ profileId: string; query: string }>;
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
    getDefaultMonikers: Fetcher;
  };

  constructor({ baseUrl, apiKey, catcher }: FullOptions) {
    const parse = getParser(catcher);
    let api = base.url(baseUrl, true);

    if (catcher) {
      api = api.catcherFallback(catcher);
    }

    let vault = api.url("/vault");
    let defi = api.url("/defi");
    let tip = api.url("/tip");
    let users = api.url("/users");
    let community = api.url("/community");
    let configDefi = api.url("/config-defi");
    let productMetadata = api.url("/product-metadata");

    if (apiKey) {
      defi = defi.auth(`Bearer ${apiKey}`);
      tip = tip.auth(`Bearer ${apiKey}`);
      users = users.auth(`Bearer ${apiKey}`);
      community = community.auth(`Bearer ${apiKey}`);
      configDefi = configDefi.auth(`Bearer ${apiKey}`);
      productMetadata = productMetadata.auth(`Bearer ${apiKey}`);
    }

    this.vault = {
      getById: async function (id: number) {
        return vault.url(`/${id}`).resolve(parse(VaultSchema)).get();
      },
    };

    this.defi = {
      getGasTrackers: async function () {
        return defi.url(`/gas-tracker`).resolve(parse(ListGasSchema)).get();
      },
      searchCoin: async function ({ query, chain = "" }) {
        return defi
          .url("/coins")
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
        return defi
          .url(`/coins/${id}`)
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
        return defi
          .url(`/market-chart`)
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
        return (
          defi
            .url(`/tokens`)
            .query({
              page,
              size,
            })
            // TODO
            .resolve(parse(AnySchema))
            .get()
        );
      },
      getTopGainerLoser: async function (duration) {
        return defi
          .url(`/top-gainer-loser`)
          .query({ duration })
          .resolve(parse(TopGainerLoserSchema))
          .get();
      },
    };

    this.tip = {
      transferV2: async function (body) {
        return tip
          .url("/transfer-v2")
          .resolve(parse(TransferResultSchema))
          .post(body);
      },
    };

    this.users = {
      getListTrackingWallets: async function (profileId) {
        return (
          users
            .url(`/${profileId}/watchlists/wallets`)
            // TODO
            .resolve(parse(AnySchema))
            .get()
        );
      },
      untrackWallet: async function ({ profileId, address, alias }) {
        return (
          users
            .url(`/${profileId}/watchlists/wallets/untrack`)
            // TODO
            .resolve(parse(AnySchema))
            .post({ profileId, address, alias })
        );
      },
      trackWallet: async function ({
        alias,
        address,
        profileId,
        type,
        chainType,
      }) {
        return (
          users
            .url(`/${profileId}/watchlists/wallets/track`)
            // TODO
            .resolve(parse(AnySchema))
            .post({ alias, address, profileId, type, chainType })
        );
      },
      getUserWatchlist: async function ({ profileId, page = 0, size = 16 }) {
        return (
          users
            .url(`/${profileId}/watchlists/tokens`)
            .query({ page, size })
            // TODO
            .resolve(parse(AnySchema))
            .get()
        );
      },
      trackToken: async function ({ isFiat, profileId, symbol, coinGeckoId }) {
        return (
          api
            .url(`/users/${profileId}/watchlists/tokens/track`)
            // TODO
            .resolve(parse(AnySchema))
            .post({ isFiat, profileId, symbol, coinGeckoId })
        );
      },
      untrackToken: async function ({ symbol, profileId }) {
        return (
          api
            .url(`/users/${profileId}/watchlists/tokens/untrack`)
            // TODO
            .resolve(parse(AnySchema))
            .post({ symbol, profileId })
        );
      },
      cex: {
        binance: {
          futurePositions: async function (profileId) {
            return (
              users
                .url(`/${profileId}/cexs/binance/positions`)
                // TODO
                .resolve(parse(AnySchema))
                .get()
            );
          },
        },
      },
      getWalletAssets: async function ({ profileId, chainType, address }) {
        return (
          users
            .url(
              `/${profileId}/wallets/${address}/${chainType.toLowerCase()}/assets`
            )
            // TODO
            .resolve(parse(AnySchema))
            .get()
        );
      },
      getWalletTransactions: async function ({
        address,
        chainType,
        profileId,
      }) {
        return (
          users
            .url(
              `/${profileId}/wallets/${address}/${chainType.toLowerCase()}/txns`
            )
            // TODO
            .resolve(parse(AnySchema))
            .get()
        );
      },
      getUserTrackingWallet: async function ({ profileId, query }) {
        return (
          users
            .url(`/${profileId}/wallets/${query}`)
            // TODO
            .resolve(parse(AnySchema))
            .get()
        );
      },
    };

    this.community = {
      sendFeedback: async function (body) {
        return (
          community
            .url("/feedback")
            // TODO
            .resolve(parse(AnySchema))
            .post({ ...body })
        );
      },
      listFeedback: async function ({ profileId, page = 0, size = 5 }) {
        return (
          community
            .url("/feedback")
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
      getCopy: async function (type?: string) {
        return productMetadata
          .url(`/copy/${type}`)
          .resolve(parse(CopySchema))
          .get();
      },
      getCommands: async function () {
        return productMetadata
          .url("/commands")
          .resolve(parse(ListCommandSchema))
          .get();
      },
    };

    this.configDefi = {
      getDefaultMonikers: async function () {
        return (
          configDefi
            .url("/monikers/default")
            // TODO
            .resolve(parse(AnySchema))
            .get()
        );
      },
    };
  }
}
