import { z } from "zod";
import { ListOffchainTxSchema, TokenSchema } from "./defi";

const AssociatedAccountSchema = z.object({
  created_at: z.string().datetime().nonempty(),
  updated_at: z.string().datetime().nonempty(),
  id: z.string().nonempty(),
  platform: z.enum([
    "evm-chain",
    "solana-chain",
    "sui-chain",
    "ronin-chain",
    "discord",
    "telegram",
    "twitter",
    "binance",
  ]),
  platform_identifier: z.string(),
  platform_metadata: z.object({ username: z.string() }).partial(),
  profile_id: z.string().nonempty(),
  total_amount: z.string(),
  pnl: z.string(),
});

const ApplicationSchema = z.object({
  id: z.number(),
  name: z.string().nonempty(),
  owner_profile_id: z.string().nonempty(),
  service_fee: z.number(),
});

const UserProfileSchema = z.object({
  id: z.string().nonempty(),
  associated_accounts: z.array(AssociatedAccountSchema),
  profile_name: z.string(),
  avatar: z.string(),
  pnl: z.string(),
  type: z.literal("user"),
  application: z.null(),
});

const AppProfileSchema = z.object({
  id: z.string().nonempty(),
  associated_accounts: z.null().or(z.tuple([])),
  profile_name: z.string(),
  avatar: z.string(),
  pnl: z.string(),
  type: z.literal("application"),
  application: ApplicationSchema,
});

const VaultProfileSchema = z.object({
  id: z.string().nonempty(),
  associated_accounts: z.null(z.tuple([])),
  profile_name: z.string(),
  avatar: z.string(),
  pnl: z.string(),
  type: z.literal("vault"),
  application: z.null(),
});

export const ProfileSchema = z.discriminatedUnion("type", [
  UserProfileSchema,
  AppProfileSchema,
  VaultProfileSchema,
]);

export type Profile = z.infer<typeof ProfileSchema>;

export const LeaderboardSchema = z.object({
  top_sender: z.array(UserProfileSchema),
  top_receiver: z.array(UserProfileSchema),
});
export type Leaderboard = z.infer<typeof LeaderboardSchema>;

export const CodeSchema = z.object({
  code: z.string().nonempty(),
});

export type Code = z.infer<typeof CodeSchema>;

export const StatsSchema = z.object({
  time: z.string().datetime().nonempty(),
  total_volume: z.number(),
  total_spending: z.number(),
  total_receive: z.number(),
  spending: z.array(
    z.object({
      token: TokenSchema,
      profile_id: z.string().nonempty(),
      amount: z.string().nonempty(),
      usd_amount: z.number(),
      price: z.number(),
    })
  ),
  receive: z.array(
    z.object({
      token: TokenSchema,
      profile_id: z.string().nonempty(),
      amount: z.string().nonempty(),
      usd_amount: z.number(),
      price: z.number(),
    })
  ),
  most_send: z.object({
    token: TokenSchema,
    profile_id: z.string().nonempty(),
    amount: z.string().nonempty(),
    usd_amount: z.number(),
    price: z.number(),
  }),
  most_receive: z.object({
    token: TokenSchema,
    profile_id: z.string().nonempty(),
    amount: z.string().nonempty(),
    usd_amount: z.number(),
    price: z.number(),
  }),
  history: ListOffchainTxSchema,
});

export type Stats = z.infer<typeof StatsSchema>;

export const AuthRequestSchema = z.object({
  url: z.string().nonempty(),
});

export type AuthRequest = z.infer<typeof AuthRequestSchema>;
