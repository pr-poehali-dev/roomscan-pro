/**
 * Возвращает CSS background-image для имитации фактуры покрытия
 * поверх базового цвета (`item.color`). Используется в превью карточек.
 */
import type { WallTexture } from "./wallsData";

/** Преобразование hex → rgba */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Чуть темнее базового — для линий/швов */
function darker(hex: string, amount = 0.18): string {
  const h = hex.replace("#", "");
  const r = Math.max(0, parseInt(h.substring(0, 2), 16) * (1 - amount));
  const g = Math.max(0, parseInt(h.substring(2, 4), 16) * (1 - amount));
  const b = Math.max(0, parseInt(h.substring(4, 6), 16) * (1 - amount));
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

export function textureBackground(textures: WallTexture[], baseColor: string): string {
  // приоритет — самые «визуальные» фактуры
  const priority: WallTexture[] = [
    "brick", "stripe", "geometric", "damask", "floral", "3d", "marble", "wood",
    "venetian", "concrete", "cork", "linen", "fabric", "velvet", "silk",
    "metallic", "glossy", "satin", "leather", "stone", "graphite", "embossed", "rough", "matte", "smooth",
  ];
  const tex = priority.find((t) => textures.includes(t)) ?? textures[0] ?? "smooth";
  const dark = darker(baseColor, 0.22);
  const light = hexToRgba("#ffffff", 0.18);

  switch (tex) {
    case "brick":
      // кладка кирпичей
      return [
        `linear-gradient(${dark} 2px, transparent 2px)`,
        `linear-gradient(90deg, ${dark} 2px, transparent 2px)`,
        `linear-gradient(90deg, transparent 60px, ${dark} 60px, ${dark} 62px, transparent 62px)`,
      ].join(",") + ` 0 0 / 120px 30px, 0 0 / 120px 30px, 0 30px / 120px 60px`;

    case "stripe":
      return `repeating-linear-gradient(90deg, ${hexToRgba(baseColor, 0)} 0 18px, ${dark} 18px 22px)`;

    case "geometric":
      // соты
      return `
        radial-gradient(circle at 50% 0, ${dark} 0 1px, transparent 2px),
        radial-gradient(circle at 0 50%, ${dark} 0 1px, transparent 2px),
        radial-gradient(circle at 100% 50%, ${dark} 0 1px, transparent 2px),
        linear-gradient(60deg, ${hexToRgba(baseColor, 0)} 47%, ${dark} 48% 52%, ${hexToRgba(baseColor, 0)} 53%),
        linear-gradient(-60deg, ${hexToRgba(baseColor, 0)} 47%, ${dark} 48% 52%, ${hexToRgba(baseColor, 0)} 53%)
      `;

    case "damask":
      return `
        radial-gradient(ellipse at 50% 50%, ${hexToRgba("#ffffff", 0.25)} 0 8px, transparent 12px),
        radial-gradient(ellipse at 0 0, ${dark} 0 6px, transparent 10px),
        radial-gradient(ellipse at 100% 100%, ${dark} 0 6px, transparent 10px)
      `;

    case "floral":
      return `
        radial-gradient(circle at 20% 30%, ${hexToRgba("#ffffff", 0.35)} 0 4px, transparent 6px),
        radial-gradient(circle at 70% 60%, ${hexToRgba("#ffffff", 0.25)} 0 5px, transparent 8px),
        radial-gradient(circle at 50% 90%, ${dark} 0 3px, transparent 5px)
      `;

    case "3d":
      return `
        radial-gradient(circle at 30% 30%, ${light} 0 30%, transparent 45%),
        radial-gradient(circle at 70% 70%, ${hexToRgba("#000000", 0.18)} 0 30%, transparent 45%)
      `;

    case "marble":
      return `
        radial-gradient(circle at 20% 30%, ${hexToRgba("#ffffff", 0.4)} 0 6px, transparent 30px),
        radial-gradient(circle at 80% 60%, ${dark} 0 2px, transparent 40px),
        linear-gradient(45deg, transparent 48%, ${dark} 49% 50%, transparent 51%)
      `;

    case "wood":
      // волокна
      return `repeating-linear-gradient(90deg, ${hexToRgba(baseColor, 0)} 0 6px, ${dark} 6px 7px, ${hexToRgba(baseColor, 0)} 7px 14px, ${hexToRgba("#000000", 0.08)} 14px 15px)`;

    case "venetian":
      return `
        linear-gradient(135deg, ${hexToRgba("#ffffff", 0.25)} 0%, transparent 30%, ${hexToRgba("#000000", 0.1)} 70%, transparent 100%),
        linear-gradient(45deg, ${hexToRgba("#ffffff", 0.1)} 0%, transparent 50%)
      `;

    case "concrete":
      return `
        radial-gradient(circle at 25% 35%, ${hexToRgba("#000000", 0.12)} 0 12px, transparent 25px),
        radial-gradient(circle at 75% 75%, ${hexToRgba("#000000", 0.08)} 0 8px, transparent 18px),
        radial-gradient(circle at 50% 50%, ${hexToRgba("#ffffff", 0.06)} 0 20px, transparent 40px)
      `;

    case "cork":
      // зернистость пробки
      return `
        radial-gradient(circle at 15% 25%, ${dark} 0 1.5px, transparent 2.5px),
        radial-gradient(circle at 45% 65%, ${dark} 0 2px, transparent 3px),
        radial-gradient(circle at 75% 20%, ${dark} 0 1px, transparent 2px),
        radial-gradient(circle at 85% 75%, ${dark} 0 1.5px, transparent 2.5px),
        radial-gradient(circle at 30% 85%, ${dark} 0 2px, transparent 3px)
      `;

    case "linen":
    case "fabric":
      return `
        repeating-linear-gradient(0deg, ${hexToRgba("#000000", 0.05)} 0 1px, transparent 1px 3px),
        repeating-linear-gradient(90deg, ${hexToRgba("#000000", 0.05)} 0 1px, transparent 1px 3px)
      `;

    case "velvet":
      return `
        linear-gradient(180deg, ${hexToRgba("#ffffff", 0.15)} 0%, transparent 40%, ${hexToRgba("#000000", 0.2)} 100%)
      `;

    case "silk":
      return `
        linear-gradient(110deg, ${hexToRgba("#ffffff", 0.35)} 0%, transparent 30%, ${hexToRgba("#ffffff", 0.2)} 60%, transparent 80%)
      `;

    case "metallic":
      return `
        linear-gradient(135deg, ${hexToRgba("#ffffff", 0.45)} 0%, transparent 30%, ${hexToRgba("#000000", 0.2)} 60%, ${hexToRgba("#ffffff", 0.3)} 100%)
      `;

    case "glossy":
      return `
        linear-gradient(160deg, ${hexToRgba("#ffffff", 0.5)} 0%, transparent 40%)
      `;

    case "leather":
      return `
        radial-gradient(circle at 20% 30%, ${hexToRgba("#000000", 0.15)} 0 6px, transparent 12px),
        radial-gradient(circle at 60% 70%, ${hexToRgba("#000000", 0.1)} 0 8px, transparent 14px),
        radial-gradient(circle at 80% 20%, ${hexToRgba("#000000", 0.12)} 0 5px, transparent 10px)
      `;

    case "stone":
      return `
        radial-gradient(ellipse at 30% 40%, ${dark} 0 15px, transparent 35px),
        radial-gradient(ellipse at 70% 70%, ${dark} 0 12px, transparent 30px)
      `;

    case "graphite":
      return `
        repeating-linear-gradient(45deg, ${hexToRgba("#000000", 0.08)} 0 2px, transparent 2px 6px)
      `;

    case "rough":
    case "embossed":
      return `
        radial-gradient(circle at 25% 35%, ${hexToRgba("#000000", 0.1)} 0 2px, transparent 3px),
        radial-gradient(circle at 60% 55%, ${hexToRgba("#000000", 0.08)} 0 2px, transparent 3px),
        radial-gradient(circle at 80% 80%, ${hexToRgba("#000000", 0.1)} 0 2px, transparent 3px)
      `;

    default:
      // smooth / satin / matte — мягкий блик
      return `
        radial-gradient(circle at 30% 20%, ${hexToRgba("#ffffff", 0.4)} 0%, transparent 60%),
        radial-gradient(circle at 70% 80%, ${hexToRgba("#000000", 0.15)} 0%, transparent 60%)
      `;
  }
}
