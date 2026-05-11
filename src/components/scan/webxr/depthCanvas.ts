import type { DepthPoint } from "./types";

/**
 * Рисует карту глубины на canvas: близкие точки — красные, дальние — зелёные.
 * Использует min/max диапазон для нормировки цвета.
 */
export function drawDepthMap(canvas: HTMLCanvasElement | null, pts: DepthPoint[]): void {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const depths = pts.map((p) => p.depth);
  const min = Math.min(...depths);
  const max = Math.max(...depths);
  pts.forEach(({ x, y, depth }) => {
    const t = (depth - min) / (max - min + 0.001);
    const r = Math.round(255 * (1 - t));
    const g = Math.round(180 * t);
    ctx.fillStyle = `rgba(${r},${g},60,0.7)`;
    ctx.fillRect(Math.round(x * canvas.width), Math.round(y * canvas.height), 4, 4);
  });
}
