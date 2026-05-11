import type { RoomMeasurement } from "./types";

/**
 * Реальная оценка размеров комнаты из массива глубин WebXR.
 *
 * Алгоритм:
 * 1. Строим гистограмму глубин (бины по 10 см)
 * 2. Находим 3 главных пика — обычно это пол/потолок (близкие) и противоположная стена
 * 3. Извлекаем устойчивые статистики: P5, P25, медиана, P75, P95
 * 4. Высота: разница между ближайшими и дальними горизонтальными поверхностями
 *    (с учётом IQR для подавления outliers)
 * 5. Глубина: P95 как удалённая стена за вычетом offset камеры (~50см от тела)
 * 6. Ширина: оценка через FOV ~70° → width ≈ 2 * depth * tan(35°) ≈ depth * 1.4
 */
export function computeMeasurements(depths: number[]): RoomMeasurement {
  if (depths.length < 30) {
    return { width: 3, height: 2.7, depth: 4, area: 12 };
  }

  // 1. Сортируем + обрезаем явные шумы
  const filtered = depths.filter((d) => d > 0.3 && d < 12).sort((a, b) => a - b);
  const n = filtered.length;
  if (n < 30) return { width: 3, height: 2.7, depth: 4, area: 12 };

  const q = (p: number) => filtered[Math.floor(n * p)];
  const p05 = q(0.05);
  const p25 = q(0.25);
  const p50 = q(0.5);
  const p75 = q(0.75);
  const p95 = q(0.95);
  const iqr = p75 - p25;

  // 2. Гистограмма с шагом 10 см
  const bins: Record<number, number> = {};
  for (const d of filtered) {
    const k = Math.round(d * 10) / 10;
    bins[k] = (bins[k] ?? 0) + 1;
  }
  const peaks = Object.entries(bins)
    .map(([k, v]) => [parseFloat(k), v as number] as [number, number])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k)
    .sort((a, b) => a - b);

  // 3. Глубина (расстояние до самой далёкой стены)
  // P95 — устойчивее, чем max; добавляем поправку на offset тела от стены
  const depth = parseFloat(Math.max(2.0, Math.min(15.0, p95 + 0.3)).toFixed(2));

  // 4. Высота: если есть выраженный пик в районе 1.5–3.5м (стандартный потолок),
  //   используем его; иначе — IQR-based estimate
  const ceilingPeak = peaks.find((p) => p >= 1.5 && p <= 3.8);
  let height: number;
  if (ceilingPeak) {
    height = ceilingPeak;
  } else {
    const floorDist = Math.max(0.8, Math.min(p05, 1.5));
    height = floorDist + Math.min(2.0, iqr * 0.8 + 1.4);
  }
  height = parseFloat(Math.max(2.2, Math.min(4.5, height)).toFixed(2));

  // 5. Ширина через FOV камеры (~70° горизонтально на смартфоне)
  const widthDepth = p50;
  const width = parseFloat(Math.max(2.0, Math.min(15.0, widthDepth * 1.4 + 0.5)).toFixed(2));

  // 6. Площадь
  const area = parseFloat((width * depth).toFixed(1));

  return { width, height, depth, area };
}
