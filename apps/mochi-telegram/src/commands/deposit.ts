import { payApi, profileApi } from "adapters";
import { VERTICAL_BAR } from "constant";
import { Context, Input } from "telegraf";
import { stringUtils } from "utils";
import qrcode from "qrcode";
import { MachineConfig, RouterSpecialAction, route } from "utils/router";
import { chunk, groupBy } from "lodash";
import { utils } from "@consolelabs/mochi-formatter";

const machineConfig: (
  token: string,
  amount: number,
  context: any
) => MachineConfig = (token, amount, context) => ({
  id: "deposit",
  initial: "depositList",
  context: {
    renderer: {
      depositList: (tgCtx) => render(tgCtx, token),
      depositDetail: (tgCtx) => detail(tgCtx, context.addresses, token, amount),
    },
  },
  states: {
    depositList: {
      on: [
        {
          event: "*",
          target: "depositDetail",
          cond: (_ctx, ev) => ev.type !== RouterSpecialAction.BACK,
        },
      ],
    },
    depositDetail: {
      on: {
        [RouterSpecialAction.BACK]: "depositList",
      },
    },
  },
});

async function render(ctx: Context, symbol: string) {
  const tokensRes = await payApi.getTokens(symbol.toUpperCase());
  let tokens: any[] = [];
  if (tokensRes.length) {
    tokens = tokensRes.filter(
      (t: any) => t.chain_id !== "0" && Boolean(t.chain)
    );
  }

  if (tokens.length < 1) {
    return {
      text: stringUtils.escape(
        [`*${symbol.toUpperCase()}* hasn't been supported.`].join("\n")
      ),
    };
  }

  const profile = await profileApi.getByTelegram(ctx.from?.id.toString() ?? "");
  const profileId = profile.id;
  const depositInfo = await payApi.mochiWallet.deposit(profileId, symbol);

  const addressesDup = depositInfo.filter(
    (d: any) => d.contract.chain.symbol && d.contract.address
  );

  const groupByAddress = groupBy(addressesDup, (a) => a.contract.address);

  const addresses: Array<any> = Object.entries(groupByAddress).map((e) => {
    const [address, contracts] = e;
    let a = contracts.find((c) => stringUtils.equal(c.token.symbol, symbol));
    a ??= contracts[0];

    return {
      symbol: a.contract.chain.symbol.toUpperCase(),
      address,
      decimal: a.token.decimal,
      chainId: Number(a.token.chain_id ?? 1),
      tokenAddress: a.token.address,
      isEVM: a.contract.chain.is_evm,
      isNative: a.token.native,
    };
  });

  const lines = [];

  lines.push(`💰 *Deposit ${symbol.toUpperCase()}*`);
  lines.push("Below is the deposit addresses on different chains.");
  lines.push("Transactions take up to 5 minutes to process.");
  lines.push("⎯".repeat(5));
  lines.push(
    utils.mdTable(addresses, {
      cols: ["symbol"],
      row: (f, i) => `${f}\`${VERTICAL_BAR}\`\`${addresses[i].address}\``,
    })
  );

  const inline_keyboard = chunk(
    addresses.map(({ symbol, address }) => ({
      text: symbol,
      callback_data: address,
    })),
    2
  );

  return {
    context: {
      addresses,
    },
    text: stringUtils.escape(lines.join("\n")),
    options: {
      reply_markup: {
        inline_keyboard,
      },
    },
  };
}

function toMetamaskDeeplink(
  address: string,
  value: number,
  decimal: number,
  chainId: number,
  tokenAddress?: string
) {
  let link = "https://metamask.app.link/send";
  if (tokenAddress) {
    link += `/${tokenAddress}@${chainId}/transfer?address=${address}`;

    if (value > 0) {
      link += `&uint256=${value}e${decimal}`;
    }

    return link;
  }

  link += `/${address}@${chainId}`;

  if (value > 0) {
    link += `?value=${value}e18`;
  }

  return link;
}

async function detail(
  ctx: Context,
  addresses: any[],
  token: string,
  amount: number
) {
  const message = (ctx.update as any).callback_query.data;
  const depositObj = addresses.find((address) =>
    stringUtils.equal(address.address, message)
  );

  let buffer;
  // create QR code image
  if (depositObj.isEVM) {
    buffer = await qrcode.toBuffer(
      toMetamaskDeeplink(
        message,
        amount,
        depositObj.decimal,
        depositObj.chainId,
        !depositObj.isNative ? depositObj.tokenAddress : undefined
      )
    );
  } else {
    buffer = await qrcode.toBuffer(message);
  }
  const file = Input.fromBuffer(buffer);

  const lines = [];
  lines.push(`Here is the ${token.toUpperCase()} deposit info:`);
  lines.push(`\`${message}\``);

  return {
    text: stringUtils.escape(lines.join("\n")),
    photo: file,
  };
}

export default {
  deposit: async function (ctx: Context) {
    const token = ctx.state.command.args[0];
    let amount = ctx.state.command.args[1] ?? 1;
    amount = Number(amount);

    if (!token) {
      await ctx.replyWithMarkdownV2(
        stringUtils.escape(
          "Please enter a token you want to deposit e.g `/dep eth`"
        )
      );
      return;
    }
    const { text, options, context } = await render(ctx, token);

    const msg = await ctx.replyWithMarkdownV2(text, options);

    route(ctx, msg, machineConfig(token, amount, context));
  },
};
