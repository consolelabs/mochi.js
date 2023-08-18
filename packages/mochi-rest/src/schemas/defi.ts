import { z } from 'zod';

export const ChainSchema = z.object({
  id: z.string().uuid(),
  chain_id: z.string(),
  name: z.string(),
  symbol: z.string(),
  rpc: z.string(),
  explorer: z.string(),
  icon: z.string(),
  is_evm: z.boolean(),
});

export type Chain = z.infer<typeof ChainSchema>;

export const ChainsSchema = z.array(ChainSchema);

export const TokenSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  symbol: z.string(),
  decimal: z.number(),
  chain_id: z.string(),
  native: z.boolean(),
  address: z.string(),
  icon: z.string(),
  coin_gecko_id: z.string(),
  price: z.number(),
  chain: z.nullable(ChainSchema),
});

export type Token = z.infer<typeof TokenSchema>;
export const TokensSchema = z.array(TokenSchema);

export const BalanceSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string(),
  token_id: z.string().uuid(),
  amount: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  token: TokenSchema,
});

export type Balance = z.infer<typeof BalanceSchema>;
export const BalancesSchema = z.array(BalanceSchema);

const MochiTxSchema = z.object({
  type: z.enum(['in', 'out']),
  created_at: z.string().datetime(),
  internal_id: z.number(),
  external_id: z.string(),
  from_profile_id: z.string().nonempty(),
  other_profile_id: z.string().nonempty(),
  from_profile_source: z.enum(['mochi-balance']),
  other_profile_source: z.enum(['mochi-balance']),
  source_platform: z.enum(['discord', 'telegram']),
});

export const MochiTransferTxSchema = MochiTxSchema.extend({
  action: z.literal('transfer'),
  amount: z.string(),
  token: TokenSchema,
});

export const MochiDepositTxSchema = MochiTxSchema.extend({
  action: z.literal('deposit'),
  amount: z.string(),
  token: TokenSchema,
});

export const MochiWithdrawTxSchema = MochiTxSchema.extend({
  action: z.literal('withdraw'),
  amount: z.string(),
  token: TokenSchema,
});

export const MochiAirdropTxSchema = MochiTxSchema.extend({
  action: z.literal('airdrop'),
  amount: z.string(),
  token: TokenSchema,
  other_profile_ids: z.array(z.string()),
});

export const MochiSwapTxSchema = MochiTxSchema.extend({
  action: z.literal('swap'),
  amount_in: z.string(),
  amount_out: z.string(),
  from_token: TokenSchema,
  to_token: TokenSchema,
});

export const MochiPayLinkTxSchema = MochiTxSchema.extend({
  action: z.literal('paylink'),
  metadata: z.object({
    paylink_code: z.string(),
  }),
  amount: z.string(),
  token: TokenSchema,
});

export const MochiPayMeTxSchema = MochiTxSchema.extend({
  action: z.literal('payme'),
  metadata: z.object({}),
  amount: z.string(),
  token: TokenSchema,
});

export const OnchainTxSchema = z.object({
  signed_at: z.string(),
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

export const OffchainTxSchema = z.union([
  MochiTransferTxSchema,
  MochiWithdrawTxSchema,
  MochiDepositTxSchema,
  MochiAirdropTxSchema,
  MochiSwapTxSchema,
  MochiPayLinkTxSchema,
  MochiPayMeTxSchema,
]);

export type OffchainTx = z.infer<typeof OffchainTxSchema>;

export const ListOffchainTxSchema = z.array(OffchainTxSchema);

export const TxSchema = z.union([OffchainTxSchema, OnchainTxSchema]);

export type WithdrawRequest = {
  address: string;
  profileId: string;
  amount: string;
  token: string;
  tokenId: string;
  tokenDecimal: number;
  chainId: string;
  platform: 'telegram' | 'discord';
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
  sender: z.string(),
  recipients: z.array(z.string()),
  amount: z.number(),
  amount_string: z.string(),
  token: z.string(),
  token_price: z.number(),
  each: z.boolean(),
  all: z.boolean(),
  transfer_type: z.enum(['transfer', 'airdrop']),
  chain_id: z.string(),
  decimal: z.number(),
  platform: z.enum(['telegram', 'discord']),
});

export type TransferRequest = z.infer<typeof TransferRequestSchema>;

export const TransferResultSchema = z.object({
  amount_each: z.number(),
  external_id: z.string(),
});

export type TransferResult = z.infer<typeof TransferResultSchema>;
