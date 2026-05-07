import * as THREE from "three";

/**
 * Процедурные текстуры стен и пола для 3D-планировщика.
 * Без внешних файлов — рисуются в Canvas2D и конвертируются в THREE.CanvasTexture.
 * Логика 1:1 перенесена из PlanScene3D.tsx без изменений.
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

export function makeFloorTexture(style: FloorStyle): THREE.Texture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  if (style === "parquet") {
    ctx.fillStyle = "#a86b3c";
    ctx.fillRect(0, 0, size, size);
    // Доски
    ctx.strokeStyle = "rgba(60,30,15,0.3)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const y = i * (size / 4);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
    // Тексура волокон
    ctx.fillStyle = "rgba(60,30,15,0.12)";
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillRect(x, y, Math.random() * 30 + 5, 0.5);
    }
  } else if (style === "tile") {
    ctx.fillStyle = "#d6d3d1";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "#a8a29e";
    ctx.lineWidth = 1.5;
    const grid = 4;
    for (let i = 0; i <= grid; i++) {
      const p = (i / grid) * size;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
    }
  } else {
    // concrete
    ctx.fillStyle = "#78716c";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 1000; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`;
      ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeWallTexture(style: WallStyle): THREE.Texture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const base = WALL_COLORS[style];
  ctx.fillStyle = `#${base.toString(16).padStart(6, "0")}`;
  ctx.fillRect(0, 0, size, size);
  if (style === "concrete") {
    for (let i = 0; i < 800; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.18})`;
      ctx.fillRect(Math.random() * size, Math.random() * size, Math.random() * 2, Math.random() * 2);
    }
  } else if (style === "warm") {
    // Лёгкая текстура штукатурки
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = `rgba(80,50,20,${Math.random() * 0.08})`;
      ctx.fillRect(Math.random() * size, Math.random() * size, 3, 3);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
