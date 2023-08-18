import { z } from "zod";

export const ChainSchema = z.object({
  id: z.string().uuid().nonempty(),
  chain_id: z.string().nonempty(),
  name: z.string().nonempty(),
  symbol: z.string().nonempty(),
  rpc: z.string(),
  explorer: z.string(),
  icon: z.string(),
  is_evm: z.boolean(),
});

export type Chain = z.infer<typeof ChainSchema>;

export const ChainsSchema = z.array(ChainSchema);

export const TokenSchema = z.object({
  id: z.string().uuid().nonempty(),
  name: z.string().nonempty(),
  symbol: z.string().nonempty(),
  decimal: z.number().nonnegative(),
  chain_id: z.string().nonempty(),
  native: z.boolean(),
  address: z.string().nonempty(),
  icon: z.string(),
  coin_gecko_id: z.string(),
  price: z.number(),
  chain: ChainSchema.or(z.null()),
});

export type Token = z.infer<typeof TokenSchema>;
export const TokensSchema = z.array(TokenSchema);

export const BalanceSchema = z.object({
  id: z.string().uuid().nonempty(),
  profile_id: z.string().nonempty(),
  token_id: z.string().uuid().nonempty(),
  amount: z.string().nonempty(),
  created_at: z.string().datetime().nonempty(),
  updated_at: z.string().datetime().nonempty(),
  token: TokenSchema,
});

export type Balance = z.infer<typeof BalanceSchema>;
export const BalancesSchema = z.array(BalanceSchema);

const MochiTxSchema = z.object({
  type: z.enum(["in", "out"]),
  created_at: z.string().datetime().nonempty(),
  internal_id: z.number(),
  external_id: z.string().nonempty(),
  from_profile_id: z.string().nonempty(),
  other_profile_id: z.string().nonempty(),
  from_profile_source: z.enum(["mochi-balance", "mochi-vault"]),
  other_profile_source: z.enum(["mochi-balance", "mochi-vault"]),
  source_platform: z.enum(["discord", "telegram"]),
  amount: z.string().nonempty(),
  token: TokenSchema,
});

export type BaseTx = z.infer<typeof MochiTxSchema>;

export const MochiTransferTxSchema = MochiTxSchema.extend({
  action: z.literal("transfer"),
});
export type TransferTx = z.infer<typeof MochiTransferTxSchema>;

export const MochiDepositTxSchema = MochiTxSchema.extend({
  action: z.literal("deposit"),
});
export type DepositTx = z.infer<typeof MochiDepositTxSchema>;

export const MochiWithdrawTxSchema = MochiTxSchema.extend({
  action: z.literal("withdraw"),
});
export type WithdrawTx = z.infer<typeof MochiWithdrawTxSchema>;

export const MochiAirdropTxSchema = MochiTxSchema.extend({
  action: z.literal("airdrop"),
  other_profile_ids: z.array(z.string()),
});
export type AirdropTx = z.infer<typeof MochiAirdropTxSchema>;

export const MochiSwapTxSchema = MochiTxSchema.extend({
  action: z.literal("swap"),
  amount: z.never(),
  token: z.never(),
  amount_in: z.string().nonempty(),
  amount_out: z.string().nonempty(),
  from_token: TokenSchema,
  to_token: TokenSchema,
});
export type SwapTx = z.infer<typeof MochiSwapTxSchema>;

export const MochiPayLinkTxSchema = MochiTxSchema.extend({
  action: z.literal("paylink"),
  metadata: z.object({
    paylink_code: z.string().nonempty(),
  }),
});
export type PayLinkTx = z.infer<typeof MochiPayLinkTxSchema>;

export const MochiPayMeTxSchema = MochiTxSchema.extend({
  action: z.literal("payme"),
  metadata: z.object({}),
});
export type PayMeTx = z.infer<typeof MochiPayMeTxSchema>;

export const MochiVaultTransferTx = MochiTxSchema.extend({
  action: z.literal("transfer"),
  metadata: z.object({
    vault_request: z.object({
      vault_id: z.number().nonnegative(),
    }),
  }),
});
export type VaultTransferTx = z.infer<typeof MochiVaultTransferTx>;

export const OnchainTxSchema = z.object({
  signed_at: z.string().nonempty(),
  has_transfer: z.boolean(),
  actions: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      amount: z.number(),
      unit: z.string(),
      native_transfer: z.boolean(),
    })
  ),
  scan_base_url: z.string(),
});
export type OnchainTx = z.infer<typeof OnchainTxSchema>;

export const OffchainTxSchema = z.union([
  MochiTransferTxSchema,
  MochiWithdrawTxSchema,
  MochiDepositTxSchema,
  MochiAirdropTxSchema,
  MochiSwapTxSchema,
  MochiPayLinkTxSchema,
  MochiPayMeTxSchema,
  MochiVaultTransferTx,
]);
export type OffchainTx = z.infer<typeof OffchainTxSchema>;

export const ListOffchainTxSchema = z.array(OffchainTxSchema);

export const TxSchema = z.union([OffchainTxSchema, OnchainTxSchema]);
export type Tx = z.infer<typeof TxSchema>;

export type WithdrawRequest = {
  address: string;
  profileId: string;
  amount: string;
  token: string;
  tokenId: string;
  tokenDecimal: number;
  chainId: string;
  platform: "telegram" | "discord";
  platform_user_id: string;
  amount_string: string;
};

export const DepositInfoSchema = z.object({
  contract: z.object({
    address: z.string().nonempty(),
    chain: ChainSchema,
  }),
});

export type DepositInfo = z.infer<typeof DepositInfoSchema>;

const TransferRequestSchema = z.object({
  sender: z.string().nonempty(),
  recipients: z.array(z.string().nonempty()),
  amount: z.number().nonnegative(),
  amount_string: z.string().nonempty(),
  token: z.string().nonempty(),
  token_price: z.number(),
  each: z.boolean(),
  all: z.boolean(),
  transfer_type: z.enum(["transfer", "airdrop"]),
  chain_id: z.string().nonempty(),
  decimal: z.number(),
  platform: z.enum(["telegram", "discord"]),
});

export type TransferRequest = z.infer<typeof TransferRequestSchema>;

export const TransferResultSchema = z.object({
  amount_each: z.number(),
  external_id: z.string().nonempty(),
});

export type TransferResult = z.infer<typeof TransferResultSchema>;
