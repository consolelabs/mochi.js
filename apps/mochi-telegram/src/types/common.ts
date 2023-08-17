export type Pagination = {
  page: number;
  size: number;
  total: number;
};
export type Change = {
  key: string;
  value: string;
};

export type ActivityLog = {
  id?: string;
  type?: number;
  user_profile_id?: string;
  target_profile_id?: string;
  content?: string;
  content_raw?: string;
  changes?: Change[];
  status?: string;
  created_at?: string;
  updated_at?: string;
};

export interface ResponseChainGasTrackerResponseData {
  data?: ResponseGasTrackerResponse[];
}

export interface ResponseGasTrackerResponse {
  chain?: string;
  est_fast_time?: string;
  est_propose_time?: string;
  est_safe_time?: string;
  fast_gas_price?: string;
  propose_gas_price?: string;
  safe_gas_price?: string;
}

export interface ResponseGetWalletAssetResponseData {
  pnl: string;
  latest_snapshot_bal: string;
  balance?: ResponseOffchainBalance[];
  staking?: ResponseStaking[];
  farming?: ResponseFarming[];
  nfts?: ResponseNft[];
}

export interface ResponseOffchainBalance {
  chain_id: number;
  contract_name: string;
  contract_symbol: string;
  asset_balance: number;
  usd_balance: number;
  token: {
    name: string;
    symbol: string;
    decimal: number;
    price: number;
    native: boolean;
    chain: {
      name: string;
      short_name: string;
    };
  };
  amount: string;
}
export interface ResponseStaking {
  token_name: string;
  symbol: string;
  amount: number;
  reward: number;
  price: number;
}
export interface ResponseFarming {
  liquidityTokenBalance: number;
  pair: {
    token0: {
      symbol: string;
      balance: number;
      tokenDayData: {
        priceUSD: number;
      }[];
    };
    token1: {
      symbol: string;
      balance: number;
      tokenDayData: {
        priceUSD: number;
      }[];
    };
  };
  reward: {
    amount: number;
    token: {
      tokenDayData: {
        priceUSD: number;
      }[];
    };
  };
}

export interface ResponseNft {
  total: number;
  collection_name: string;
  tokens: {
    image: string;
    marketplace_url: string;
    token_name: string;
  }[];
}

export interface ResponseGetWalletTxnsResponse {
  data?: ResponseGetWalletTxnsResponseData[];
}
export interface ResponseGetWalletTxnsResponseData {
  chain_id: number;
  tx_hash: string;
  scan_base_url: string;
  signed_at: string;
  actions: {
    name: string;
    signature: string;
    from: string;
    to: string;
    amount: number;
    unit: string;
    native_transfer: boolean;
    contract?: {
      name: string;
      symbol: string;
      address: string;
    };
  }[];
  has_transfer: boolean;
  successful: boolean;
}

export interface OkPayload {
  ok: true;
  data?: any;
  page?: number;
  size?: number;
  total?: number;
  status?: number;
}

export interface ErrorPayload {
  ok: false;
  error: {
    status: number;
    message: string;
  };
}

export type ResponsePayload = OkPayload | ErrorPayload;

export type KafkaNotificationPayRequestMessage = {
  type: number;
  pay_request_metadata: KafkaNotificationPayRequestMessageMetadata;
};

export type KafkaNotificationPayRequestMessageMetadata = {
  user_profile_id?: string;
  username?: string;
  target_profile_id?: string;
  from_platform?: string;
  to_platform?: string;
  action?: string;
  note?: string;
  amount?: string;
  token?: string;
  price?: string;
  pay_link?: string;
  request_id?: string;
  wallets?: KafkaNotificationPayRequestWalletMessage[];
};

export type KafkaNotificationPayRequestWalletMessage = {
  platform_identifier: string;
  chain: string;
};
