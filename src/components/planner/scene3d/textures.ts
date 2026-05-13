import * as THREE from "three";

/**
 * Процедурные PBR-текстуры стен и пола для 3D-планировщика.
 * Без внешних файлов — рисуются в Canvas2D и конвертируются в THREE.CanvasTexture.
 *
 * Возвращаются: цвет (map), нормаль (normalMap), шероховатость (roughnessMap)
 * для максимальной реалистичности при PBR-рендеринге.
 */

export const CM = 0.01; // 1 см = 0.01 м

export type WallStyle = "white" | "concrete" | "warm";
export type FloorStyle = "parquet" | "tile" | "concrete";

/**
 * Фактуры покрытий стен — соответствуют WallTexture из каталога /walls/.
 * Каждая фактура имеет свой генератор паттерна, normal-карты и PBR-параметров.
 */
export type CoatingTexture =
  | "smooth" | "matte" | "satin" | "glossy"
  | "embossed" | "3d" | "rough" | "graphite"
  | "fabric" | "linen" | "silk" | "velvet" | "leather"
  | "wood" | "stone" | "brick" | "marble" | "concrete"
  | "venetian" | "metallic" | "cork"
  | "geometric" | "stripe" | "floral" | "damask";

/** PBR-параметры под конкретную фактуру. */
export interface CoatingPbr {
  roughness: number;
  metalness: number;
  envMapIntensity: number;
  normalScale: number;
  repeat: [number, number];
}

export function coatingPbr(tex?: CoatingTexture): CoatingPbr {
  switch (tex) {
    case "glossy":   return { roughness: 0.15, metalness: 0.05, envMapIntensity: 1.2, normalScale: 0.2, repeat: [2, 1] };
    case "metallic": return { roughness: 0.25, metalness: 0.85, envMapIntensity: 1.4, normalScale: 0.4, repeat: [2, 1] };
    case "silk":     return { roughness: 0.35, metalness: 0.05, envMapIntensity: 0.9, normalScale: 0.3, repeat: [2, 1] };
    case "satin":    return { roughness: 0.45, metalness: 0.0,  envMapIntensity: 0.7, normalScale: 0.3, repeat: [2, 1] };
    case "velvet":   return { roughness: 0.95, metalness: 0.0,  envMapIntensity: 0.3, normalScale: 0.6, repeat: [2, 1] };
    case "marble":   return { roughness: 0.25, metalness: 0.05, envMapIntensity: 1.0, normalScale: 0.3, repeat: [1.5, 1] };
    case "venetian": return { roughness: 0.3,  metalness: 0.05, envMapIntensity: 1.0, normalScale: 0.4, repeat: [1.5, 1] };
    case "wood":     return { roughness: 0.65, metalness: 0.0,  envMapIntensity: 0.5, normalScale: 0.6, repeat: [3, 1.5] };
    case "brick":    return { roughness: 0.85, metalness: 0.0,  envMapIntensity: 0.3, normalScale: 1.0, repeat: [2.5, 1.5] };
    case "stone":    return { roughness: 0.92, metalness: 0.0,  envMapIntensity: 0.3, normalScale: 1.1, repeat: [2, 1.2] };
    case "concrete": return { roughness: 0.9,  metalness: 0.05, envMapIntensity: 0.4, normalScale: 0.6, repeat: [2, 1] };
    case "cork":     return { roughness: 0.85, metalness: 0.0,  envMapIntensity: 0.4, normalScale: 0.5, repeat: [3, 1.5] };
    case "fabric":
    case "linen":    return { roughness: 0.92, metalness: 0.0,  envMapIntensity: 0.3, normalScale: 0.4, repeat: [4, 2] };
    case "leather":  return { roughness: 0.55, metalness: 0.05, envMapIntensity: 0.6, normalScale: 0.5, repeat: [2.5, 1.5] };
    case "3d":
    case "embossed": return { roughness: 0.7,  metalness: 0.0,  envMapIntensity: 0.6, normalScale: 1.2, repeat: [2, 1] };
    case "damask":
    case "floral":   return { roughness: 0.6,  metalness: 0.05, envMapIntensity: 0.7, normalScale: 0.5, repeat: [2, 1] };
    case "stripe":   return { roughness: 0.5,  metalness: 0.0,  envMapIntensity: 0.7, normalScale: 0.3, repeat: [2, 1] };
    case "geometric":return { roughness: 0.6,  metalness: 0.05, envMapIntensity: 0.7, normalScale: 0.4, repeat: [2.5, 1.2] };
    case "graphite": return { roughness: 0.7,  metalness: 0.1,  envMapIntensity: 0.6, normalScale: 0.4, repeat: [2, 1] };
    case "rough":    return { roughness: 0.95, metalness: 0.0,  envMapIntensity: 0.3, normalScale: 1.0, repeat: [2, 1] };
    case "matte":    return { roughness: 0.9,  metalness: 0.0,  envMapIntensity: 0.4, normalScale: 0.3, repeat: [2, 1] };
    default:         return { roughness: 0.9,  metalness: 0.0,  envMapIntensity: 0.4, normalScale: 0.4, repeat: [2, 1] };
  }
}

export const WALL_COLORS: Record<WallStyle, number> = {
  white: 0xf5f5f4,
  concrete: 0xa8a29e,
  warm: 0xe7d8c1,
};

export const FLOOR_COLORS: Record<FloorStyle, number> = {
  parquet: 0xa86b3c,
  tile: 0xd6d3d1,
  concrete: 0x78716c,
};

/* ─────────── Утилиты ─────────── */

function makeNoiseCanvas(size: number, intensity = 0.15, scale = 1): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 255 * intensity * scale;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** Простой нормал-мап из карты высот (Sobel-фильтр). */
function heightToNormal(heightCanvas: HTMLCanvasElement, strength = 1): HTMLCanvasElement {
  const size = heightCanvas.width;
  const hctx = heightCanvas.getContext("2d")!;
  const hData = hctx.getImageData(0, 0, size, size).data;

  const out = document.createElement("canvas");
  out.width = out.height = size;
  const octx = out.getContext("2d")!;
  const oImg = octx.createImageData(size, size);

  const at = (x: number, y: number) => {
    const xi = ((x % size) + size) % size;
    const yi = ((y % size) + size) % size;
    return hData[(yi * size + xi) * 4] / 255;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tl = at(x - 1, y - 1), t = at(x, y - 1), tr = at(x + 1, y - 1);
      const l = at(x - 1, y), r = at(x + 1, y);
      const bl = at(x - 1, y + 1), b = at(x, y + 1), br = at(x + 1, y + 1);

      const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dy = (bl + 2 * b + br) - (tl + 2 * t + tr);

      const nx = -dx * strength;
      const ny = -dy * strength;
      const nz = 1.0;
      const len = Math.hypot(nx, ny, nz);

      const idx = (y * size + x) * 4;
      oImg.data[idx]     = ((nx / len) * 0.5 + 0.5) * 255;
      oImg.data[idx + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      oImg.data[idx + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      oImg.data[idx + 3] = 255;
    }
  }
  octx.putImageData(oImg, 0, 0);
  return out;
}

/* ─────────── Floor ─────────── */

interface FloorMaps {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
}

export function makeFloorMaps(style: FloorStyle): FloorMaps {
  const size = 512;
  const color = document.createElement("canvas");
  color.width = color.height = size;
  const cctx = color.getContext("2d")!;

  const height = document.createElement("canvas");
  height.width = height.height = size;
  const hctx = height.getContext("2d")!;

  const rough = document.createElement("canvas");
  rough.width = rough.height = size;
  const rctx = rough.getContext("2d")!;

  if (style === "parquet") {
    // Базовый цвет: тёплый дуб
    const baseGrad = cctx.createLinearGradient(0, 0, size, size);
    baseGrad.addColorStop(0, "#9c5f30");
    baseGrad.addColorStop(0.5, "#a86b3c");
    baseGrad.addColorStop(1, "#8a5128");
    cctx.fillStyle = baseGrad;
    cctx.fillRect(0, 0, size, size);

    // 4 вертикальные доски разной ширины (елочка / кирпичная кладка)
    const planks = 5;
    const plankW = size / planks;
    const plankH = size / 2;
    for (let row = 0; row < 2; row++) {
      const offset = row % 2 === 0 ? 0 : plankW / 2;
      for (let i = -1; i <= planks; i++) {
        const x = i * plankW + offset;
        const y = row * plankH;
        // Случайный оттенок доски
        const tint = 0.85 + Math.random() * 0.3;
        cctx.fillStyle = `rgba(168,107,60,${tint * 0.4})`;
        cctx.fillRect(x, y, plankW, plankH);

        // Тёмный шов
        cctx.fillStyle = "rgba(40,20,10,0.6)";
        cctx.fillRect(x, y, 1.5, plankH);
        cctx.fillRect(x, y + plankH - 1.5, plankW, 1.5);
      }
    }

    // Волокна дерева
    cctx.globalAlpha = 0.18;
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const len = Math.random() * 60 + 20;
      cctx.fillStyle = Math.random() > 0.5 ? "#5a3818" : "#3d240f";
      cctx.fillRect(x, y, len, 0.5);
    }
    // Сучки
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 4 + 2;
      const g = cctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(40,22,8,0.7)");
      g.addColorStop(1, "rgba(40,22,8,0)");
      cctx.fillStyle = g;
      cctx.beginPath(); cctx.arc(x, y, r, 0, Math.PI * 2); cctx.fill();
    }
    cctx.globalAlpha = 1;

    // Карта высот: швы между досками — углубления
    hctx.fillStyle = "#888";
    hctx.fillRect(0, 0, size, size);
    for (let row = 0; row < 2; row++) {
      const offset = row % 2 === 0 ? 0 : plankW / 2;
      for (let i = -1; i <= planks; i++) {
        const x = i * plankW + offset;
        const y = row * plankH;
        hctx.fillStyle = "#222";
        hctx.fillRect(x, y, 2, plankH);
        hctx.fillRect(x, y + plankH - 2, plankW, 2);
      }
    }
    // Лёгкий шум поверх
    hctx.globalAlpha = 0.1;
    hctx.drawImage(makeNoiseCanvas(size, 0.5), 0, 0);
    hctx.globalAlpha = 1;

    // Roughness: швы шероховатее
    rctx.fillStyle = "#80"; // ~0.5
    rctx.fillStyle = "rgb(120,120,120)";
    rctx.fillRect(0, 0, size, size);
    for (let row = 0; row < 2; row++) {
      const offset = row % 2 === 0 ? 0 : plankW / 2;
      for (let i = -1; i <= planks; i++) {
        const x = i * plankW + offset;
        const y = row * plankH;
        rctx.fillStyle = "rgb(220,220,220)";
        rctx.fillRect(x, y, 2, plankH);
        rctx.fillRect(x, y + plankH - 2, plankW, 2);
      }
    }
  } else if (style === "tile") {
    // Базовый: светло-серая плитка с лёгкой мраморной фактурой
    cctx.fillStyle = "#e2e0dd";
    cctx.fillRect(0, 0, size, size);

    // Прожилки мрамора
    cctx.globalAlpha = 0.15;
    for (let i = 0; i < 50; i++) {
      cctx.strokeStyle = "#a8a29e";
      cctx.lineWidth = 0.8;
      cctx.beginPath();
      const x = Math.random() * size;
      const y = Math.random() * size;
      cctx.moveTo(x, y);
      cctx.bezierCurveTo(x + 50, y - 30, x + 100, y + 60, x + 150, y - 20);
      cctx.stroke();
    }
    cctx.globalAlpha = 1;

    // Швы
    const grid = 4;
    cctx.fillStyle = "#7a7773";
    for (let i = 0; i <= grid; i++) {
      const p = (i / grid) * size;
      cctx.fillRect(p - 1.5, 0, 3, size);
      cctx.fillRect(0, p - 1.5, size, 3);
    }

    // Карта высот: швы — углубления
    hctx.fillStyle = "#888";
    hctx.fillRect(0, 0, size, size);
    hctx.fillStyle = "#111";
    for (let i = 0; i <= grid; i++) {
      const p = (i / grid) * size;
      hctx.fillRect(p - 2, 0, 4, size);
      hctx.fillRect(0, p - 2, size, 4);
    }

    // Roughness: плитка глянцевая (тёмная), швы матовые (светлые)
    rctx.fillStyle = "rgb(60,60,60)";
    rctx.fillRect(0, 0, size, size);
    rctx.fillStyle = "rgb(220,220,220)";
    for (let i = 0; i <= grid; i++) {
      const p = (i / grid) * size;
      rctx.fillRect(p - 2, 0, 4, size);
      rctx.fillRect(0, p - 2, size, 4);
    }
  } else {
    // concrete
    cctx.fillStyle = "#a8a29e";
    cctx.fillRect(0, 0, size, size);
    cctx.globalAlpha = 0.5;
    cctx.drawImage(makeNoiseCanvas(size, 0.3), 0, 0);
    cctx.globalAlpha = 1;
    // Пятна
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 40 + 10;
      const g = cctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(60,60,60,${Math.random() * 0.2})`);
      g.addColorStop(1, "rgba(60,60,60,0)");
      cctx.fillStyle = g;
      cctx.beginPath(); cctx.arc(x, y, r, 0, Math.PI * 2); cctx.fill();
    }

    hctx.fillStyle = "#888";
    hctx.fillRect(0, 0, size, size);
    hctx.globalAlpha = 0.4;
    hctx.drawImage(makeNoiseCanvas(size, 0.5), 0, 0);
    hctx.globalAlpha = 1;

    rctx.fillStyle = "rgb(200,200,200)";
    rctx.fillRect(0, 0, size, size);
  }

  const normal = heightToNormal(height, style === "parquet" ? 4 : 6);

  const map = new THREE.CanvasTexture(color);
  const normalMap = new THREE.CanvasTexture(normal);
  const roughnessMap = new THREE.CanvasTexture(rough);

  for (const t of [map, normalMap, roughnessMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 6);
    t.anisotropy = 8;
  }
  map.colorSpace = THREE.SRGBColorSpace;

  return { map, normalMap, roughnessMap };
}

/** Совместимость: старая функция возвращает только color map. */
export function makeFloorTexture(style: FloorStyle): THREE.Texture {
  return makeFloorMaps(style).map;
}

/* ─────────── Wall ─────────── */

interface WallMaps {
  map: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
}

/** Утилиты для рисования паттернов фактур */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}
function shade(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex);
  const k = factor < 0 ? 1 + factor : 1 - factor;
  if (factor < 0) {
    const nr = Math.round(r + (255 - r) * -factor);
    const ng = Math.round(g + (255 - g) * -factor);
    const nb = Math.round(b + (255 - b) * -factor);
    return `rgb(${nr},${ng},${nb})`;
  }
  return `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;
}

export function makeWallMaps(
  style: WallStyle,
  overrideColor?: string,
  coatingTexture?: CoatingTexture,
): WallMaps {
  const size = 512;
  const color = document.createElement("canvas");
  color.width = color.height = size;
  const cctx = color.getContext("2d")!;

  const height = document.createElement("canvas");
  height.width = height.height = size;
  const hctx = height.getContext("2d")!;

  const rough = document.createElement("canvas");
  rough.width = rough.height = size;
  const rctx = rough.getContext("2d")!;

  // База: цвет из каталога или из стиля
  const baseHex = overrideColor
    ? overrideColor
    : `#${WALL_COLORS[style].toString(16).padStart(6, "0")}`;
  cctx.fillStyle = baseHex;
  cctx.fillRect(0, 0, size, size);

  hctx.fillStyle = "#888";
  hctx.fillRect(0, 0, size, size);
  rctx.fillStyle = "rgb(220,220,220)";
  rctx.fillRect(0, 0, size, size);

  const dark  = shade(baseHex, 0.25);
  const dark2 = shade(baseHex, 0.45);
  const light = shade(baseHex, -0.2);

  const tex = coatingTexture ?? (style === "concrete" ? "concrete" : style === "warm" ? "venetian" : "matte");

  switch (tex) {
    /* ─── КИРПИЧ ─── */
    case "brick": {
      const rows = 8, cols = 4;
      const bw = size / cols, bh = size / rows;
      const mortar = 4;
      cctx.fillStyle = "#3a2a22";
      cctx.fillRect(0, 0, size, size);
      for (let r = 0; r < rows; r++) {
        const offset = r % 2 === 0 ? 0 : bw / 2;
        for (let c = -1; c <= cols; c++) {
          const x = c * bw + offset + mortar / 2;
          const y = r * bh + mortar / 2;
          const w = bw - mortar;
          const h = bh - mortar;
          const tint = 0.85 + Math.random() * 0.3;
          cctx.fillStyle = shade(baseHex, (tint - 1) * 0.5);
          cctx.fillRect(x, y, w, h);
          // зерно кирпича
          cctx.globalAlpha = 0.3;
          cctx.drawImage(makeNoiseCanvas(32, 0.5), x, y, w, h);
          cctx.globalAlpha = 1;
          // ребро / тень
          cctx.strokeStyle = "rgba(0,0,0,0.25)";
          cctx.lineWidth = 1;
          cctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        }
      }
      // height: швы тёмные (углубления), кирпич — светлый
      hctx.fillStyle = "#000";
      hctx.fillRect(0, 0, size, size);
      for (let r = 0; r < rows; r++) {
        const offset = r % 2 === 0 ? 0 : bw / 2;
        for (let c = -1; c <= cols; c++) {
          const x = c * bw + offset + mortar / 2;
          const y = r * bh + mortar / 2;
          hctx.fillStyle = "#e0e0e0";
          hctx.fillRect(x, y, bw - mortar, bh - mortar);
        }
      }
      break;
    }

    /* ─── ДЕРЕВО ─── */
    case "wood": {
      // продольные доски
      const planks = 5;
      const pw = size / planks;
      for (let i = 0; i < planks; i++) {
        const tint = 0.92 + Math.random() * 0.16;
        cctx.fillStyle = shade(baseHex, (tint - 1) * 0.4);
        cctx.fillRect(i * pw, 0, pw, size);
        // волокна
        for (let j = 0; j < 40; j++) {
          cctx.globalAlpha = Math.random() * 0.25;
          cctx.fillStyle = dark;
          const y = Math.random() * size;
          cctx.fillRect(i * pw, y, pw, Math.random() * 2 + 0.5);
        }
        cctx.globalAlpha = 1;
        // сучки
        if (Math.random() < 0.4) {
          const cx = i * pw + pw / 2;
          const cy = Math.random() * size;
          const r = 4 + Math.random() * 6;
          const g = cctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          g.addColorStop(0, dark2);
          g.addColorStop(1, "rgba(0,0,0,0)");
          cctx.fillStyle = g;
          cctx.beginPath(); cctx.arc(cx, cy, r, 0, Math.PI * 2); cctx.fill();
        }
        // тёмная фуга
        cctx.fillStyle = "rgba(0,0,0,0.5)";
        cctx.fillRect(i * pw, 0, 1.5, size);
      }
      // height
      hctx.fillStyle = "#888";
      hctx.fillRect(0, 0, size, size);
      hctx.globalAlpha = 0.3;
      hctx.drawImage(makeNoiseCanvas(size, 0.4), 0, 0);
      hctx.globalAlpha = 1;
      for (let i = 0; i < planks; i++) {
        hctx.fillStyle = "#000";
        hctx.fillRect(i * pw, 0, 2, size);
      }
      break;
    }

    /* ─── МРАМОР ─── */
    case "marble": {
      // мягкие пятна и прожилки
      for (let i = 0; i < 12; i++) {
        const x = Math.random() * size, y = Math.random() * size;
        const r = 80 + Math.random() * 120;
        const g = cctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(255,255,255,${0.15 + Math.random() * 0.2})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        cctx.fillStyle = g;
        cctx.beginPath(); cctx.arc(x, y, r, 0, Math.PI * 2); cctx.fill();
      }
      // прожилки
      for (let v = 0; v < 6; v++) {
        cctx.beginPath();
        cctx.moveTo(Math.random() * size, Math.random() * size);
        for (let s = 0; s < 8; s++) {
          cctx.lineTo(Math.random() * size, Math.random() * size);
        }
        cctx.strokeStyle = `rgba(40,40,40,${0.12 + Math.random() * 0.15})`;
        cctx.lineWidth = 0.5 + Math.random() * 1.5;
        cctx.stroke();
      }
      hctx.fillStyle = "#777";
      hctx.fillRect(0, 0, size, size);
      hctx.globalAlpha = 0.15;
      hctx.drawImage(makeNoiseCanvas(size, 0.3), 0, 0);
      hctx.globalAlpha = 1;
      // глянец
      rctx.fillStyle = "rgb(60,60,60)";
      rctx.fillRect(0, 0, size, size);
      break;
    }

    /* ─── БАРХАТ ─── */
    case "velvet": {
      // мягкий ворс — направленные градиенты
      const g = cctx.createLinearGradient(0, 0, 0, size);
      g.addColorStop(0, shade(baseHex, -0.15));
      g.addColorStop(0.5, baseHex);
      g.addColorStop(1, shade(baseHex, 0.3));
      cctx.fillStyle = g;
      cctx.fillRect(0, 0, size, size);
      // ворсинки
      cctx.globalAlpha = 0.12;
      for (let i = 0; i < 2000; i++) {
        cctx.fillStyle = i % 2 === 0 ? "#fff" : "#000";
        cctx.fillRect(Math.random() * size, Math.random() * size, 1, 1 + Math.random() * 2);
      }
      cctx.globalAlpha = 1;
      hctx.fillStyle = "#888";
      hctx.fillRect(0, 0, size, size);
      hctx.globalAlpha = 0.35;
      hctx.drawImage(makeNoiseCanvas(size, 0.5), 0, 0);
      hctx.globalAlpha = 1;
      rctx.fillStyle = "rgb(245,245,245)"; // очень матовый
      rctx.fillRect(0, 0, size, size);
      break;
    }

    /* ─── ШЁЛК / САТИН ─── */
    case "silk":
    case "satin": {
      // мерцающие диагональные полосы
      const g = cctx.createLinearGradient(0, 0, size, size);
      g.addColorStop(0, shade(baseHex, -0.2));
      g.addColorStop(0.4, baseHex);
      g.addColorStop(0.6, shade(baseHex, -0.15));
      g.addColorStop(1, baseHex);
      cctx.fillStyle = g;
      cctx.fillRect(0, 0, size, size);
      // мелкие нити
      for (let i = 0; i < size; i += 2) {
        cctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
        cctx.fillRect(0, i, size, 1);
      }
      hctx.fillStyle = "#888";
      hctx.fillRect(0, 0, size, size);
      rctx.fillStyle = tex === "silk" ? "rgb(80,80,80)" : "rgb(120,120,120)";
      rctx.fillRect(0, 0, size, size);
      break;
    }

    /* ─── ЛЁН / ТКАНЬ ─── */
    case "linen":
    case "fabric": {
      // тканевое переплетение
      const step = 4;
      for (let y = 0; y < size; y += step) {
        for (let x = 0; x < size; x += step) {
          cctx.fillStyle = (x / step + y / step) % 2 === 0
            ? shade(baseHex, -0.05)
            : shade(baseHex, 0.08);
          cctx.fillRect(x, y, step, step);
        }
      }
      cctx.globalAlpha = 0.15;
      cctx.drawImage(makeNoiseCanvas(size, 0.4), 0, 0);
      cctx.globalAlpha = 1;
      // height — переплетение
      for (let y = 0; y < size; y += step) {
        for (let x = 0; x < size; x += step) {
          hctx.fillStyle = (x / step + y / step) % 2 === 0 ? "#bbb" : "#666";
          hctx.fillRect(x, y, step, step);
        }
      }
      rctx.fillStyle = "rgb(235,235,235)";
      rctx.fillRect(0, 0, size, size);
      break;
    }

    /* ─── БЕТОН / МИКРОЦЕМЕНТ ─── */
    case "concrete": {
      cctx.globalAlpha = 0.55;
      cctx.drawImage(makeNoiseCanvas(size, 0.4), 0, 0);
      cctx.globalAlpha = 1;
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * size, y = Math.random() * size;
        const r = Math.random() * 35 + 5;
        const g = cctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(0,0,0,${Math.random() * 0.25})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        cctx.fillStyle = g;
        cctx.beginPath(); cctx.arc(x, y, r, 0, Math.PI * 2); cctx.fill();
      }
      // трещинки
      for (let i = 0; i < 3; i++) {
        cctx.beginPath();
        cctx.moveTo(Math.random() * size, Math.random() * size);
        for (let s = 0; s < 5; s++) {
          cctx.lineTo(Math.random() * size, Math.random() * size);
        }
        cctx.strokeStyle = "rgba(0,0,0,0.1)";
        cctx.lineWidth = 0.5;
        cctx.stroke();
      }
      hctx.globalAlpha = 0.5;
      hctx.drawImage(makeNoiseCanvas(size, 0.6), 0, 0);
      hctx.globalAlpha = 1;
      break;
    }

    /* ─── ВЕНЕЦИАНКА ─── */
    case "venetian": {
      // мраморные мазки
      cctx.globalAlpha = 0.25;
      cctx.drawImage(makeNoiseCanvas(size, 0.3), 0, 0);
      cctx.globalAlpha = 1;
      for (let i = 0; i < 25; i++) {
        const x = Math.random() * size, y = Math.random() * size;
        const r = 40 + Math.random() * 80;
        const g = cctx.createRadialGradient(x, y, 0, x, y, r);
        const isLight = Math.random() < 0.5;
        g.addColorStop(0, isLight ? `rgba(255,255,255,0.22)` : `rgba(0,0,0,0.15)`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        cctx.fillStyle = g;
        cctx.beginPath(); cctx.arc(x, y, r, 0, Math.PI * 2); cctx.fill();
      }
      // глянцевые блики
      const grad = cctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, "rgba(255,255,255,0.18)");
      grad.addColorStop(0.5, "rgba(255,255,255,0)");
      grad.addColorStop(1, "rgba(0,0,0,0.1)");
      cctx.fillStyle = grad;
      cctx.fillRect(0, 0, size, size);
      hctx.globalAlpha = 0.35;
      hctx.drawImage(makeNoiseCanvas(size, 0.4), 0, 0);
      hctx.globalAlpha = 1;
      rctx.fillStyle = "rgb(90,90,90)";
      rctx.fillRect(0, 0, size, size);
      break;
    }

    /* ─── 3D / EMBOSSED ─── */
    case "3d":
    case "embossed": {
      // волны (для 3D) или мягкое тиснение
      const wave = tex === "3d" ? 60 : 20;
      for (let y = 0; y < size; y++) {
        const off = Math.sin((y / size) * Math.PI * 6) * wave;
        for (let x = 0; x < size; x += 2) {
          const v = Math.sin(((x + off) / size) * Math.PI * 8) * 0.5 + 0.5;
          cctx.fillStyle = `rgba(${255 * v},${255 * v},${255 * v},0.18)`;
          cctx.fillRect(x, y, 2, 1);
          hctx.fillStyle = `rgb(${Math.round(v * 255)},${Math.round(v * 255)},${Math.round(v * 255)})`;
          hctx.fillRect(x, y, 2, 1);
        }
      }
      break;
    }

    /* ─── ПРОБКА ─── */
    case "cork": {
      // зернистость
      for (let i = 0; i < 1500; i++) {
        const x = Math.random() * size, y = Math.random() * size;
        const r = 2 + Math.random() * 5;
        cctx.fillStyle = `rgba(${Math.random() < 0.5 ? 0 : 60}, ${30 + Math.random() * 30}, 0, ${Math.random() * 0.25})`;
        cctx.beginPath(); cctx.arc(x, y, r, 0, Math.PI * 2); cctx.fill();
      }
      hctx.fillStyle = "#777";
      hctx.fillRect(0, 0, size, size);
      hctx.globalAlpha = 0.5;
      hctx.drawImage(makeNoiseCanvas(size, 0.5), 0, 0);
      hctx.globalAlpha = 1;
      break;
    }

    /* ─── КАМЕНЬ ─── */
    case "stone": {
      // камни неровной формы
      for (let i = 0; i < 25; i++) {
        const x = Math.random() * size, y = Math.random() * size;
        const r = 30 + Math.random() * 50;
        const g = cctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, shade(baseHex, (Math.random() - 0.5) * 0.4));
        g.addColorStop(1, dark);
        cctx.fillStyle = g;
        cctx.beginPath(); cctx.arc(x, y, r, 0, Math.PI * 2); cctx.fill();
      }
      cctx.globalAlpha = 0.3;
      cctx.drawImage(makeNoiseCanvas(size, 0.5), 0, 0);
      cctx.globalAlpha = 1;
      hctx.globalAlpha = 0.7;
      hctx.drawImage(makeNoiseCanvas(size, 0.8), 0, 0);
      hctx.globalAlpha = 1;
      break;
    }

    /* ─── МЕТАЛЛ ─── */
    case "metallic": {
      const g = cctx.createLinearGradient(0, 0, size, size);
      g.addColorStop(0, shade(baseHex, -0.35));
      g.addColorStop(0.3, baseHex);
      g.addColorStop(0.6, shade(baseHex, -0.2));
      g.addColorStop(1, shade(baseHex, 0.2));
      cctx.fillStyle = g;
      cctx.fillRect(0, 0, size, size);
      // вертикальная браширка
      for (let x = 0; x < size; x++) {
        cctx.fillStyle = `rgba(${Math.random() < 0.5 ? 0 : 255}, ${Math.random() < 0.5 ? 0 : 255}, ${Math.random() < 0.5 ? 0 : 255}, ${Math.random() * 0.05})`;
        cctx.fillRect(x, 0, 1, size);
      }
      hctx.fillStyle = "#888";
      hctx.fillRect(0, 0, size, size);
      rctx.fillStyle = "rgb(70,70,70)";
      rctx.fillRect(0, 0, size, size);
      break;
    }

    /* ─── ПОЛОСКА ─── */
    case "stripe": {
      const w = 32;
      for (let x = 0; x < size; x += w * 2) {
        cctx.fillStyle = shade(baseHex, 0.2);
        cctx.fillRect(x, 0, w, size);
      }
      // тонкие полоски-сатин
      for (let x = 0; x < size; x += 4) {
        cctx.fillStyle = "rgba(255,255,255,0.03)";
        cctx.fillRect(x, 0, 1, size);
      }
      break;
    }

    /* ─── ГЕОМЕТРИЯ (соты) ─── */
    case "geometric": {
      const s = 48;
      cctx.strokeStyle = dark;
      cctx.lineWidth = 1.5;
      for (let row = 0; row < size / s + 1; row++) {
        for (let col = 0; col < size / s + 1; col++) {
          const cx = col * s * 1.5;
          const cy = row * s + (col % 2 ? s / 2 : 0);
          cctx.beginPath();
          for (let a = 0; a < 6; a++) {
            const ang = (Math.PI / 3) * a;
            const px = cx + Math.cos(ang) * (s / 2);
            const py = cy + Math.sin(ang) * (s / 2);
            if (a === 0) cctx.moveTo(px, py); else cctx.lineTo(px, py);
          }
          cctx.closePath();
          cctx.stroke();
        }
      }
      break;
    }

    /* ─── ДАМАСК ─── */
    case "damask": {
      cctx.strokeStyle = shade(baseHex, -0.25);
      cctx.lineWidth = 2;
      const step = 96;
      for (let y = 0; y < size; y += step) {
        for (let x = 0; x < size; x += step) {
          const cx = x + step / 2;
          const cy = y + step / 2;
          cctx.beginPath();
          cctx.ellipse(cx, cy, step / 3, step / 4, 0, 0, Math.PI * 2);
          cctx.stroke();
          cctx.beginPath();
          cctx.ellipse(cx, cy, step / 5, step / 6, Math.PI / 2, 0, Math.PI * 2);
          cctx.stroke();
        }
      }
      break;
    }

    /* ─── ЦВЕТОЧНЫЙ ─── */
    case "floral": {
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * size, y = Math.random() * size;
        const r = 8 + Math.random() * 14;
        const petals = 5 + Math.floor(Math.random() * 3);
        for (let p = 0; p < petals; p++) {
          const a = (Math.PI * 2 / petals) * p;
          cctx.beginPath();
          cctx.ellipse(
            x + Math.cos(a) * r * 0.7,
            y + Math.sin(a) * r * 0.7,
            r * 0.5, r * 0.25, a, 0, Math.PI * 2,
          );
          cctx.fillStyle = `rgba(${Math.random() < 0.5 ? 255 : 0}, ${Math.random() * 80 + 80}, ${Math.random() * 80 + 80}, 0.4)`;
          cctx.fill();
        }
        cctx.fillStyle = "rgba(255,220,80,0.5)";
        cctx.beginPath(); cctx.arc(x, y, r * 0.2, 0, Math.PI * 2); cctx.fill();
      }
      break;
    }

    /* ─── КОЖА ─── */
    case "leather": {
      cctx.globalAlpha = 0.3;
      cctx.drawImage(makeNoiseCanvas(size, 0.4), 0, 0);
      cctx.globalAlpha = 1;
      // характерные «поры»
      for (let i = 0; i < 800; i++) {
        const x = Math.random() * size, y = Math.random() * size;
        cctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`;
        cctx.beginPath(); cctx.arc(x, y, 0.5 + Math.random() * 1.5, 0, Math.PI * 2); cctx.fill();
      }
      hctx.fillStyle = "#888";
      hctx.fillRect(0, 0, size, size);
      hctx.globalAlpha = 0.6;
      hctx.drawImage(makeNoiseCanvas(size, 0.5), 0, 0);
      hctx.globalAlpha = 1;
      rctx.fillStyle = "rgb(140,140,140)";
      rctx.fillRect(0, 0, size, size);
      break;
    }

    /* ─── GRAPHITE / ROUGH ─── */
    case "graphite":
    case "rough": {
      cctx.globalAlpha = 0.35;
      cctx.drawImage(makeNoiseCanvas(size, 0.5), 0, 0);
      cctx.globalAlpha = 1;
      // штриховка
      for (let i = 0; i < 200; i++) {
        cctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
        cctx.lineWidth = 0.5;
        cctx.beginPath();
        const x = Math.random() * size, y = Math.random() * size;
        cctx.moveTo(x, y);
        cctx.lineTo(x + 6 + Math.random() * 10, y + 6 + Math.random() * 10);
        cctx.stroke();
      }
      hctx.globalAlpha = 0.4;
      hctx.drawImage(makeNoiseCanvas(size, 0.4), 0, 0);
      hctx.globalAlpha = 1;
      break;
    }

    /* ─── ГЛЯНЦЕВАЯ ─── */
    case "glossy": {
      const g = cctx.createLinearGradient(0, 0, size, size);
      g.addColorStop(0, shade(baseHex, -0.4));
      g.addColorStop(0.5, baseHex);
      g.addColorStop(1, shade(baseHex, 0.15));
      cctx.fillStyle = g;
      cctx.fillRect(0, 0, size, size);
      rctx.fillStyle = "rgb(40,40,40)";
      rctx.fillRect(0, 0, size, size);
      break;
    }

    /* ─── МАТОВАЯ / ГЛАДКАЯ ─── */
    case "smooth":
    case "matte":
    default: {
      cctx.globalAlpha = 0.08;
      cctx.drawImage(makeNoiseCanvas(size, 0.2), 0, 0);
      cctx.globalAlpha = 1;
      hctx.globalAlpha = 0.15;
      hctx.drawImage(makeNoiseCanvas(size, 0.3), 0, 0);
      hctx.globalAlpha = 1;
      rctx.fillStyle = tex === "matte" ? "rgb(245,245,245)" : "rgb(230,230,230)";
      rctx.fillRect(0, 0, size, size);
      break;
    }
  }

  // unused warning избегаем (light)
  void light;

  const normal = heightToNormal(height, 2.5);

  const map = new THREE.CanvasTexture(color);
  const normalMap = new THREE.CanvasTexture(normal);
  const roughnessMap = new THREE.CanvasTexture(rough);

  const pbr = coatingPbr(coatingTexture);
  for (const t of [map, normalMap, roughnessMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(pbr.repeat[0], pbr.repeat[1]);
    t.anisotropy = 4;
  }
  map.colorSpace = THREE.SRGBColorSpace;

  return { map, normalMap, roughnessMap };
}

export function makeWallTexture(style: WallStyle): THREE.Texture {
  return makeWallMaps(style).map;
}

/* ─────────── Fabric / Wood / Metal — для мебели ─────────── */

export function makeFabricNormal(): THREE.Texture {
  const size = 256;
  const h = document.createElement("canvas");
  h.width = h.height = size;
  const hctx = h.getContext("2d")!;
  hctx.fillStyle = "#888";
  hctx.fillRect(0, 0, size, size);
  // Имитация переплетения нитей
  for (let i = 0; i < size; i += 3) {
    hctx.fillStyle = i % 6 === 0 ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)";
    hctx.fillRect(0, i, size, 1.5);
    hctx.fillStyle = i % 6 === 0 ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.18)";
    hctx.fillRect(i, 0, 1.5, size);
  }
  const n = heightToNormal(h, 1.5);
  const tex = new THREE.CanvasTexture(n);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  return tex;
}

export function makeWoodMap(baseColor = "#8b5a2b"): { map: THREE.Texture; normalMap: THREE.Texture } {
  const size = 256;
  const color = document.createElement("canvas");
  color.width = color.height = size;
  const cctx = color.getContext("2d")!;
  cctx.fillStyle = baseColor;
  cctx.fillRect(0, 0, size, size);
  cctx.globalAlpha = 0.2;
  for (let i = 0; i < 400; i++) {
    const y = Math.random() * size;
    cctx.fillStyle = Math.random() > 0.5 ? "#5a3818" : "#3d240f";
    cctx.fillRect(0, y, size, 0.6);
  }
  cctx.globalAlpha = 1;

  const h = document.createElement("canvas");
  h.width = h.height = size;
  const hctx = h.getContext("2d")!;
  hctx.fillStyle = "#888";
  hctx.fillRect(0, 0, size, size);
  hctx.globalAlpha = 0.3;
  hctx.drawImage(makeNoiseCanvas(size, 0.4), 0, 0);
  hctx.globalAlpha = 1;
  const n = heightToNormal(h, 1.2);

  const map = new THREE.CanvasTexture(color);
  const normalMap = new THREE.CanvasTexture(n);
  for (const t of [map, normalMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
  }
  map.colorSpace = THREE.SRGBColorSpace;
  return { map, normalMap };
}