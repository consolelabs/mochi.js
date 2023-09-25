export const MIN_DUST_USD = 0.001;
export const APPROX = "≈";
export const VERTICAL_BAR = "｜";
export const HOMEPAGE = "https://mochi.gg";
export const DISCORD_PROFILE = "https://dicordapp.com/users";
export const TELEGRAM_PROFILE = "tg://user?id=";
export enum PageSize {
  Standard = 10,
  Medium = 15,
  Large = 20,
}

export enum ActivityType {
  // profile
  AddOnchainWallet = 0,
  RemoveOnchainWallet,
  AddBinance,
  RemoveBinance,
  AddTelegram,
  RemoveTelegram,
  AddTwitter,
  RemoveTwitter,

  // pay
  Deposit,
  Withdraw,
  Send,
  Receive,
  Swap,
  Earn,

  // app
  TrackWallet,
  UntrackWallet,
  AddWallet,
  SetAliasWallet,
  RemoveAliasWallet,
  AddWatchlist,
  RemoveWatchlist,

  // pay 2
  Stake,
  Unstake,
  ClaimReward,

  // vault
  Proposal,
  Vote,

  // pay request
  PayRequest,
}
