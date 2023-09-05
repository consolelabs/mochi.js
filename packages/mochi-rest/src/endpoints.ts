import { Path } from "path-parser";

type Serializable = string | number;

export default {
  MOCHI: {
    GET_VAULT_BY_ID: (vaultId: Serializable) =>
      new Path("/vault/:vaultId").build({ vaultId }),
    GAS_TRACKER: "/defi/gas-tracker",
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
    METADATA_CHANGELOG_VIEW: "/product-metadata/changelogs/view",

    GET_DEFAULT_MONIKERS: "/config-defi/monikers/default",
  },
  MOCHI_PROFILE: {
    AUTH_BY_DISCORD: "/profiles/auth/discord",
    GET_BY_ID: (profileId: Serializable) =>
      new Path("/profiles/:profileId").build({ profileId }),
    GET_BY_TELEGRAM_ID: (telegramId: Serializable) =>
      new Path("/profiles/get-by-telegram/:telegramId").build({ telegramId }),
    GET_BY_TELEGRAM_USERNAMES: "/telegram",
    GET_BY_DISCORD_ID: (discordId: Serializable) =>
      new Path("/profiles/get-by-discord/:discordId").build({ discordId }),
    GET_BY_EMAIL: (email: Serializable) =>
      new Path("/profiles/get-by-email/:email").build({ email }),
    USER_ACTIVITIES: (profileId: Serializable) =>
      new Path("/profiles/:profileId/activities").build({ profileId }),
    REQUEST_CODE: (profileId: Serializable) =>
      new Path("/profiles/:profileId/codes").build({ profileId }),
  },
  MOCHI_PAY: {
    WITHDRAW: "/mochi-wallet/withdraw",
    DEPOSIT: "/mochi-wallet/deposit",
    GET_BALANCE: (profileId: Serializable, token?: Serializable) =>
      new Path("/:profileId/balances/:token").build({
        profileId,
        token: token ?? "",
      }),
    GET_WALLETS: (profileId: Serializable) =>
      new Path("/in-app-wallets/get-by-profile/:profileId").build({
        profileId,
      }),
    GLOBAL_TRANSACTIONS: "/transactions",
    PROFILE_TRANSACTIONS: "/profile/transactions",
    PAY_REQUESTS: "/pay-requests",
    MONTHLY_STATS: (profileId: Serializable) =>
      new Path("/profile/:profileId/monthly-stats").build({ profileId }),
    SUPPORTED_TOKENS: "/tokens",
    CONSOLE_TOKENS: "/console-tokens",
    SUPPORTED_CHAINS: "/chains",
    LEADERBOARD: "/leaderboard",
  },
} as const;
