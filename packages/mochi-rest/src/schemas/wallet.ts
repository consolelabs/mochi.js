import { z } from "zod";
import { ChainSchema, TokenSchema } from "./defi";

const InAppWalletSchema = z.object({
  profile_id: z.string(),
  chain_id: z.string(),
  wallet_address: z.string(),
  created_at: z.string().datetime(),
  chain: ChainSchema,
  total_amount: z.string(),
});

export const InAppWalletsSchema = z.array(InAppWalletSchema);

export type InAppWallet = z.infer<typeof InAppWalletSchema>;

const BaseTrackWalletSchema = z.object({
  profile_id: z.string(),
  address: z.string(),
  alias: z.string(),
  chain_type: z.string(),
  is_owner: z.boolean(),
  created_at: z.string().datetime(),
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
      contract_name: z.string(),
      contract_symbol: z.string(),
      asset_balance: z.number().nonnegative(),
      usd_balance: z.number().nonnegative(),
      token: TokenSchema.merge(
        z.object({
          id: z.string().optional(),
          icon: z.string().optional(),
          chain_id: z.string().optional(),
          address: z.string().optional(),
          token: z.string().optional(),
          coin_gecko_id: z.string().optional(),
          chain: ChainSchema.or(z.any()),
        })
      ),
      amount: z.string(),
      detail_staking: z.null(),
      detail_lending: z.null(),
    })
  ),
  farming: z.null().or(z.array(z.any())),
  staking: z.null().or(z.array(z.any())),
  nfts: z.null().or(z.array(z.any())),
});
export type OnchainWalletBalance = z.infer<typeof OnchainWalletBalanceSchema>;

const OnchainWalletTxnSchema = z.object({
  chain_id: z.number(),
  tx_hash: z.string(),
  scan_base_url: z.string(),
  signed_at: z.string().datetime(),
  actions: z.array(z.object({})),
  has_transfer: z.boolean(),
  successful: z.boolean(),
});

export const OnchainWalletTxnListSchema = z.array(OnchainWalletTxnSchema);
export type OnchainWalletTxn = z.infer<typeof OnchainWalletTxnSchema>;
