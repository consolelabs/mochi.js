import { z } from "zod";

const GasSchema = z.object({
  chain: z.string().nonempty(),
  safe_gas_price: z.string().nonempty(),
  propose_gas_price: z.string().nonempty(),
  fast_gas_price: z.string().nonempty(),
  est_safe_time: z.string().nonempty(),
  est_propose_time: z.string().nonempty(),
  est_fast_time: z.string().nonempty(),
});

export const ListGasSchema = z.array(GasSchema);

export type Gas = z.infer<typeof GasSchema>;
