export enum ChartViewTimeOption {
  D1 = 1,
  W1 = 7,
  M1 = 30,
  D60 = 60,
  D90 = 90,
  Y1 = 365,
}

export enum DominanceChartViewTimeOption {
  Y1 = 365,
  Y2 = 730,
  Y3 = 1095,
}

export enum ChartType {
  Single = "single",
  Pair = "pair",
  Dominance = "dominance",
}

export type TickerCommandContext = {
  days: ChartViewTimeOption | DominanceChartViewTimeOption;
  type: ChartType;
  baseCoin: any;
  targetCoin?: any;
  // baseCoin: Coin;
  // targetCoin?: Coin;
};
