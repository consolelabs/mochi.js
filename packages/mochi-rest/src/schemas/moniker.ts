import { z } from "zod";

const MonikerSchema = z.object({
  moniker: z.object({
    id: z.string(),
    moniker: z.string(),
    guild_id: z.string(),
    token_id: z.string(),
    token: z.object({
      id: z.string(),
      token_id: z.string(),
      token_name: z.string(),
      token_symbol: z.string(),
      token_price: z.number().nonnegative(),
      icon: z.string(),
      chain_id: z.string(),
    }),
    amount: z.number(),
  }),
  value: z.number(),
});

export const MonikersSchema = z.array(MonikerSchema);

export type Moniker = z.infer<typeof MonikerSchema>;
