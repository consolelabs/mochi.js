import { z } from "zod";

export const ChainSchema = z.object({
  id: z.string().uuid(),
  chain_id: z.string().min(1),
  name: z.string().min(1),
  short_name: z.string().optional(),
  symbol: z.string().min(1),
  rpc: z.string(),
  explorer: z.string(),
  icon: z.string(),
  type: z.enum(["evm", "solana", "ton", "bitcoin", "ronin"]),
});

export type Chain = z.infer<typeof ChainSchema>;

export const ChainsSchema = z.array(ChainSchema);

export const TokenSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  symbol: z.string(),
  decimal: z.number().nonnegative(),
  chain_id: z.string(),
  native: z.boolean(),
  address: z.string(),
  icon: z.string(),
  coin_gecko_id: z.string(),
  price: z.number(),
  chain: ChainSchema.or(z.null()),
});
export const SimplifiedTokenSchema = z.object({
  address: z.string().min(1),
  symbol: z.string().min(1),
});
export type SimplifiedToken = z.infer<typeof SimplifiedTokenSchema>;
export const SimplifiedTokensSchema = z.array(SimplifiedTokenSchema);

export type Token = z.infer<typeof TokenSchema>;
export const TokensSchema = z.array(TokenSchema);

export const BalanceSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().min(1),
  token_id: z.string().uuid(),
  amount: z.string().min(1),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  token: TokenSchema,
});

export type Balance = z.infer<typeof BalanceSchema>;
export const BalancesSchema = z.array(BalanceSchema);

const MochiTxSchema = z.object({
  type: z.enum(["in", "out"]),
  created_at: z.string().datetime().min(1),
  internal_id: z.number(),
  external_id: z.string().min(1),
  from_profile_id: z.string().min(1),
  other_profile_id: z.string().min(1),
  status: z.string().min(1),
  from_profile_source: z
    .enum(["mochi-balance", "mochi-vault"])
    .or(z.string().min(1)),
  other_profile_source: z
    .enum(["mochi-balance", "mochi-vault"])
    .or(z.string().min(1)),
  source_platform: z.enum(["discord", "telegram", "web", ""]),
  amount: z.string().min(1),
  token: TokenSchema,
});

export type BaseTx = z.infer<typeof MochiTxSchema>;

type MochiTransferTx = z.infer<typeof MochiTxSchema> & {
  action: "transfer";
  sibling_txs: MochiTransferTx[] | null;
};

export const MochiTransferTxSchema: z.ZodType<MochiTransferTx> =
  MochiTxSchema.extend({
    action: z.literal("transfer"),
    sibling_txs: z.lazy(() => MochiTransferTxSchema.array().nullable()),
  });

export type TransferTx = z.infer<typeof MochiTransferTxSchema>;

export const MochiDepositTxSchema = MochiTxSchema.extend({
  action: z.literal("deposit"),
});
export type DepositTx = z.infer<typeof MochiDepositTxSchema>;

export const MochiWithdrawTxSchema = MochiTxSchema.extend({
  action: z.literal("withdraw"),
  other_profile_id: z.literal(""),
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
  amount_in: z.string().min(1),
  amount_out: z.string().min(1),
  from_token: TokenSchema,
  to_token: TokenSchema,
});
export type SwapTx = z.infer<typeof MochiSwapTxSchema>;

export const MochiPayLinkTxSchema = MochiTxSchema.extend({
  action: z.literal("paylink"),
  metadata: z.object({
    code: z.string().min(1),
  }),
  other_profile_id: z.string(),
  other_profile_source: z.enum(["mochi-balance", "mochi-vault"]).or(z.string()),
  status: z.enum(["success", "failed", "pending", "expired"]),
});
export type PayLinkTx = z.infer<typeof MochiPayLinkTxSchema>;

export const MochiPayMeTxSchema = MochiTxSchema.extend({
  action: z.literal("payme"),
  metadata: z.object({}),
  other_profile_id: z.string(),
  other_profile_source: z.enum(["mochi-balance", "mochi-vault"]).or(z.string()),
  status: z.enum(["success", "failed", "pending", "expired"]),
});
export type PayMeTx = z.infer<typeof MochiPayMeTxSchema>;

export const MochiVaultTransferTxSchema = MochiTxSchema.extend({
  action: z.literal("vault_transfer"),
  metadata: z.object({
    vault_request: z.object({
      vault_id: z.number().nonnegative(),
    }),
  }),
});
export type VaultTransferTx = z.infer<typeof MochiVaultTransferTxSchema>;

export const OnchainTxSchema = z.object({
  signed_at: z.string().min(1),
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
  MochiVaultTransferTxSchema,
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
    address: z.string().min(1),
    chain: ChainSchema,
  }),
});

export type DepositInfo = z.infer<typeof DepositInfoSchema>;

const TransferRequestSchema = z.object({
  sender: z.string().min(1),
  recipients: z.array(z.string().min(1)),
  amount: z.number().nonnegative(),
  token: z.string().min(1),
  transfer_type: z.enum(["transfer", "airdrop"]),
  platform: z.enum(["telegram", "discord", "web"]),
  chain_id: z.string().min(1),

  //
  amount_string: z.string().min(1).optional(),
  token_price: z.number().optional(),
  each: z.boolean().optional(),
  all: z.boolean().optional(),
  decimal: z.number().optional(),
});

export type TransferRequest = z.infer<typeof TransferRequestSchema>;

export const TransferResultSchema = z.object({
  amount_each: z.number(),
  external_id: z.string().min(1),
});

export type TransferResult = z.infer<typeof TransferResultSchema>;

export enum SwapRouteDataCode {
  NoRoute = 0,
  RouteDataFound,
  HighPriceImpact,
  ProviderError,
}

export const RouteSchema = z.array(
  z.array(
    z.object({
      pool: z.string().min(1),
      tokenIn: z.string().min(1),
      tokenOut: z.string().min(1),
      tokenOutSymbol: z.string().min(1),
      limitReturnAmount: z.string(),
      swapAmount: z.string(),
      amountOut: z.string().min(1),
      exchange: z.string(),
      poolLength: z.number(),
      poolType: z.string(),
    })
  )
);

const RouteSummarySchema = z.object({
  route: RouteSchema,
  amountIn: z.string(),
  amountOut: z.string(),
});

export type RouteSummary = z.infer<typeof RouteSummarySchema>;

export type Route = z.infer<typeof RouteSchema>;

export const SwapRouteSchema = z.object({
  code: z.nativeEnum(SwapRouteDataCode),
  message: z.string(),
  chainName: z.string().min(1),
  provider: z.string().min(1),
  data: z.object({
    tokenIn: z.object({
      id: z.number().nonnegative(),
      address: z.string().min(1),
      chain_id: z.number(),
      decimals: z.number().nonnegative(),
      symbol: z.string().min(1),
      name: z.string(),
      coingecko_id: z.string().min(1),
      created_at: z.string().datetime(),
      updated_at: z.string().datetime(),
    }),
    tokenOut: z.object({
      id: z.number().nonnegative(),
      address: z.string().min(1),
      chain_id: z.number(),
      decimals: z.number().nonnegative(),
      symbol: z.string().min(1),
      name: z.string(),
      coingecko_id: z.string().min(1),
      created_at: z.string().datetime(),
      updated_at: z.string().datetime(),
    }),
    routerAddress: z.string().min(1),
    routeSummary: RouteSummarySchema,
  }),
});

export type SwapRoute = z.infer<typeof SwapRouteSchema>;
