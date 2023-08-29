import { APPROX, MIN_DUST_USD, PageSize } from "../constant";
import { formatTokenDigit, formatUsdDigit } from "../formatDigit";
import { mdTable } from "../markdownTable";
import { formatUnits } from "ethers";
import pageIndicator from "./page-indicator";
import type { Paging } from "../types";
import chunk from "lodash.chunk";
import { UI } from "../ui";

type Balance = {
  token: {
    name: string;
    symbol?: string;
    decimal: number;
    price: number;
    address: string;
    chain: { short_name?: string; name?: string; symbol?: string };
    native: boolean;
  };
  amount: string;
};

type Props = {
  filterDust?: boolean;
  /**
   * Pass the UN-paginated data because this components need full data to calculate total usd amount
   */
  balances: Array<Balance>;
};

export default async function (
  {
    balances,
    page = 0,
    total = 1,
    size = PageSize.Large,
    filterDust = true,
  }: Props & Paging,
  tableParams?: Parameters<typeof mdTable>[1]
) {
  let totalUsd = 0;
  const isDuplicateSymbol = (s: string) =>
    balances.filter((b: any) => b.token.symbol.toUpperCase() === s).length > 1;
  const data = balances
    .map((balance) => {
      const { token, amount } = balance;
      const {
        symbol = "",
        chain: _chain,
        decimal,
        price,
        native,
        address,
      } = token;
      const tokenVal = +formatUnits(amount, decimal);
      const usdVal = price * tokenVal;
      const value = formatTokenDigit(tokenVal.toString());
      const usdWorth = formatUsdDigit(usdVal.toString());
      let chain = _chain?.symbol || _chain?.short_name || _chain?.name || "";
      chain = chain.toLowerCase();
      if (
        (tokenVal === 0 || (filterDust && usdVal <= MIN_DUST_USD)) &&
        !UI.api.isTokenWhitelisted(symbol, address)
      )
        return {
          text: "",
          usdVal: 0,
          usdWorth: 0,
          chain,
        };

      const text = `${value} ${symbol}`;
      totalUsd += usdVal;

      return {
        text,
        usdWorth,
        usdVal,
        ...(chain && !native && isDuplicateSymbol(symbol.toUpperCase())
          ? { chain }
          : {}),
      };
    })
    .sort((a, b) => {
      return b.usdVal - a.usdVal;
    })
    .filter((b) => b.text);
  const chunks = chunk(data, size);
  let text = mdTable(
    chunks[page]?.map((b) => ({
      balance: `${b.text}${b.chain ? ` (${b.chain})` : ""}`,
      usd: `${b.usdWorth}`,
    })),
    {
      ...(tableParams ?? {}),
      cols: ["balance", "usd"],
      separator: [` ${APPROX} `],
    }
  );
  const { text: pager } = await pageIndicator({
    page,
    totalPage: total,
  });
  if (!text) {
    text = "There is no token, yet 🙁";
  }
  return {
    text: [text, "", pager].join("\n"),
    totalUsd,
    totalPage: total,
  };
}
