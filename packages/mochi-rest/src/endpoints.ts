import { Path } from "path-parser";

type Serializable = string | number;

export default {
  MOCHI: {
    GET_VAULT_BY_ID: (vaultId: Serializable) =>
      new Path("/vault/:vaultId").build({ vaultId }),
    GAS_TRACKER: "/defi/gas-tracker",
    COMPARE_COINS: "/defi/coins/compare",
    COINS: "/defi/coins",
    GET_COIN_BY_ID: (coinId: Serializable) =>
      new Path("/defi/coins/:coinId").build({ coinId }),
    MARKET_CHART: "/defi/market-chart",
    SUPPORTED_TOKENS: "/defi/tokens",
    GAINER_LOSER: "/defi/top-gainer-loser",

    TRANSFER_V2: "/tip/transfer-v2",

    GET_TRACKING_WALLETS: (profileId: Serializable) =>
      new Path("/users/:profileId/watchlists/wallets").build({ profileId }),
    TRACK_WALLET: (profileId: Serializable) =>
      new Path("/users/:profileId/watchlists/wallets/track").build({
        profileId,
      }),
    UNTRACK_WALLET: (profileId: Serializable) =>
      new Path("/users/:profileId/watchlists/wallets/untrack").build({
        profileId,
      }),

    GET_TOKEN_WATCHLIST: (profileId: Serializable) =>
      new Path("/users/:profileId/watchlists/tokens").build({ profileId }),
    TRACK_TOKEN: (profileId: Serializable) =>
      new Path("/users/:profileId/watchlists/tokens/track").build({
        profileId,
      }),
    UNTRACK_TOKEN: (profileId: Serializable) =>
      new Path("/users/:profileId/watchlists/tokens/untrack").build({
        profileId,
      }),

    GET_BINANCE_FUTURE_POSITIONS: (profileId: Serializable) =>
      new Path("/users/:profileId/cexs/binance/positions").build({ profileId }),

    GET_WALLET_ASSET: (
      profileId: Serializable,
      address: Serializable,
      chain: Serializable
    ) =>
      new Path("/users/:profileId/wallets/:address/:chain/assets").build({
        profileId,
        address,
        chain,
      }),
    GET_WALLET_TXN: (
      profileId: Serializable,
      address: Serializable,
      chain: Serializable
    ) =>
      new Path("/users/:profileId/wallets/:address/:chain/txns").build({
        profileId,
        address,
        chain,
      }),
    GET_DETAIL_TRACKING_WALLET: (
      profileId: Serializable,
      query: Serializable
    ) =>
      new Path("/users/:profileId/wallets/:query").build({ profileId, query }),

    FEEDBACK: "/community/feedback",

    METADATA_COPY: (type?: Serializable) =>
      new Path("/product-metadata/copy/:type").build({ type: type ?? "" }),
    METADATA_COMMANDS: "/product-metadata/commands",
    METADATA_GET_CHANGELOGS: "/product-metadata/changelogs",
    METADATA_GET_EMOJIS: "/product-metadata/emoji",
    METADATA_GET_THEMES: "/product-metadata/themes",

    GET_DEFAULT_MONIKERS: "/config-defi/monikers/default",

    GET_SWAP_ROUTE: "/swap/route",
  },
  MOCHI_PROFILE: {
    AUTH_BY_DISCORD: "/profiles/auth/discord",
    AUTH_BY_FACEBOOK: "/profiles/auth/facebook",
    AUTH_BY_TWITTER: "/profiles/auth/twitter",
    AUTH_BY_GMAIL: "/profiles/auth/mail",
    AUTH_BY_TELEGRAM: "/profiles/auth/telegram",

    GET_BY_ID: (profileId: Serializable) =>
      new Path("/profiles/:profileId").build({ profileId }),
    GET_BY_TELEGRAM_ID: (telegramId: Serializable) =>
      new Path("/profiles/get-by-telegram/:telegramId").build({ telegramId }),
    GET_BY_TELEGRAM_USERNAME: (username: Serializable) =>
      new Path("/telegram/get-by-username/:username").build({ username }),
    GET_BY_DISCORD_USERNAME: (username: Serializable) =>
      new Path("/discord/get-by-username/:username").build({ username }),
    GET_BY_DISCORD_ID: (discordId: Serializable) =>
      new Path("/profiles/get-by-discord/:discordId").build({ discordId }),
    GET_BY_EMAIL: (email: Serializable) =>
      new Path("/profiles/get-by-email/:email").build({ email }),

    GET_BY_TELEGRAM_USERNAMES: "/telegram",

    USER_ACTIVITIES: (profileId: Serializable) =>
      new Path("/profiles/:profileId/activities").build({ profileId }),

    USER_ACTIVITIES_ALL: (profileId: Serializable) =>
      new Path("/profiles/:profileId/activities/all").build({ profileId }),

    REQUEST_CODE: (profileId: Serializable) =>
      new Path("/profiles/:profileId/codes").build({ profileId }),
    CONNECT_DISCORD: "/profiles/me/accounts/connect-discord",
    CONNECT_TELEGRAM: "/profiles/me/accounts/connect-telegram",

    PROFILE_SEARCH: "/profiles/search",
  },
  MOCHI_PAY: {
    WITHDRAW: "/mochi-wallet/withdraw",
    DEPOSIT: "/mochi-wallet/deposit",
    GET_BALANCE: (profileId: Serializable, token?: Serializable) =>
      token
        ? new Path("/mochi-wallet/:profileId/balances/:token").build({
            profileId,
            token,
          })
        : new Path("/mochi-wallet/:profileId/balances").build({ profileId }),
    GET_WALLETS: (profileId: Serializable) =>
      new Path("/in-app-wallets/get-by-profile/:profileId").build({
        profileId,
      }),
    GLOBAL_TRANSACTIONS: "/transactions",
    PROFILE_TRANSACTIONS: "/profile/transactions",
    PAY_REQUESTS: "/pay-requests",
    MONTHLY_STATS: (profileId: Serializable) =>
      new Path("/profile/:profileId/monthly-stats").build({ profileId }),
    GET_PAYLINKS: (profileId: Serializable) =>
      new Path("/profile/:profileId/pay-link").build({ profileId }),
    GET_PAYMES: (profileId: Serializable) =>
      new Path("/profile/:profileId/pay-me").build({ profileId }),
    SUPPORTED_TOKENS: "/tokens",
    CONSOLE_TOKENS: "/console-tokens",
    SUPPORTED_CHAINS: "/chains",
    LEADERBOARD: "/leaderboard",
  },
} as const;
