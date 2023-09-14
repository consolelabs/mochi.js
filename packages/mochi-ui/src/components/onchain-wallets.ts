import address from "../address";
import { formatUsdDigit } from "../formatDigit";
import { Alignment, mdTable } from "../markdownTable";

type Wallet = {
  address: string;
  chain: string;
  // alias
  name?: string;
  amount?: number | string;
};

type Props = {
  wallets: Array<Wallet>;
  ignoreEmptyWallet?: boolean;
};

export default async function (
  { wallets, ignoreEmptyWallet = false }: Props,
  tableParams?: Parameters<typeof mdTable>[1]
) {
  let totalUsd = 0;
  const cols: (keyof Wallet)[] = ["chain", "address"];
  const alignment: Alignment[] = ["left", "left"];

  if (wallets.some((w) => w.name)) {
    cols.push("name");
    alignment.push("left");
  }

  const data = (
    await Promise.all(
      wallets
        .filter((w) => {
          return [
            "evm-chain",
            "solana-chain",
            "near-chain",
            "sui-chain",
            "ronin-chain",
            "aptos-chain",
            "near-chain",
          ].includes(w.chain);
        })
        .map((w) => ({ ...w, amount: Number(w.amount ?? 0) }))
        .sort((w1, w2) => w2.amount - w1.amount)
        .map(async (w) => {
          const addr = await address.normalizeAddress(w.address);
          const resolvedAddr = await address.lookup(addr, {
            shorten: false,
          });

          if (ignoreEmptyWallet && w.amount <= 0) {
            return null;
          }

          if (!Number.isNaN(w.amount)) {
            totalUsd += w.amount;
          }

          let chain = w.chain;
          if (chain.toLowerCase().endsWith("-chain")) {
            chain = chain.split("-").shift() ?? "";
            switch (true) {
              case chain.toLowerCase() === "solana":
                chain = "SOL";
                break;
              case chain.toLowerCase() === "ronin":
                chain = "RON";
                break;
              default:
                break;
            }
          }

          chain = chain.toUpperCase();

          return {
            ...w,
            chain,
            address:
              address.isShorten(resolvedAddr) ||
              addr !== resolvedAddr ||
              !address.isAddress(resolvedAddr).valid
                ? resolvedAddr
                : address.shorten(resolvedAddr),
            amount: formatUsdDigit(w.amount),
          };
        })
    )
  ).filter(Boolean) as Array<Wallet>;

  if (totalUsd > 0) {
    cols.push("amount");
  }

  const text = mdTable(data, {
    ...(tableParams ?? {}),
    alignment,
    cols,
  });

  return {
    text,
    totalUsd,
  };
}
