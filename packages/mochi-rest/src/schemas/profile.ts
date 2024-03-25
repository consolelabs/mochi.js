import { z } from "zod";

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
    "github",
    "email",
  ]),
  platform_identifier: z.string(),
  platform_metadata: z
    .object({ ens: z.string(), sns: z.string(), username: z.string() })
    .partial(),
  profile_id: z.string().min(1),
  total_amount: z.string().optional(),
  pnl: z.string().optional(),
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
  pnl: z.string().optional(),
  type: z.literal("user"),
  application: z.null().or(z.undefined()),
});

const AppProfileSchema = z.object({
  id: z.string().min(1),
  associated_accounts: z.null().or(z.tuple([])),
  profile_name: z.string(),
  avatar: z.string(),
  pnl: z.string().optional(),
  type: z.literal("application"),
  application: ApplicationSchema,
});

const VaultProfileSchema = z.object({
  id: z.string().min(1),
  associated_accounts: z.null(z.tuple([])),
  profile_name: z.string(),
  avatar: z.string(),
  pnl: z.string().optional(),
  type: z.literal("vault"),
  application: z.null().or(z.undefined()),
});

const AppVaultProfileSchema = z.object({
  id: z.string().min(1),
  associated_accounts: z.null(z.tuple([])),
  profile_name: z.string(),
  avatar: z.string(),
  pnl: z.string().optional(),
  type: z.literal("application_vault"),
  application: z.null().or(z.undefined()),
  application_vault: z.object({
    name: z.string(),
    application: ApplicationSchema,
  }),
});

export const ProfileSchema = z.discriminatedUnion("type", [
  UserProfileSchema,
  AppProfileSchema,
  VaultProfileSchema,
  AppVaultProfileSchema,
]);
export const ListProfileSchema = z.array(ProfileSchema);

export type Profile = z.infer<typeof ProfileSchema>;

export type AssociatedAccount = z.infer<typeof AssociatedAccountSchema>;

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

export const AuthRequestSchema = z.object({
  url: z.string().min(1),
});

export type AuthRequest = z.infer<typeof AuthRequestSchema>;
