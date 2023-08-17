import { stringUtils } from "utils";

import activity from "./activity";
import airdrop from "./airdrop";
import balance from "./balance";
import binance from "./binance";
import cancel from "./cancel";
import chains from "./chains";
import deposit from "./deposit";
import ecocal from "./ecocal";
import feedback from "./feedback";
import gainerloser from "./gainerloser";
import gas from "./gas";
import heatmap from "./heatmap";
import inbox from "./inbox";
import leaderboard from "./leaderboard";
import monikerlist from "./monikerlist";
import paylink from "./paylink";
import payme from "./payme";
import profile from "./profile";
import recap from "./recap";
import shutdown from "./shutdown";
import ticker from "./ticker";
import tip from "./tip";
import tipfeed from "./tipfeed";
import tokens from "./tokens";
import transactions from "./transactions";
import v from "./v";
import track from "./wallet-monitoring/track";
import untrack from "./wallet-monitoring/untrack";
import walletadd from "./walletadd";
import walletlist from "./walletlist";
import walletview from "./walletview";
import withdraw from "./withdraw";
import wla from "./wla";
import wlr from "./wlr";
import wlv from "./wlv";

const commands = {
  ...activity,
  ...balance,
  ...deposit,
  ...ecocal,
  ...profile,
  ...withdraw,
  ...wlv,
  ...wla,
  ...wlr,
  ...gas,
  ...track,
  ...untrack,
  ...ticker,
  ...tip,
  ...v,
  ...airdrop,
  ...monikerlist,
  ...paylink,
  ...payme,
  ...tokens,
  ...feedback,
  ...gainerloser,
  ...shutdown,
  ...cancel,
  ...binance,
  ...recap,
  ...walletlist,
  ...inbox,
  ...tipfeed,
  ...chains,
  ...walletview,
  ...walletadd,
  ...leaderboard,
  ...transactions,
  ...heatmap,
};

const aliases = {
  bal: balance.balance,
  bals: balance.balance,
  balances: balance.balance,
  wd: withdraw.withdraw,
  dep: deposit.deposit,
  tick: ticker.ticker,
};

export function getAllCommandName() {
  return Object.keys(commands).filter((c) =>
    ["shutdown", "v"].every((n) => !stringUtils.equal(c, n))
  );
}

export default {
  ...commands,
  ...aliases,
};
