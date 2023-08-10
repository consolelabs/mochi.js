import wretch from "wretch";
import QueryStringAddon from "wretch/addons/queryString";
import {
  attachRequestId,
  convertBodyToSnakeCase,
  convertQueryToSnakeCase,
  log,
} from "./middlewares";
import { throttlingCache } from "wretch/middlewares";
import { API_SERVER_URL } from "../constant";
import type { Fetcher } from "../utils";

const base = wretch()
  .content("application/json")
  .middlewares([
    attachRequestId,
    convertQueryToSnakeCase,
    convertBodyToSnakeCase,
    log,
    throttlingCache(),
  ])
  .resolve((r) => {
    const json = r.json<any>();
    if (!("data" in json)) {
      return {
        ok: true,
        data: json,
      };
    }
    return {
      ok: true,
      ...json,
    };
  })
  .addon(QueryStringAddon)
  .catcherFallback((error) => {
    return {
      ok: false,
      error,
    };
  });

export default base;

const api = base.url(API_SERVER_URL, true);

let defi = api.url("/defi");
let tip = api.url("/tip");
let users = api.url("/users");
let community = api.url("/community");
let configDefi = api.url("/config-defi");
let productMetadata = api.url("/product-metadata");

export class BaseModule {
  metadata: {
    getCopy: Fetcher<string>;
  };

  tip: {
    transferV2: Fetcher;
  };

  defi: {
    getGasTrackers: Fetcher;
    searchCoin: Fetcher<{ query: string; chain?: string }>;
    getCoin: Fetcher<{
      id: string;
      isDominanceChart?: boolean;
      isWithCoingeckoInfo?: boolean;
      chains?: string;
    }>;
    getHistoricalMarketData: Fetcher<{
      coinId: string;
      currency: string;
      days: 1 | 7 | 30 | 60 | 90 | 365 | 730 | 1095;
      isDominanceChart: boolean;
    }>;
    getCoinsMarketData: Fetcher;
    getSupportTokens: Fetcher<{ page: number; size: number }>;
    getTopGainerLoser: Fetcher<string>;
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
    sendFeedback: Fetcher;
    listFeedback: Fetcher<{
      profileId?: string;
      page?: number;
      size?: number;
    }>;
  };

  configDefi: {
    getDefaultMonikers: Fetcher;
  };

  constructor(apiKey?: string) {
    defi = defi.auth(`Bearer ${apiKey}`);
    tip = tip.auth(`Bearer ${apiKey}`);
    users = users.auth(`Bearer ${apiKey}`);
    community = community.auth(`Bearer ${apiKey}`);
    configDefi = configDefi.auth(`Bearer ${apiKey}`);
    productMetadata = productMetadata.auth(`Bearer ${apiKey}`);

    this.defi = {
      getGasTrackers: async function () {
        return defi.url(`/gas-tracker`).get();
      },
      searchCoin: async function ({ query, chain = "" }) {
        return defi.url("/coins").query({ query, chain }).get();
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
          .get();
      },
      getCoinsMarketData: async function () {
        return defi.url(`/market-data`).get();
      },
      getSupportTokens: async function ({ page = 0, size = 10 }) {
        return defi
          .url(`/tokens`)
          .query({
            page,
            size,
          })
          .get();
      },
      getTopGainerLoser: async function (duration) {
        return defi.url(`/top-gainer-loser`).query({ duration }).get();
      },
    };

    this.tip = {
      transferV2: async function (body) {
        return tip.url("/transfer-v2").post(body);
      },
    };

    this.users = {
      getListTrackingWallets: async function (profileId) {
        return users.url(`/${profileId}/watchlists/wallets`).get();
      },
      untrackWallet: async function ({ profileId, address, alias }) {
        return users
          .url(`/${profileId}/watchlists/wallets/untrack`)
          .post({ profileId, address, alias });
      },
      trackWallet: async function ({
        alias,
        address,
        profileId,
        type,
        chainType,
      }) {
        return users
          .url(`/${profileId}/watchlists/wallets/track`)
          .post({ alias, address, profileId, type, chainType });
      },
      getUserWatchlist: async function ({ profileId, page = 0, size = 16 }) {
        return users
          .url(`/${profileId}/watchlists/tokens`)
          .query({ page, size })
          .get();
      },
      trackToken: async function ({ isFiat, profileId, symbol, coinGeckoId }) {
        return api
          .url(`/users/${profileId}/watchlists/tokens/track`)
          .post({ isFiat, profileId, symbol, coinGeckoId });
      },
      untrackToken: async function ({ symbol, profileId }) {
        return api
          .url(`/users/${profileId}/watchlists/tokens/untrack`)
          .post({ symbol, profileId });
      },
      cex: {
        binance: {
          futurePositions: async function (profileId) {
            return users.url(`/${profileId}/cexs/binance/positions`).get();
          },
        },
      },
      getWalletAssets: async function ({ profileId, chainType, address }) {
        return users
          .url(
            `/${profileId}/wallets/${address}/${chainType.toLowerCase()}/assets`
          )
          .get();
      },
      getWalletTransactions: async function ({
        address,
        chainType,
        profileId,
      }) {
        return users
          .url(
            `/${profileId}/wallets/${address}/${chainType.toLowerCase()}/txns`
          )
          .get();
      },
      getUserTrackingWallet: async function ({ profileId, query }) {
        return users.url(`/${profileId}/wallets/${query}`).get();
      },
    };

    this.community = {
      sendFeedback: async function (body) {
        return community.url("/feedback").post({ ...body });
      },
      listFeedback: async function ({ profileId, page = 0, size = 5 }) {
        return community
          .url("/feedback")
          .query({
            profileId,
            page,
            size,
          })
          .get();
      },
    };

    this.metadata = {
      getCopy: async function (type) {
        return productMetadata.url(`/copy/${type}`).get();
      },
    };

    this.configDefi = {
      getDefaultMonikers: async function () {
        return configDefi.url("/monikers/default").get();
      },
    };
  }
}
