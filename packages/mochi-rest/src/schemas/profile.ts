import { z } from "zod";
import { ListOffchainTxSchema, TokenSchema } from "./defi";

const AssociatedAccountSchema = z.object({
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  id: z.string().min(1),
  platform: z.enum([
    "evm-chain",
    "solana-chain",
    "sui-chain",
    "ronin-chain",
    "aptos-chain",
    "near-chain",
    "binance",
    "discord",
    "telegram",
    "twitter",
    "facebook",
    "email",
  ]),
  platform_identifier: z.string(),
  platform_metadata: z.object({ username: z.string() }).partial(),
  profile_id: z.string().min(1),
  total_amount: z.string(),
  pnl: z.string(),
});

const ApplicationSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  owner_profile_id: z.string().min(1),
  service_fee: z.number(),
});

const UserProfileSchema = z.object({
  id: z.string().min(1),
  associated_accounts: z.null().or(z.array(AssociatedAccountSchema)),
  profile_name: z.string(),
  avatar: z.string(),
  pnl: z.string(),
  type: z.literal("user"),
  application: z.null().or(z.undefined()),
});

const AppProfileSchema = z.object({
  id: z.string().min(1),
  associated_accounts: z.null().or(z.tuple([])),
  profile_name: z.string(),
  avatar: z.string(),
  pnl: z.string(),
  type: z.literal("application"),
  application: ApplicationSchema,
});

const VaultProfileSchema = z.object({
  id: z.string().min(1),
  associated_accounts: z.null(z.tuple([])),
  profile_name: z.string(),
  avatar: z.string(),
  pnl: z.string(),
  type: z.literal("vault"),
  application: z.null().or(z.undefined()),
});

export const ProfileSchema = z.discriminatedUnion("type", [
  UserProfileSchema,
  AppProfileSchema,
  VaultProfileSchema,
]);
export const ListProfileSchema = z.array(ProfileSchema);

export type Profile = z.infer<typeof ProfileSchema>;

export const LeaderboardSchema = z.object({
  top_sender: z.array(
    z.object({
      profile: UserProfileSchema.merge(
        z.object({
          associated_accounts: z
            .array(
              AssociatedAccountSchema.merge(
                z.object({
                  pnl: z.undefined(),
                  total_amount: z.undefined(),
                })
              )
            )
            .or(z.null()),
          pnl: z.undefined(),
          type: z.string(),
        })
      ),
      usd_amount: z.number().nonnegative(),
    })
  ),
  top_receiver: z.array(
    z.object({
      profile: UserProfileSchema.merge(
        z.object({
          associated_accounts: z
            .array(
              AssociatedAccountSchema.merge(
                z.object({
                  pnl: z.undefined(),
                  total_amount: z.undefined(),
                })
              )
            )
            .or(z.null()),
          pnl: z.undefined(),
          type: z.string(),
        })
      ),
      usd_amount: z.number().nonnegative(),
    })
  ),
});
export type Leaderboard = z.infer<typeof LeaderboardSchema>;

export const CodeSchema = z.object({
  code: z.string().min(1),
});

export type Code = z.infer<typeof CodeSchema>;

export const StatsSchema = z.object({
  time: z.string().datetime(),
  total_volume: z.number(),
  total_spending: z.number(),
  total_receive: z.number(),
  spending: z.array(
    z.object({
      token: TokenSchema,
      profile_id: z.string().min(1),
      amount: z.string().min(1),
      usd_amount: z.number(),
      price: z.number(),
    })
  ),
  receive: z.array(
    z.object({
      token: TokenSchema,
      profile_id: z.string().min(1),
      amount: z.string().min(1),
      usd_amount: z.number(),
      price: z.number(),
    })
  ),
  most_send: z.object({
    token: TokenSchema,
    profile_id: z.string().min(1),
    other_profile_id: z.string().min(1),
    amount: z.string().min(1),
    usd_amount: z.number(),
    price: z.number(),
  }),
  most_receive: z.object({
    token: TokenSchema,
    profile_id: z.string().min(1),
    other_profile_id: z.string().min(1),
    amount: z.string().min(1),
    usd_amount: z.number(),
    price: z.number(),
  }),
  history: ListOffchainTxSchema,
});

export type Stats = z.infer<typeof StatsSchema>;

export const AuthRequestSchema = z.object({
  url: z.string().min(1),
});

export type AuthRequest = z.infer<typeof AuthRequestSchema>;
