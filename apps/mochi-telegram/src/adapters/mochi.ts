import {
  ChartViewTimeOption,
  DominanceChartViewTimeOption,
} from "commands/ticker/type";
import { WalletTrackingType } from "commands/wallet-monitoring/enums";
import { API_SERVER_URL } from "env";
import {
  RequestUserFeedbackRequest,
  ResponseAddToWatchlistResponse,
  ResponseBinanceFutureAccountPositionResponse,
  ResponseGetOneWalletResponse,
  ResponseGetTrackingWalletsResponse,
  ResponseMonikerConfigResponse,
  ResponseUserFeedbackResponse,
} from "types/api";

import {
  ResponseChainGasTrackerResponseData,
  ResponseGetWalletAssetResponseData,
  ResponseGetWalletTxnsResponse,
  ResponsePayload,
} from "../types/common";
import base from "./base";

const api = base.url(API_SERVER_URL, true);

const defi = api.url("/defi");
const tip = api.url("/tip");
const users = api.url("/users");
const community = api.url("/community");
const configDefi = api.url("/config-defi");
const productMetadata = api.url("/product-metadata");

export default {
  productMetadata: {
    getCopy: (type = "header") =>
      productMetadata
        .url(`/copy/${type}`)
        .get()
        .json((r) => r.data),
    getCommands: () =>
      productMetadata
        .url(`/commands`)
        .get()
        .json((r) => r.data),
  },
  tip: {
    offchainTransfer: (body: any) =>
      tip
        .url("/transfer")
        .post(body)
        .json((r) => r.data),
    transferV2: (body: any) =>
      tip
        .url("/transfer-v2")
        .post(body)
        .json((r) => r.data),
  },
  defi: {
    getGasTrackers: () =>
      defi
        .url(`/gas-tracker`)
        .get()
        .json<ResponseChainGasTrackerResponseData>((r) => r),
    searchCoin: (query: string, chain = "") =>
      defi
        .url("/coins")
        .query({ query, chain })
        .get()
        .json<any>((r) => r.data),
    getCoin: (
      id: string,
      isDominanceChart = false,
      isWithCoingeckoInfo = false,
      chains?: string
    ) =>
      defi
        .url(`/coins/${id}`)
        .query({ isDominanceChart, isWithCoingeckoInfo, chains })
        .get()
        .json<any>((r) => r.data),
    getHistoricalMarketData: (
      coin_id: string,
      currency: string,
      days: ChartViewTimeOption | DominanceChartViewTimeOption,
      isDominanceChart: boolean
    ) =>
      defi
        .url(`/market-chart`)
        .query({
          coin_id,
          currency,
          days,
          isDominanceChart,
        })
        .get()
        .json((r) => r.data),
    getCoinsMarketData: () =>
      defi
        .url(`/market-data`)
        .get()
        .json((r) => r.data),
    getSupportTokens: (page: number, size: number) =>
      defi
        .url(`/tokens`)
        .query({
          page,
          size,
        })
        .get()
        .json((r) => r.data),
    getTopGainerLoser: (duration: string) =>
      defi
        .url(`/top-gainer-loser`)
        .query({ duration })
        .get()
        .json((r) => r.data),
  },
  users: {
    getListTrackingWallets: (profileId: string) =>
      users
        .url(`/${profileId}/watchlists/wallets`)
        .get()
        .json<ResponseGetTrackingWalletsResponse>(),
    untrackWallet: (body: {
      profileId: string;
      address: string;
      alias: string;
    }) =>
      users
        .url(`/${body.profileId}/watchlists/wallets/untrack`)
        .post({ ...body })
        .json<any>((r) => r.data),
    trackWallet: (body: {
      profileId: string;
      address: string;
      alias: string;
      chainType: string;
      type?: WalletTrackingType;
    }) =>
      users
        .url(`/${body.profileId}/watchlists/wallets/track`)
        .post({ ...body })
        .error(409, () => ({ ok: false, status: 409 }))
        .json(() => ({ ok: true, status: 200 })),

    getUserWatchlist: (profileId: string, page = 0, size = 16) =>
      users
        .url(`/${profileId}/watchlists/tokens`)
        .query({ page, size })
        .get()
        .json<any>((r) => r.data),

    trackToken: (body: {
      profile_id: string;
      symbol: string;
      coin_gecko_id?: string;
      is_fiat: boolean;
    }) =>
      api
        .url(`/users/${body.profile_id}/watchlists/tokens/track`)
        .post({ ...body })
        .error(404, () => {
          return {
            ok: false,
            error: {
              status: 404,
              message: [
                `ℹ️ *${body.symbol.toUpperCase()} hasn't been supported*`,
                `👉 Please choose a token supported by [Coingecko](https://www.coingecko.com/)`,
              ].join("\n"),
            },
          };
        })
        .error(409, () => {
          return {
            ok: false,
            error: {
              status: 409,
              message: [
                `ℹ️ *${body.symbol.toUpperCase()} has already been added to your watchlist.*`,
                `👉 View watchlist with /wlv`,
              ].join("\n"),
            },
          };
        })
        .json<ResponsePayload>((r: ResponseAddToWatchlistResponse) => ({
          ok: true,
          data: r?.data,
        })),

    untrackToken: (body: { profileId: string; symbol: string }) =>
      api
        .url(`/users/${body.profileId}/watchlists/tokens/untrack`)
        .post({ ...body })
        .error(404, () => {
          return {
            ok: false,
            error: {
              status: 404,
              message: [
                `ℹ️ *${body.symbol.toUpperCase()} is not in your watchlist*`,
                `👉 Add it by using \`/wla ${body.symbol}\``,
              ].join("\n"),
            },
          };
        })
        .json<any>(() => ({ ok: true, status: 200 })),

    cex: {
      binance: {
        futurePositions: (profileId: string) =>
          users
            .url(`/${profileId}/cexs/binance/positions`)
            .get()
            .json<ResponsePayload>(
              (r: ResponseBinanceFutureAccountPositionResponse) => ({
                ...r,
                ok: true,
              })
            ),
      },
    },

    getWalletAssets: (profileId: string, address: string, chainType: string) =>
      users
        .url(
          `/${profileId}/wallets/${address}/${chainType.toLowerCase()}/assets`
        )
        .get()
        .json<ResponseGetWalletAssetResponseData>((r) => r.data),

    getWalletTransactions: (
      profileId: string,
      address: string,
      chainType: string
    ) =>
      users
        .url(`/${profileId}/wallets/${address}/${chainType.toLowerCase()}/txns`)
        .get()
        .json<ResponseGetWalletTxnsResponse>((r) => ({
          ...r,
          ok: true,
        })),

    getUserTrackingWallet: (profileId: string, query: string) =>
      users
        .url(`/${profileId}/wallets/${query}`)
        .get()
        .json<ResponseGetOneWalletResponse>((r) => ({
          ...r,
          ok: true,
        })),
  },
  community: {
    sendFeedback: (req: RequestUserFeedbackRequest) =>
      community
        .url("/feedback")
        .post({ ...req })
        .json<ResponsePayload>(() => ({ ok: true, data: "ok" })),

    listFeedback: (profile_id?: string, page = 0, size = 5) =>
      community
        .url("/feedback")
        .query({
          profile_id,
          page,
          size,
        })
        .get()
        .json<ResponsePayload>((res: ResponseUserFeedbackResponse) => ({
          ...res,
          ok: true,
        })),
  },
  configDefi: {
    getDefaultMonikers: () =>
      configDefi
        .url("/monikers/default")
        .get()
        .json<ResponseMonikerConfigResponse>(),
  },
};
