import { z } from "zod";
import { ChainSchema, TokenSchema } from "./defi";

const InAppWalletSchema = z.object({
  profile_id: z.string().nonempty(),
  chain_id: z.string().nonempty(),
  wallet_address: z.string().nonempty(),
  created_at: z.string().datetime().nonempty(),
  chain: ChainSchema,
  total_amount: z.string(),
});

export const InAppWalletsSchema = z.array(InAppWalletSchema);

export type InAppWallet = z.infer<typeof InAppWalletSchema>;

const BaseTrackWalletSchema = z.object({
  profile_id: z.string().nonempty(),
  address: z.string().nonempty(),
  alias: z.string(),
  chain_type: z.string(),
  is_owner: z.boolean(),
  created_at: z.string().datetime().nonempty(),
  net_worth: z.number(),
  fetched_data: z.boolean(),
});

const FollowWalletSchema = BaseTrackWalletSchema.extend({
  type: z.literal("follow"),
});

const TrackWalletSchema = BaseTrackWalletSchema.extend({
  type: z.literal("track"),
});

const CopyWalletSchema = BaseTrackWalletSchema.extend({
  type: z.literal("copy"),
});

export const UserTrackingWalletSchema = z.discriminatedUnion("type", [
  FollowWalletSchema,
  TrackWalletSchema,
  CopyWalletSchema,
]);
export type UserTrackingWallet = z.infer<typeof UserTrackingWalletSchema>;

export const TrackWalletListSchema = z.object({
  following: z.array(FollowWalletSchema),
  tracking: z.array(TrackWalletSchema),
  copying: z.array(CopyWalletSchema),
});

export type TrackWalletList = z.infer<typeof TrackWalletListSchema>;

export const OnchainWalletBalanceSchema = z.object({
  pnl: z.string(),
  latest_snapshot_bal: z.string(),
  balance: z.array(
    z.object({
      chain_id: z.number(),
      contract_name: z.string().nonempty(),
      contract_symbol: z.string().nonempty(),
      asset_balance: z.number().nonnegative(),
      usd_balance: z.number().nonnegative(),
      token: TokenSchema,
      amount: z.string(),
      detail_staking: z.null(),
      detail_lending: z.null(),
    })
  ),
  farming: z.null(),
  staking: z.null(),
  nfts: z.null(),
});
export type OnchainWalletBalance = z.infer<typeof OnchainWalletBalanceSchema>;

const OnchainWalletTxnSchema = z.object({
  chain_id: z.number(),
  tx_hash: z.string().nonempty(),
  scan_base_url: z.string(),
  signed_at: z.string().datetime(),
  actions: z.array(z.object({})),
  has_transfer: z.boolean(),
  successful: z.boolean(),
});

export const OnchainWalletTxnListSchema = z.array(OnchainWalletTxnSchema);
export type OnchainWalletTxn = z.infer<typeof OnchainWalletTxnSchema>;
