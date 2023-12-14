import { toBigInt } from "ethers";
import { RouteSummary } from "@consolelabs/mochi-rest";

const blank = " " as const;
const line = "│" as const;
const lineRight = "└" as const;
const lineRightBranch = "├" as const;

type Pool = {
  address: string;
  name: string;
  swapAmount: bigint;
  percent: string;
};

type Hop = {
  tokenIn: string;
  tokenOut: string;
  tokenOutSymbol: string;
  amountOut: bigint;
  pools: Array<Pool>;
};

type AggregatedRoute = {
  percent: string;
  swapAmount: bigint;
  hops: Array<Hop>;
};

type AggregatedTradeRoute = Record<string, AggregatedRoute>;

// function to parse route data from kyberswap to our format for easier display
function parseTradeRoute(routeSummary: RouteSummary) {
  const data: AggregatedTradeRoute = {};

  routeSummary.route.forEach((hops) => {
    const key = hops
      .map((r) => `${r.tokenIn}-${r.tokenOut}`)
      .reduce((acc, c) => {
        if (!acc) return c;
        const [tokenIn] = c.split("-");
        return acc.replace(tokenIn, c);
      }, "");

    const route = data[key] ?? {
      swapAmount: toBigInt(0),
      hops: [],
    };

    hops.forEach((hop, i) => {
      const routeHop = route.hops.find(
        (h) => h.tokenIn === hop.tokenIn && h.tokenOut === hop.tokenOut
      );

      if (i === 0) {
        route.swapAmount += toBigInt(hop.swapAmount);
      }

      if (!routeHop) {
        route.hops.push({
          tokenIn: hop.tokenIn,
          tokenOut: hop.tokenOut,
          tokenOutSymbol: hop.tokenOutSymbol,
          amountOut: toBigInt(hop.amountOut),
          pools: [
            {
              name: hop.exchange,
              address: hop.pool,
              swapAmount: toBigInt(hop.swapAmount),
              percent: "",
            },
          ],
        });
        return;
      }

      routeHop.amountOut += toBigInt(hop.amountOut);

      const pool = routeHop.pools.find((p) => p.address === hop.pool);

      if (!pool) {
        routeHop.pools.push({
          name: hop.exchange,
          address: hop.pool,
          swapAmount: toBigInt(hop.swapAmount),
          percent: "",
        });
        return;
      }

      pool.swapAmount += toBigInt(hop.swapAmount);
    });

    data[key] = route;
  });

  return {
    data,
    totalAmountIn: toBigInt(routeSummary.amountIn),
  };
}

// calculate the percentage of each pool in a hop in a route
function calculatePercentage({
  data,
  totalAmountIn,
}: {
  data: AggregatedTradeRoute;
  totalAmountIn: bigint;
}) {
  Object.values(data).forEach((d) => {
    d.percent = `${(d.swapAmount * toBigInt(100)) / totalAmountIn}%`;

    d.hops.forEach((hop, i) => {
      const previousHop = d.hops[i - 1]?.amountOut ?? d.swapAmount;

      let subtotal = toBigInt(0);
      hop.pools.forEach((p, i) => {
        if (i === hop.pools.length - 1) {
          p.percent = `${toBigInt(100) - subtotal}%`;
        } else {
          const num = Math.round(
            Number(((p.swapAmount * toBigInt(1000)) / previousHop).toString()) /
              10
          );
          subtotal += toBigInt(num);
          p.percent = `${num}%`;
        }
      });
    });
  });

  return data;
}

function format(tokenIn: string) {
  return function (routes: AggregatedTradeRoute) {
    const routeCount = Object.values(routes).length;

    const tradeRoutes = Object.values(routes).map((route, i) => {
      const lastRoute = i === Object.values(routes).length - 1;
      return `${i === 0 ? "" : "\n"}${line}${
        route.percent
      } ${tokenIn}\n${route.hops
        .map((hop, j) => {
          const lastHop = j === route.hops.length - 1;

          return `${
            lastRoute && j === 0
              ? lineRight
              : lastRoute && j !== 0
              ? blank
              : lineRightBranch
          }${hop.tokenOutSymbol}\n${hop.pools
            .map((p, o) => {
              return `${lastRoute ? blank : line} ${
                o === hop.pools.length - 1 && lastHop
                  ? lineRight
                  : lineRightBranch
              }\\(${p.name ? `${p.name}: ` : ""}${p.percent}\\)`;
            })
            .join("\n")}`;
        })
        .join("\n")}`;
    });

    const aggregatedRoutes = [];
    for (let i = 0; i < tradeRoutes.length; i++) {
      const current = tradeRoutes[i];
      const next = tradeRoutes[i + 1] ?? "";
      const combined = !next ? current : `${current}\n${line}${next}`;
      if (combined.length <= 1024) {
        aggregatedRoutes.push(combined);
        i++;
        continue;
      }

      if (i === tradeRoutes.length - 1 || (tradeRoutes.length === 2 && i === 0))
        aggregatedRoutes.push(tradeRoutes[i]);
    }

    return { text: aggregatedRoutes, routeCount };
  };
}

export const SWAP_ROUTE_PROVIDERS = {
  "kyber-swap": {
    name: "KyberSwap",
    url: "https://kyberswap.com",
  },
  jupyter: {
    name: "Jupiter",
    url: "https://jup.ag/",
  },
} as const;

function aggregateTradeRoute(
  tokenIn: string,
  routeSummary: RouteSummary,
  provider: keyof typeof SWAP_ROUTE_PROVIDERS
) {
  const routes = parseTradeRoute(routeSummary);
  const routesWithPercentage = calculatePercentage(routes);
  const result = format(tokenIn)(routesWithPercentage);

  return {
    ...result,
    provider,
  };
}

type Props = {
  tokenIn: string;
  routeSummary: RouteSummary;
  provider: "jupyter" | "kyber-swap";
};

export default async function ({ tokenIn, routeSummary, provider }: Props) {
  const { routeCount, text } = aggregateTradeRoute(
    tokenIn,
    routeSummary,
    provider
  );
  const lines = [];

  lines.push(`🔃 Routing through \`${routeCount}\` routes`);
  lines.push(`\`\`\`${line}\n${line}\n${text}\`\`\``);

  return {
    text: lines.join("\n"),
  };
}
