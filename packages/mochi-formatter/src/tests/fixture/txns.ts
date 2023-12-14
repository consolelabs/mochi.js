import { Tx } from "@consolelabs/mochi-rest";

export const TransferTx: Tx = {
  from_profile_id: "48438",
  other_profile_id: "40409",
  from_profile_source: "mochi-balance",
  other_profile_source: "mochi-balance",
  source_platform: "web",
  amount: "149608101570000000000",
  internal_id: 7410,
  external_id: "27a823e486fa",
  type: "out",
  action: "transfer",
  status: "success",
  created_at: "2023-12-08T09:08:51.347819Z",
  token: {
    id: "4b463ac8-fde3-43c3-a094-a9af2b552494",
    name: "Button",
    symbol: "BUTT",
    decimal: 18,
    chain_id: "250",
    native: false,
    address: "0xF42cc7284389fBf749590f26539002ca931323D0",
    icon: "https://cdn.discordapp.com/emojis/1007247521468403744.png?size=240&quality=lossless",
    coin_gecko_id: "buttcoin-2",
    price: 0,
    chain: {
      id: "7303f2f8-b6d9-454d-aa92-880569fa5296",
      chain_id: "250",
      name: "Fantom Opera",
      symbol: "FTM",
      rpc: "https://rpc.ftm.tools",
      explorer: "https://ftmscan.com",
      icon: "https://cdn.discordapp.com/emojis/928216448902508564.png?size=240&quality=lossless",
      type: "evm",
    },
  },
};

export const DepositTx: Tx = {
  from_profile_id: "55834",
  other_profile_id: "",
  from_profile_source: "0x10522d52F09CbEd5C8718090E2fB3901Ac6FdA10",
  other_profile_source: "0x70c5d7f4ea7f7a3065fe146bf5683a8b31777af9",
  source_platform: "telegram",
  amount: "1000000000000000000",
  internal_id: 7348,
  external_id: "a9950d3cebc1",
  type: "in",
  action: "deposit",
  status: "success",
  created_at: "2023-12-05T10:00:32.364933Z",
  token: {
    id: "61388b7c-5505-4fdf-8084-077422369a93",
    name: "Fantom",
    symbol: "FTM",
    decimal: 18,
    chain_id: "250",
    native: true,
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    icon: "https://cdn.discordapp.com/emojis/967285237686108212.png?size=240&quality=lossless",
    coin_gecko_id: "fantom",
    price: 0,
    chain: {
      id: "7303f2f8-b6d9-454d-aa92-880569fa5296",
      chain_id: "250",
      name: "Fantom Opera",
      symbol: "FTM",
      rpc: "https://rpc.ftm.tools",
      explorer: "https://ftmscan.com",
      icon: "https://cdn.discordapp.com/emojis/928216448902508564.png?size=240&quality=lossless",
      type: "evm",
    },
  },
};

export const WithdrawTx: Tx = {
  from_profile_id: "34522",
  other_profile_id: "",
  from_profile_source: "mochi-balance",
  other_profile_source: "0x053499083f0Ed66A5af06245483FaEeEfc313249",
  source_platform: "discord",
  amount: "60000000000000000000",
  internal_id: 7409,
  external_id: "68b47c5d102c",
  type: "out",
  action: "withdraw",
  status: "success",
  created_at: "2023-12-08T07:29:12.460525Z",
  token: {
    id: "941f0fb1-00da-49dc-a538-5e81fc874cb4",
    name: "Icy",
    symbol: "ICY",
    decimal: 18,
    chain_id: "137",
    native: false,
    address: "0x8D57d71B02d71e1e449a0E459DE40473Eb8f4a90",
    icon: "https://cdn.discordapp.com/emojis/1049620715374133288.webp?size=240&quality=lossless",
    coin_gecko_id: "icy",
    price: 0,
    chain: {
      id: "7303f2f8-b6d9-454d-aa92-880569fa5295",
      chain_id: "137",
      name: "Polygon Mainnet",
      symbol: "MATIC",
      rpc: "https://polygon.llamarpc.com",
      explorer: "https://polygonscan.com",
      icon: "https://cdn.discordapp.com/emojis/928216430535671818.png?size=240&quality=lossless",
      type: "evm",
    },
  },
};

export const AirdropTx: Tx = {
  from_profile_id: "1640552476807532544",
  other_profile_id: "48438",
  from_profile_source: "mochi-balance",
  other_profile_source: "mochi-balance",
  source_platform: "discord",
  amount: "10000000000000000000",
  internal_id: 6881,
  external_id: "5242596071ea",
  type: "out",
  action: "airdrop",
  status: "success",
  created_at: "2023-11-08T04:34:04.274995Z",
  token: {
    id: "e606b444-ad9c-46f6-af62-862fdf67a7b0",
    name: "Mantle Inu",
    symbol: "MINU",
    decimal: 18,
    chain_id: "5000",
    native: false,
    address: "0x51cfe5b1e764dc253f4c8c1f19a081ff4c3517ed",
    icon: "https://assets.coingecko.com/coins/images/31014/small/mantle-inu.jpeg?1696529851",
    coin_gecko_id: "mantle-inu",
    price: 0,
    chain: {
      id: "c8b27481-ecc8-4da3-9216-85ac7c8b40e6",
      chain_id: "5000",
      name: "Mantle",
      symbol: "MNT",
      rpc: "https://mantle-mainnet.public.blastapi.io",
      explorer: "https://explorer.mantle.xyz",
      icon: "https://cdn.discordapp.com/emojis/1169172424496001095.png?size=240&quality=lossless",
      type: "evm",
    },
  },
  other_profile_ids: [],
};

export const PaylinkTx: Tx = {
  from_profile_id: "55834",
  other_profile_id: "",
  from_profile_source: "mochi-balance",
  other_profile_source: "",
  source_platform: "discord",
  amount: "1000000000000000000",
  internal_id: 7401,
  external_id: "45ce7563380d",
  type: "out",
  action: "paylink",
  status: "pending",
  created_at: "2023-12-08T03:17:59.845398Z",
  token: {
    id: "fc2d016d-b755-4e84-9e6e-46692eda1305",
    name: "Spell",
    symbol: "SPELL",
    decimal: 18,
    chain_id: "250",
    native: false,
    address: "0x468003B688943977e6130F4F68F23aad939a1040",
    icon: "https://cdn.discordapp.com/emojis/1150806619920273428.png?size=240&quality=lossless",
    coin_gecko_id: "spell-token",
    price: 0,
    chain: {
      id: "7303f2f8-b6d9-454d-aa92-880569fa5296",
      chain_id: "250",
      name: "Fantom Opera",
      symbol: "FTM",
      rpc: "https://rpc.ftm.tools",
      explorer: "https://ftmscan.com",
      icon: "https://cdn.discordapp.com/emojis/928216448902508564.png?size=240&quality=lossless",
      type: "evm",
    },
  },
  metadata: {
    code: "0ddac19357ecbab724a9",
  },
};

export const PaymeTx: Tx = {
  from_profile_id: "55834",
  other_profile_id: "43678",
  from_profile_source: "mochi-balance",
  other_profile_source: "mochi-balance",
  source_platform: "discord",
  amount: "1000000000000000000",
  internal_id: 7400,
  external_id: "a83ad9f4ad09",
  type: "in",
  action: "payme",
  status: "pending",
  created_at: "2023-12-08T03:17:40.445323Z",
  token: {
    id: "61388b7c-5505-4fdf-8084-077422369a93",
    name: "Fantom",
    symbol: "FTM",
    decimal: 18,
    chain_id: "250",
    native: true,
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    icon: "https://cdn.discordapp.com/emojis/967285237686108212.png?size=240&quality=lossless",
    coin_gecko_id: "fantom",
    price: 0,
    chain: {
      id: "7303f2f8-b6d9-454d-aa92-880569fa5296",
      chain_id: "250",
      name: "Fantom Opera",
      symbol: "FTM",
      rpc: "https://rpc.ftm.tools",
      explorer: "https://ftmscan.com",
      icon: "https://cdn.discordapp.com/emojis/928216448902508564.png?size=240&quality=lossless",
      type: "evm",
    },
  },
  metadata: {
    channel_name: "Discord",
    code: "80cc6a57b73c1a4574ce",
    moniker: "",
    note: "",
    original_amount: "1",
    target_platform: "discord",
  },
};

export const VaultTransferTx: Tx = {
  from_profile_id: "40686",
  other_profile_id: "1711669347849605120",
  from_profile_source: "mochi-balance",
  other_profile_source: "mochi-vault",
  source_platform: "discord",
  amount: "5000000000000000000",
  internal_id: 7428,
  external_id: "cf2d71433f14",
  type: "in",
  action: "vault_transfer",
  status: "success",
  created_at: "2023-12-09T17:15:12.04555Z",
  token: {
    id: "941f0fb1-00da-49dc-a538-5e81fc874cb4",
    name: "Icy",
    symbol: "ICY",
    decimal: 18,
    chain_id: "137",
    native: false,
    address: "0x8D57d71B02d71e1e449a0E459DE40473Eb8f4a90",
    icon: "https://cdn.discordapp.com/emojis/1049620715374133288.webp?size=240&quality=lossless",
    coin_gecko_id: "icy",
    price: 0,
    chain: {
      id: "7303f2f8-b6d9-454d-aa92-880569fa5295",
      chain_id: "137",
      name: "Polygon Mainnet",
      symbol: "MATIC",
      rpc: "https://polygon.llamarpc.com",
      explorer: "https://polygonscan.com",
      icon: "https://cdn.discordapp.com/emojis/928216430535671818.png?size=240&quality=lossless",
      type: "evm",
    },
  },
  metadata: {
    vault_request: {
      vault_id: 168,
    },
  },
};