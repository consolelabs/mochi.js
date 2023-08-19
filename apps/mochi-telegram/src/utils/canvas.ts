import { CanvasRenderingContext2D } from "canvas";
import { RectangleStats } from "types/canvas";

export function widthOf(ctx: CanvasRenderingContext2D, text: string): number {
  return ctx.measureText(text).width;
}

export function heightOf(ctx: CanvasRenderingContext2D, text: string): number {
  return (
    ctx.measureText(text).actualBoundingBoxAscent +
    ctx.measureText(text).actualBoundingBoxDescent
  );
}

export function drawRectangle(
  ctx: CanvasRenderingContext2D,
  stats: RectangleStats,
  hexColor?: string,
  borderColor?: string
) {
  const { radius, x, y } = stats;
  ctx.save();

  // --------------
  ctx.beginPath();
  ctx.lineWidth = 6;
  if (hexColor) {
    ctx.fillStyle = hexColor;
  }
  ctx.moveTo(x.from + radius, y.from);
  ctx.lineTo(x.to - radius, y.from); // top edge
  ctx.arc(x.to - radius, y.from + radius, radius, 1.5 * Math.PI, 0); // top-right corner
  ctx.lineTo(x.to, y.to - radius); // right edge
  ctx.arc(x.to - radius, y.to - radius, radius, 0, 0.5 * Math.PI); // bottom-right corner
  ctx.lineTo(x.from + radius, y.to); // bottom edge
  ctx.arc(x.from + radius, y.to - radius, radius, 0.5 * Math.PI, Math.PI); // bottom-left corner
  ctx.lineTo(x.from, y.from + radius); // left edge
  ctx.arc(x.from + radius, y.from + radius, radius, Math.PI, 1.5 * Math.PI); // top-left corner
  ctx.fill();
  if (borderColor) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = borderColor;
    ctx.stroke();
  }
  ctx.closePath();
  // --------------

  ctx.restore();
}
