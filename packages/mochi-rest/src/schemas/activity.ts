import { z } from "zod";

enum ActivityType {
  ACTIVITY_PROFILE_ADD_ONCHAIN_WALLET = 0,
  ACTIVITY_PROFILE_REMOVE_ONCHAIN_WALLET,
  ACTIVITY_PROFILE_ADD_BINANCE,
  ACTIVITY_PROFILE_REMOVE_BINANCE,
  ACTIVITY_PROFILE_ADD_TELEGRAM,
  ACTIVITY_PROFILE_REMOVE_TELEGRAM,
  ACTIVITY_PROFILE_ADD_TWITTER,
  ACTIVITY_PROFILE_REMOVE_TWITTER,
  ACTIVITY_PAY_DEPOSIT,
  ACTIVITY_PAY_WITHDRAW,
  ACTIVITY_PAY_SEND,
  ACTIVITY_PAY_RECEIVE,
  ACTIVITY_PAY_SWAP,
  ACTIVITY_PAY_EARN,
  ACTIVITY_APP_WALLET_TRACK,
  ACTIVITY_APP_WALLET_UNTRACK,
  ACTIVITY_APP_WALLET_ADD,
  ACTIVITY_APP_WALLET_ALIAS_SET,
  ACTIVITY_APP_WALLET_ALIAS_REMOVE,
  ACTIVITY_APP_WATCHLIST_ADD,
  ACTIVITY_APP_WATCHLIST_REMOVE,
  ACTIVITY_PAY_STAKE,
  ACTIVITY_PAY_UNSTAKE,
  ACTIVITY_PAY_CLAIM_REWARD,
  ACTIVITY_VAULT_PROPOSAL,
  ACTIVITY_VAULT_VOTE,
  ACTIVITY_PAY_REQUEST,
}

export const ActivitySchema = z.object({
  id: z.number().nonnegative(),
  type: z.nativeEnum(ActivityType),
  user_profile_id: z.string().nonempty(),
  target_profile_id: z.string().nonempty(),
  content: z.string().nonempty(),
  content_raw: z.string().nonempty(),
  changes: z.array(z.object({ key: z.string(), value: z.string() })).nonempty(),
  status: z.enum(["read", "new"]),
  created_at: z.string().datetime().nonempty(),
  updated_at: z.string().datetime().nonempty(),
});

export const ListActivity = z.array(ActivitySchema);

export type Activity = z.infer<typeof ActivitySchema>;
