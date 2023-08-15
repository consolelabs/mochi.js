import { z } from "zod";

const QueryCoinSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  current_price: z.number(),
  most_popular: z.boolean(),
  is_native: z.boolean(),
  is_popular: z.boolean(),
  is_not_supported: z.boolean(),
});

export const ListQueryCoinSchema = z.array(QueryCoinSchema);

export type QueryCoin = z.infer<typeof QueryCoinSchema>;

const PriceByCurrency = z.object({
  usd: z.number(),
});

export const CoinSchema = z.object({
  id: z.string(),
  name: z.string(),
  market_cap_rank: z.number(),
  asset_platform: z
    .object({
      name: z.string(),
      short_name: z.string(),
    })
    .or(z.null()),
  market_data: z.object({
    market_cap: PriceByCurrency,
    total_market_cap: PriceByCurrency.or(z.null()),
    current_price: PriceByCurrency,
    price_change_percentage_1h_in_currency: PriceByCurrency,
    price_change_percentage_24h_in_currency: PriceByCurrency,
    price_change_percentage_7d_in_currency: PriceByCurrency,
  }),
});

export type Coin = z.infer<typeof CoinSchema>;

export const CoinChartDataSchema = z.object({
  prices: z.array(z.number()),
  times: z.array(z.string().nonempty()),
  from: z.string().nonempty(),
  to: z.string().nonempty(),
});

export type CoinChartData = z.infer<typeof CoinChartDataSchema>;

const GainerLoser = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
  symbol: z.string().nonempty(),
  image: z.string(),
  market_cap_rank: z.number(),
  usd: z.number(),
  usd_24h_vol: z.number(),
  usd_24h_change: z.number(),
  usd_7d_change: z.number(),
  usd_1h_change: z.number(),
  usd_14d_change: z.number(),
  usd_30d_change: z.number(),
  usd_60d_change: z.number(),
  usd_1y_change: z.number(),
});

export const TopGainerLoserSchema = z.object({
  top_gainers: z.array(GainerLoser),
  top_losers: z.array(GainerLoser),
});

export type TopGainerLoser = z.infer<typeof TopGainerLoserSchema>;
