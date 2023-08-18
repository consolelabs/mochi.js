import { z } from 'zod';

export const VaultSchema = z.object({
  id: z.number(),
  guild_id: z.string().nonempty(),
  name: z.string().nonempty(),
  threshold: z.string().nonempty(),
  wallet_address: z.string().nonempty(),
  solana_wallet_address: z.string().nonempty(),
  wallet_number: z.number(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  vault_treasurers: z.null(),
  total_amount_evm: z.string(),
  total_amount_solana: z.string(),
});

export type Vault = z.infer<typeof VaultSchema>;
