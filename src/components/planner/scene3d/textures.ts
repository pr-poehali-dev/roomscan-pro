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

export function makeWallMaps(style: WallStyle): WallMaps {
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

  const base = WALL_COLORS[style];
  const baseHex = `#${base.toString(16).padStart(6, "0")}`;
  cctx.fillStyle = baseHex;
  cctx.fillRect(0, 0, size, size);

  if (style === "concrete") {
    // Бетон: тёмные пятна + микротекстура
    cctx.globalAlpha = 0.6;
    cctx.drawImage(makeNoiseCanvas(size, 0.4), 0, 0);
    cctx.globalAlpha = 1;
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 30 + 5;
      const g = cctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(50,50,50,${Math.random() * 0.25})`);
      g.addColorStop(1, "rgba(50,50,50,0)");
      cctx.fillStyle = g;
      cctx.beginPath(); cctx.arc(x, y, r, 0, Math.PI * 2); cctx.fill();
    }
    hctx.fillStyle = "#888";
    hctx.fillRect(0, 0, size, size);
    hctx.globalAlpha = 0.5;
    hctx.drawImage(makeNoiseCanvas(size, 0.6), 0, 0);
    hctx.globalAlpha = 1;
    rctx.fillStyle = "rgb(220,220,220)";
    rctx.fillRect(0, 0, size, size);
  } else if (style === "warm") {
    // Декоративная штукатурка
    cctx.globalAlpha = 0.25;
    cctx.drawImage(makeNoiseCanvas(size, 0.3), 0, 0);
    cctx.globalAlpha = 1;
    for (let i = 0; i < 600; i++) {
      cctx.fillStyle = `rgba(120,80,40,${Math.random() * 0.08})`;
      cctx.fillRect(Math.random() * size, Math.random() * size, Math.random() * 4 + 1, Math.random() * 4 + 1);
    }
    hctx.fillStyle = "#888";
    hctx.fillRect(0, 0, size, size);
    hctx.globalAlpha = 0.6;
    hctx.drawImage(makeNoiseCanvas(size, 0.5), 0, 0);
    hctx.globalAlpha = 1;
    rctx.fillStyle = "rgb(210,210,210)";
    rctx.fillRect(0, 0, size, size);
  } else {
    // white: матовая краска с лёгкой шероховатостью
    cctx.globalAlpha = 0.08;
    cctx.drawImage(makeNoiseCanvas(size, 0.2), 0, 0);
    cctx.globalAlpha = 1;
    hctx.fillStyle = "#888";
    hctx.fillRect(0, 0, size, size);
    hctx.globalAlpha = 0.15;
    hctx.drawImage(makeNoiseCanvas(size, 0.3), 0, 0);
    hctx.globalAlpha = 1;
    rctx.fillStyle = "rgb(230,230,230)";
    rctx.fillRect(0, 0, size, size);
  }

  const normal = heightToNormal(height, 2);

  const map = new THREE.CanvasTexture(color);
  const normalMap = new THREE.CanvasTexture(normal);
  const roughnessMap = new THREE.CanvasTexture(rough);

  for (const t of [map, normalMap, roughnessMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 1);
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
