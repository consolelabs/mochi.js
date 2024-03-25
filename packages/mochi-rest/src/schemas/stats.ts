import { z } from "zod";
import { ListOffchainTxSchema, TokenSchema } from "./defi";

export const StatsSchema = z.object({
  time: z.string().datetime(),
  total_volume: z.number(),
  total_spending: z.number(),
  total_receive: z.number(),
  spending: z.array(
    z.object({
      token: TokenSchema,
      profile_id: z.string().min(1),
      amount: z.string().min(1),
      usd_amount: z.number(),
      price: z.number(),
    })
  ),
  receive: z.array(
    z.object({
      token: TokenSchema,
      profile_id: z.string().min(1),
      amount: z.string().min(1),
      usd_amount: z.number(),
      price: z.number(),
    })
  ),
  most_send: z.object({
    token: TokenSchema,
    profile_id: z.string().min(1),
    other_profile_id: z.string().min(1),
    amount: z.string().min(1),
    usd_amount: z.number(),
    price: z.number(),
  }),
  most_receive: z.object({
    token: TokenSchema,
    profile_id: z.string().min(1),
    other_profile_id: z.string().min(1),
    amount: z.string().min(1),
    usd_amount: z.number(),
    price: z.number(),
  }),
  history: ListOffchainTxSchema,
});

export type Stats = z.infer<typeof StatsSchema>;
