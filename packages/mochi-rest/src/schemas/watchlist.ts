import { z } from "zod";

const WatchlistTokenDataSchema = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
  symbol: z.string().nonempty(),
  current_price: z.number().nonnegative(),
  image: z.string(),
  market_cap: z.number().nonnegative(),
  market_cap_rank: z.number(),
  sparkline_in_7d: z.object({
    price: z.array(z.number()),
  }),
  price_change_percentage_24h: z.number(),
  price_change_percentage_7d_in_currency: z.number(),
  price_change_percentage_1h_in_currency: z.number(),
  price_change_percentage_24h_in_currency: z.number(),
  is_pair: z.boolean(),
  is_default: z.boolean(),
});

export const WatchlistTokenDataListSchema = z.array(WatchlistTokenDataSchema);
export type WatchlistTokenData = z.infer<typeof WatchlistTokenDataSchema>;
