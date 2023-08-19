import { z } from "zod";

const MonikerSchema = z.object({
  moniker: z.object({
    id: z.string().nonempty(),
    moniker: z.string().nonempty(),
    guild_id: z.string(),
    token_id: z.string().nonempty(),
    token: z.object({
      id: z.string().nonempty(),
      token_id: z.string().nonempty(),
      token_name: z.string().nonempty(),
      token_symbol: z.string().nonempty(),
      icon: z.string(),
    }),
    amount: z.number(),
  }),
  value: z.number(),
});

export const MonikersSchema = z.array(MonikerSchema);

export type Moniker = z.infer<typeof MonikerSchema>;
