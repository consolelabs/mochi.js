import address from '../address';
import { mdTable } from '../markdownTable';

type Wallet = {
  address: string;
  chain: string;
};

type Props = {
  wallets: Array<Wallet>;
  shortenAddress?: boolean;
};

export default async function (
  { shortenAddress = true, wallets }: Props,
  tableParams?: Parameters<typeof mdTable>[1]
) {
  const data = await Promise.all(
    wallets.map(async (w) => {
      let addr = await address.normalizeAddress(w.address);

      return {
        ...w,
        chain: w.chain.toUpperCase(),
        address: shortenAddress
          ? address.isShorten(addr)
            ? addr
            : address.shorten(addr)
          : addr,
      };
    })
  );

  const text = mdTable(data, {
    ...(tableParams ?? {}),
    cols: ['chain', 'address'],
    alignment: ['left', 'left'],
  });

  return {
    text,
  };
}
