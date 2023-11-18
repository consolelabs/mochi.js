import { Path } from "path-parser";

type Serializable = string | number;

export default {
  MOCHI: {
    GET_VAULT_BY_ID: (vaultId: Serializable) =>
      new Path("/vault/:vaultId").build(
        { vaultId },
        { ignoreConstraints: true }
      ),
    GAS_TRACKER: "/defi/gas-tracker",
    COMPARE_COINS: "/defi/coins/compare",
    COINS: "/defi/coins",
    GET_COIN_BY_ID: (coinId: Serializable) =>
      new Path("/defi/coins/:coinId").build(
        { coinId },
        { ignoreConstraints: true }
      ),
    MARKET_CHART: "/defi/market-chart",
    SUPPORTED_TOKENS: "/defi/tokens",
    GAINER_LOSER: "/defi/top-gainer-loser",

    TRANSFER_V2: "/tip/transfer-v2",

    GET_TRACKING_WALLETS: (profileId: Serializable) =>
      new Path("/users/:profileId/watchlists/wallets").build(
        { profileId },
        { ignoreConstraints: true }
      ),
    TRACK_WALLET: (profileId: Serializable) =>
      new Path("/users/:profileId/watchlists/wallets/track").build(
        {
          profileId,
        },
        { ignoreConstraints: true }
      ),
    UNTRACK_WALLET: (profileId: Serializable) =>
      new Path("/users/:profileId/watchlists/wallets/untrack").build(
        {
          profileId,
        },
        { ignoreConstraints: true }
      ),

    GET_TOKEN_WATCHLIST: (profileId: Serializable) =>
      new Path("/users/:profileId/watchlists/tokens").build(
        { profileId },
        { ignoreConstraints: true }
      ),
    TRACK_TOKEN: (profileId: Serializable) =>
      new Path("/users/:profileId/watchlists/tokens/track").build(
        {
          profileId,
        },
        { ignoreConstraints: true }
      ),
    UNTRACK_TOKEN: (profileId: Serializable) =>
      new Path("/users/:profileId/watchlists/tokens/untrack").build(
        {
          profileId,
        },
        { ignoreConstraints: true }
      ),

    GET_BINANCE_FUTURE_POSITIONS: (profileId: Serializable) =>
      new Path("/users/:profileId/cexs/binance/positions").build(
        { profileId },
        { ignoreConstraints: true }
      ),

    GET_WALLET_ASSET: (
      profileId: Serializable,
      address: Serializable,
      chain: Serializable
    ) =>
      new Path("/users/:profileId/wallets/:address/:chain/assets").build(
        {
          profileId,
          address,
          chain,
        },
        { ignoreConstraints: true }
      ),
    GET_WALLET_TXN: (
      profileId: Serializable,
      address: Serializable,
      chain: Serializable
    ) =>
      new Path("/users/:profileId/wallets/:address/:chain/txns").build(
        {
          profileId,
          address,
          chain,
        },
        { ignoreConstraints: true }
      ),
    GET_DETAIL_TRACKING_WALLET: (
      profileId: Serializable,
      query: Serializable
    ) =>
      new Path("/users/:profileId/wallets/:query").build(
        { profileId, query },
        { ignoreConstraints: true }
      ),

    FEEDBACK: "/community/feedback",

    METADATA_COPY: (type?: Serializable) =>
      new Path("/product-metadata/copy/:type").build(
        { type: type ?? "" },
        { ignoreConstraints: true }
      ),
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
      new Path("/profiles/:profileId").build(
        { profileId },
        { ignoreConstraints: true }
      ),
    GET_BY_TELEGRAM_ID: (telegramId: Serializable) =>
      new Path("/profiles/get-by-telegram/:telegramId").build(
        { telegramId },
        { ignoreConstraints: true }
      ),
    GET_BY_TELEGRAM_USERNAMES: "/telegram",
    GET_BY_DISCORD_ID: (discordId: Serializable) =>
      new Path("/profiles/get-by-discord/:discordId").build(
        { discordId },
        { ignoreConstraints: true }
      ),
    GET_BY_EMAIL: (email: Serializable) =>
      new Path("/profiles/get-by-email/:email").build(
        { email },
        { ignoreConstraints: true }
      ),
    USER_ACTIVITIES: (profileId: Serializable) =>
      new Path("/profiles/:profileId/activities").build(
        { profileId },

        { ignoreConstraints: true }
      ),
    REQUEST_CODE: (profileId: Serializable) =>
      new Path("/profiles/:profileId/codes").build(
        { profileId },
        { ignoreConstraints: true }
      ),
    CONNECT_DISCORD: "/profiles/me/accounts/connect-discord",
    CONNECT_TELEGRAM: "/profiles/me/accounts/connect-telegram",
  },
  MOCHI_PAY: {
    WITHDRAW: "/mochi-wallet/withdraw",
    DEPOSIT: "/mochi-wallet/deposit",
    GET_BALANCE: (profileId: Serializable, token?: Serializable) =>
      new Path("/:profileId/balances/:token").build(
        {
          profileId,
          token: token ?? "",
        },
        { ignoreConstraints: true }
      ),
    GET_WALLETS: (profileId: Serializable) =>
      new Path("/in-app-wallets/get-by-profile/:profileId").build(
        {
          profileId,
        },
        { ignoreConstraints: true }
      ),
    GLOBAL_TRANSACTIONS: "/transactions",
    PROFILE_TRANSACTIONS: "/profile/transactions",
    PAY_REQUESTS: "/pay-requests",
    MONTHLY_STATS: (profileId: Serializable) =>
      new Path("/profile/:profileId/monthly-stats").build(
        { profileId },
        { ignoreConstraints: true }
      ),
    GET_PAYLINKS: (profileId: Serializable) =>
      new Path("/profile/:profileId/pay-link").build(
        { profileId },
        { ignoreConstraints: true }
      ),
    GET_PAYMES: (profileId: Serializable) =>
      new Path("/profile/:profileId/pay-me").build(
        { profileId },
        { ignoreConstraints: true }
      ),
    SUPPORTED_TOKENS: "/tokens",
    CONSOLE_TOKENS: "/console-tokens",
    SUPPORTED_CHAINS: "/chains",
    LEADERBOARD: "/leaderboard",
  },
} as const;
