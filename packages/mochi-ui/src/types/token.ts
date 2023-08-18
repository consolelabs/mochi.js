import { Chain } from './chain';

export type Token = {
  id: string;
  name: string;
  symbol: string;
  decimal: number;
  chain_id: string;
  native: boolean;
  address: string;
  icon: string;
  coin_gecko_id: string;
  price: number;
  chain: Chain | null;
};
