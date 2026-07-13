// ============================================
// Canvas Shape Drawers
// Handles rendering of geometric and organic symbols.
// ============================================

export type ShapeDrawer = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  rotation: number
) => void;

export const drawCircle: ShapeDrawer = (ctx, x, y, size, color) => {
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
};

export const drawSquare: ShapeDrawer = (ctx, x, y, size, color, rotation) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.fillRect(-size, -size, size * 2, size * 2);
  ctx.restore();
};

export const drawTriangle: ShapeDrawer = (ctx, x, y, size, color, rotation) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.866, size * 0.5); // size * cos(30deg)
  ctx.lineTo(-size * 0.866, size * 0.5);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
};

export const drawHeart: ShapeDrawer = (ctx, x, y, size, color, rotation) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const s = size * 0.06;
  ctx.beginPath();
  ctx.moveTo(0, s * 5);
  ctx.bezierCurveTo(0, s * 3, -s * 5, s * 3, -s * 5, 0);
  ctx.bezierCurveTo(-s * 5, -s * 5, 0, -s * 7, 0, -s * 3);
  ctx.bezierCurveTo(0, -s * 7, s * 5, -s * 5, s * 5, 0);
  ctx.bezierCurveTo(s * 5, s * 3, 0, s * 3, 0, s * 5);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
};

export const SHAPE_DRAWERS: Record<string, ShapeDrawer> = {
  circle: drawCircle,
  square: drawSquare,
  triangle: drawTriangle,
  heart: drawHeart,
};
