import { AddressChainType, Platform, utils } from "@consolelabs/mochi-ui";
import api from "api";
import { START_URL, StartEvent } from "constant";
import { Context } from "telegraf";
import { ResponseFarming, ResponseNft, ResponseStaking } from "types/common";
import { stringUtils } from "utils";
import { fmt } from "utils/formatter";
import { paginationButtons } from "utils/router";

type AssetLocation = "offchain" | "onchain";

type Balance = {
  token: {
    name: string;
    symbol: string;
    decimal: number;
    price: number;
    chain: { short_name?: string; name?: string; symbol?: string };
    native: boolean;
  };
  amount: string;
};

export async function getOffchainAssets(profileId: string) {
  return await getAssets("offchain", profileId, "", AddressChainType.UNKNOWN);
}

export async function getOnchainAssets(
  profileId: string,
  address: string,
  chainType: AddressChainType
) {
  return await getAssets("onchain", profileId, address, chainType);
}

async function getAssets(
  location: AssetLocation,
  profileId: string,
  address: string,
  chainType: AddressChainType
) {
  let balances: Balance[] = [];
  let farming: ResponseFarming[] = [];
  let staking: ResponseStaking[] = [];
  let nfts: ResponseNft[] = [];
  let pnl = 0;

  switch (location) {
    case "offchain": {
      const offchainBal = await assetFetcher(location)(
        profileId,
        address,
        chainType
      );
      let balances = [];
      if (offchainBal.ok) {
        balances = offchainBal.data.filter((i: any) => Boolean(i));
      }
      pnl = 0;
      break;
    }

    case "onchain": {
      const res = await assetFetcher(location)(profileId, address, chainType);
      let balances = [];
      if (res.ok) {
        balances = res.data.balance?.filter((i: any) => Boolean(i)) ?? [];
      }
      pnl = Number(res.data.pnl);
      if (Number.isNaN(pnl)) {
        pnl = 0;
      }
      farming = res.farming ?? [];
      staking = res.staking ?? [];
      nfts = res.nfts ?? [];
      break;
    }
  }

  return {
    balances,
    farming,
    staking,
    nfts,
    pnl,
  };
}

function assetFetcher(location: AssetLocation) {
  switch (location) {
    case "offchain":
      return (profileId: string) =>
        api.pay.mochiWallet.getBalance({ profileId });
    case "onchain":
      return (profileId: string, address: string, chainType: string) =>
        api.base.users.getWalletAssets({ profileId, address, chainType });
  }
}

export async function renderData(
  ctx: Context,
  page: number,
  force = false,
  data: {
    profile: any;
    onchain: boolean;
    wallets: { address: string; chain: string }[];
    assets: {
      pnl: number;
      balances: Balance[];
      farming: ResponseFarming[];
      staking: ResponseStaking[];
      nfts: ResponseNft[];
    };
    txns: any[];
  }
) {
  const walletLines = await renderListWallet(
    data.profile.id,
    "👛 Wallets",
    data.wallets,
    data.onchain
  );
  const { lines: assetsLines, totalPage } = await renderPaginationAssets(
    "💵 Spot",
    data.assets,
    page
  );
  const txnLines = await renderListTransactions(
    "❇️ Recent transactions",
    data.txns
  );
  const lineBreak = "";

  let lines = [
    ...walletLines,
    lineBreak,
    ...assetsLines,
    lineBreak,
    ...txnLines,
  ];

  const discordPlatform = data.profile.associated_accounts?.find((aa: any) =>
    stringUtils.equal(aa.platform, "discord")
  );

  if (!discordPlatform && !force) {
    lines = [];
    lines.push("Hey there,");
    lines.push("You don't seems to have a Discord account connected");

    return {
      initial: "askConnect",
      text: stringUtils.escape(lines.join("\n")),
      options: {
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Connect Discord",
                url: START_URL(
                  ctx.botInfo.username,
                  StartEvent.AskConnectDiscord
                ),
              },
            ],
            [
              {
                text: "Show balance anyway",
                callback_data: "proceed",
              },
            ],
          ],
        },
      },
    };
  }

  return {
    text: stringUtils.escape(lines.join("\n")),
    options: {
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [paginationButtons(page, totalPage)],
      },
    },
  };
}

async function renderListWallet(
  profileId: string,
  title: string,
  wallets: any[],
  onchain: boolean
) {
  if (!wallets.length) {
    return [];
  }

  let lines: string[] = [];
  lines.push(`*${title}*`);
  if (onchain) {
    const walletsWithAlias = await Promise.all(
      wallets.map(async (w) => {
        const resolvedAddress = await utils.address.resolve(w.address);
        return mochiApi.users
          .getUserTrackingWallet(profileId, resolvedAddress)
          .then((r) => ({
            ...w,
            name: r.data?.alias,
          }));
      })
    );
    const { text } = await fmt.components.onchainWallets({
      wallets: walletsWithAlias,
    });
    lines.push(text);
  } else {
    const { text } = await fmt.components.mochiWallets({
      wallets,
      shortenAddress: false,
    });
    lines.push(text);
  }

  return lines;
}

async function renderPaginationAssets(
  title: string,
  assets: {
    balances: Balance[];
    farming: ResponseFarming[];
    staking: ResponseStaking[];
    nfts: ResponseNft[];
    pnl: number;
  },
  page: number
) {
  let lines = [`*${title}*`];
  const { balances: balancesRes, pnl } = assets;
  const balances = balancesRes.filter((i: any) => Boolean(i));
  const {
    text,
    totalUsd: totalWorth,
    totalPage,
  } = await fmt.components.balance({
    balances,
    page,
  });

  lines.push(text);
  lines.push("💰 *Total \\(U.S dollar\\)*");
  const { text: pnlText } = await fmt.components.pnl({ pnl });
  lines.push(`${utils.formatUsdDigit(totalWorth)} ${pnlText}`);

  return {
    lines,
    totalPage,
  };
}

async function renderListTransactions(title: string, txns: any[]) {
  const { text } = await fmt.components.txns({
    on: Platform.Telegram,
    txns,
    top: 5,
  });

  const lines = [`*${title}*`, text];
  return lines;
}
