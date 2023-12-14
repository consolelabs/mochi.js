import { formatPercentDigit } from "../formatDigit";

type Props = {
  pnl?: number | string;
};

export default async function ({ pnl = 0 }: Props) {
  let pnlNum = Number(pnl || 0);
  let pnlStr = "";
  if (Number.isNaN(pnlNum)) {
    pnl = 0;
  }

  const isUp = Math.sign(pnlNum) > 0;
  const isDown = Math.sign(pnlNum) < 0;
  const icon = isUp ? "🟢" : isDown ? "🔴" : "";

  if (pnlNum && (isUp || isDown)) {
    pnlStr = ` \\(${icon} ${formatPercentDigit(Math.abs(pnlNum))}\\)`;
  }

  return {
    text: pnlStr,
    icon,
    isDown,
    isUp,
  };
}
