/**
 * Генерация процедурных текстур для модульных домов через canvas.
 * Так мы получаем реалистичные материалы (сайдинг, металлочерепица, дерево, трава)
 * без внешних файлов и без потери времени на загрузку.
 */
import * as THREE from "three";

const cache = new Map<string, THREE.CanvasTexture>();

function makeTexture(
  key: string,
  size: number,
  draw: (ctx: CanvasRenderingContext2D, s: number) => void,
  repeat: [number, number] = [1, 1],
): THREE.CanvasTexture {
  const cached = cache.get(key);
  if (cached) return cached;
  const cv = document.createElement("canvas");
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext("2d");
  if (!ctx) throw new Error("canvas 2d ctx not available");
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  cache.set(key, tex);
  return tex;
}

/* ───────── Сайдинг (горизонтальные ламели) ───────── */

export function sidingTexture(color: string, repeat: [number, number] = [2, 4]) {
  return makeTexture(
    `siding-${color}-${repeat.join("x")}`,
    256,
    (ctx, s) => {
      // Базовая заливка
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, s, s);

      // Лёгкая «деревянная» вариация
      const grad = ctx.createLinearGradient(0, 0, 0, s);
      grad.addColorStop(0, "rgba(255,255,255,0.04)");
      grad.addColorStop(0.5, "rgba(0,0,0,0.06)");
      grad.addColorStop(1, "rgba(255,255,255,0.04)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, s, s);

      // Горизонтальные ламели
      const rows = 8;
      const h = s / rows;
      for (let i = 0; i <= rows; i++) {
        const y = i * h;
        // тень под ламелью
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.fillRect(0, y - 1, s, 2);
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        ctx.fillRect(0, y + 1, s, 1);
      }

      // Лёгкая шумовая текстура
      const noise = ctx.getImageData(0, 0, s, s);
      for (let i = 0; i < noise.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 14;
        noise.data[i] = Math.max(0, Math.min(255, noise.data[i] + n));
        noise.data[i + 1] = Math.max(0, Math.min(255, noise.data[i + 1] + n));
        noise.data[i + 2] = Math.max(0, Math.min(255, noise.data[i + 2] + n));
      }
      ctx.putImageData(noise, 0, 0);
    },
    repeat,
  );
}

/* ───────── Дерево (вертикальная доска) ───────── */

export function woodTexture(color: string, repeat: [number, number] = [2, 2]) {
  return makeTexture(
    `wood-${color}-${repeat.join("x")}`,
    256,
    (ctx, s) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, s, s);

      // Волокна
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * s;
        const w = 1 + Math.random() * 2;
        const alpha = 0.04 + Math.random() * 0.08;
        ctx.fillStyle = `rgba(50,30,15,${alpha})`;
        ctx.fillRect(x, 0, w, s);
      }
      // Тёмные сучки
      for (let i = 0; i < 4; i++) {
        const x = Math.random() * s;
        const y = Math.random() * s;
        const r = 4 + Math.random() * 8;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "rgba(40,20,10,0.55)");
        g.addColorStop(1, "rgba(40,20,10,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      // Стыки досок (вертикальные)
      const cols = 4;
      const w = s / cols;
      for (let i = 0; i <= cols; i++) {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(i * w, 0, 1, s);
      }
    },
    repeat,
  );
}

/* ───────── Металлочерепица ───────── */

export function metalRoofTexture(color: string, repeat: [number, number] = [4, 2]) {
  return makeTexture(
    `roof-${color}-${repeat.join("x")}`,
    256,
    (ctx, s) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, s, s);

      // Волны металлочерепицы (мягкий синусоидальный градиент по горизонтали)
      const wavesX = 8;
      for (let x = 0; x < s; x++) {
        const phase = (x / s) * wavesX * Math.PI * 2;
        const v = (Math.sin(phase) + 1) / 2;
        ctx.fillStyle = `rgba(255,255,255,${v * 0.18})`;
        ctx.fillRect(x, 0, 1, s);
        ctx.fillStyle = `rgba(0,0,0,${(1 - v) * 0.18})`;
        ctx.fillRect(x, 0, 1, s);
      }
      // Поперечные «ступеньки» черепицы
      const rows = 6;
      const h = s / rows;
      for (let i = 0; i <= rows; i++) {
        const y = i * h;
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, y - 1, s, 2);
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(0, y + 1, s, 1);
      }
    },
    repeat,
  );
}

/* ───────── Трава (для участка) ───────── */

export function grassTexture(repeat: [number, number] = [16, 16]) {
  return makeTexture(
    "grass",
    256,
    (ctx, s) => {
      // Базовая зелень
      const g = ctx.createLinearGradient(0, 0, s, s);
      g.addColorStop(0, "#5b8a3a");
      g.addColorStop(1, "#7ba84a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);

      // Мелкий «травяной» шум
      for (let i = 0; i < 8000; i++) {
        const x = Math.random() * s;
        const y = Math.random() * s;
        const a = 0.15 + Math.random() * 0.35;
        ctx.fillStyle =
          Math.random() > 0.5
            ? `rgba(40,80,30,${a})`
            : `rgba(150,200,90,${a * 0.7})`;
        ctx.fillRect(x, y, 1.2, 1.2);
      }
      // Пятнистые участки тени
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * s;
        const y = Math.random() * s;
        const r = 8 + Math.random() * 24;
        const g2 = ctx.createRadialGradient(x, y, 0, x, y, r);
        g2.addColorStop(0, "rgba(20,40,15,0.18)");
        g2.addColorStop(1, "rgba(20,40,15,0)");
        ctx.fillStyle = g2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    repeat,
  );
}

/* ───────── Тротуарная плитка / отмостка ───────── */

export function pavingTexture(repeat: [number, number] = [4, 4]) {
  return makeTexture(
    "paving",
    256,
    (ctx, s) => {
      ctx.fillStyle = "#9a9690";
      ctx.fillRect(0, 0, s, s);
      // Сетка плиток
      const cols = 4;
      const rows = 4;
      const cw = s / cols;
      const rh = s / rows;
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 2;
      for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cw, 0);
        ctx.lineTo(i * cw, s);
        ctx.stroke();
      }
      for (let j = 0; j <= rows; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j * rh);
        ctx.lineTo(s, j * rh);
        ctx.stroke();
      }
      // Мелкий шум
      const img = ctx.getImageData(0, 0, s, s);
      for (let i = 0; i < img.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 30;
        img.data[i] = Math.max(0, Math.min(255, img.data[i] + n));
        img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n));
        img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n));
      }
      ctx.putImageData(img, 0, 0);
    },
    repeat,
  );
}

/* ───────── Дверь ───────── */

export function doorTexture(color: string = "#3a2a1f") {
  return makeTexture(
    `door-${color}`,
    256,
    (ctx, s) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, s, s);
      // Филёнки
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 4;
      ctx.strokeRect(s * 0.12, s * 0.08, s * 0.76, s * 0.36);
      ctx.strokeRect(s * 0.12, s * 0.5, s * 0.76, s * 0.42);
      // Ручка
      ctx.fillStyle = "#d6b56b";
      ctx.beginPath();
      ctx.arc(s * 0.84, s * 0.55, 5, 0, Math.PI * 2);
      ctx.fill();
      // Древесина
      for (let i = 0; i < 40; i++) {
        const y = Math.random() * s;
        ctx.fillStyle = `rgba(30,15,5,${0.04 + Math.random() * 0.07})`;
        ctx.fillRect(0, y, s, 1);
      }
    },
    [1, 1],
  );
}
