import { utils } from '..';
import { formatUsdDigit } from '../formatDigit';
import { mdTable } from '../markdownTable';
import { capitalCase } from 'change-case';

type Wallet = {
  // cex name
  name: string;
  address: string;
  amount: number | string;
};

type Props = {
  wallets: Array<Wallet>;
  ignoreEmptyWallet?: boolean;
};

export default async function (
  { wallets, ignoreEmptyWallet = true }: Props,
  tableParams?: Parameters<typeof mdTable>[1]
) {
  let totalUsd = 0;

  const data = wallets
    .filter((w) => {
      return ['binance'].includes(w.name);
    })
    .map((w) => {
      const amount = Number(w.amount);

      if (ignoreEmptyWallet && amount <= 0) {
        return null;
      }

      if (!Number.isNaN(amount)) {
        totalUsd += amount;
      }
      return {
        ...w,
        address:
          w.address.length > 20 ? utils.address.shorten(w.address) : w.address,
        name: capitalCase(w.name),
        amount: formatUsdDigit(w.amount),
      };
    })
    .filter(Boolean) as Array<Wallet>;

  const text = mdTable(data, {
    ...(tableParams ?? {}),
    cols: ['name', 'address', 'amount'],
  });

  return {
    text,
    totalUsd,
  };
}
