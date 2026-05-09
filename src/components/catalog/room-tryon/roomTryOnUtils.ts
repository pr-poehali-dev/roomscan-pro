import type { FurnitureItem } from "@/lib/furnitureCatalog";

/** Состояние трансформации наложения мебели на фото комнаты. */
export interface Transform {
  x: number;       // px от левого верхнего угла канвы
  y: number;
  scale: number;   // множитель размера
  rotation: number; // градусы
  flipped: boolean; // зеркальное отражение
  opacity: number;  // 0..1
}

export const STORAGE_KEY = "roomscan:tryon:room-photo";

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Простой плейсхолдер на основе цвета и иконки товара */
export function generateFallback(item: FurnitureItem): string {
  const c = item.color ?? "#a78b6f";
  const w = 600;
  const h = 400;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${c}" stop-opacity="1"/>
        <stop offset="1" stop-color="${c}" stop-opacity="0.7"/>
      </linearGradient>
    </defs>
    <rect x="40" y="120" width="${w - 80}" height="${h - 180}" rx="20" fill="url(#g)" stroke="#000" stroke-width="2" stroke-opacity="0.15"/>
    <rect x="40" y="120" width="${w - 80}" height="80" rx="20" fill="#000" fill-opacity="0.08"/>
    <rect x="60" y="${h - 60}" width="40" height="40" fill="#222" rx="4"/>
    <rect x="${w - 100}" y="${h - 60}" width="40" height="40" fill="#222" rx="4"/>
    <text x="${w / 2}" y="${h / 2}" text-anchor="middle" font-family="ui-sans-serif" font-size="18" font-weight="700" fill="#fff" opacity="0.85">${item.name}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
