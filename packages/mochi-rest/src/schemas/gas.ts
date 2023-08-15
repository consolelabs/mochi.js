import { z } from "zod";

const GasSchema = z.object({
  chain: z.string(),
  safe_gas_price: z.string(),
  propose_gas_price: z.string(),
  fast_gas_price: z.string(),
  est_safe_time: z.string(),
  est_propose_time: z.string(),
  est_fast_time: z.string(),
});

export const ListGasSchema = z.array(GasSchema);

export type Gas = z.infer<typeof GasSchema>;
