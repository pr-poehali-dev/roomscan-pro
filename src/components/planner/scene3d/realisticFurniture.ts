import * as THREE from "three";
import type { FurnitureItem } from "@/lib/floorPlan";
import { CM, makeFabricNormal, makeWoodMap } from "./textures";

/**
 * Высокореалистичные модели мебели на базе простых примитивов,
 * но с PBR-материалами (sheen для ткани, anisotropy для дерева, металлические ножки),
 * скруглёнными углами через chamfer-боксы и контактными тенями.
 */

const fabricNormalCache = new Map<string, THREE.Texture>();
function getFabricNormal(): THREE.Texture {
  let t = fabricNormalCache.get("default");
  if (!t) {
    t = makeFabricNormal();
    fabricNormalCache.set("default", t);
  }
  return t;
}

const woodCache = new Map<string, { map: THREE.Texture; normalMap: THREE.Texture }>();
function getWood(color: string) {
  let w = woodCache.get(color);
  if (!w) {
    w = makeWoodMap(color);
    woodCache.set(color, w);
  }
  return w;
}

/* ─────────── Материалы ─────────── */

function fabricMaterial(color: number): THREE.MeshPhysicalMaterial {
  const m = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.9,
    metalness: 0.0,
    sheen: 1.0,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(color).multiplyScalar(1.3),
    normalMap: getFabricNormal(),
    normalScale: new THREE.Vector2(0.3, 0.3),
  });
  return m;
}

// leatherMaterial — оставлен на будущее, можно использовать для кожаных диванов

function woodMaterial(color = "#8b5a2b", roughness = 0.55): THREE.MeshStandardMaterial {
  const w = getWood(color);
  return new THREE.MeshStandardMaterial({
    map: w.map,
    normalMap: w.normalMap,
    normalScale: new THREE.Vector2(0.4, 0.4),
    roughness,
    metalness: 0.05,
  });
}

function metalMaterial(color = 0xb8b8b8, rough = 0.25): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: rough,
    metalness: 0.95,
  });
}

function paintedMaterial(color: number, gloss = false): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: gloss ? 0.25 : 0.6,
    metalness: 0.0,
    clearcoat: gloss ? 0.5 : 0.0,
    clearcoatRoughness: 0.3,
  });
}

function ceramicMaterial(color = 0xfafafa): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.1,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });
}

// glassMaterial — оставлен на будущее, можно применять для стеклянных столов

/* ─────────── Утилиты ─────────── */

/** Скруглённый бокс через ExtrudeGeometry с фасками. */
function roundedBox(w: number, h: number, d: number, radius = 0.02): THREE.BufferGeometry {
  const r = Math.min(radius, w / 2.5, h / 2.5, d / 2.5);
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: true,
    bevelThickness: r * 0.5,
    bevelSize: r * 0.5,
    bevelSegments: 3,
    curveSegments: 8,
  });
  geom.translate(0, 0, -d / 2);
  geom.computeVertexNormals();
  return geom;
}

/** Подушка с сильно скруглёнными углами и небольшой вогнутостью сверху (через scale). */
function pillow(w: number, h: number, d: number, radius = 0.05): THREE.Mesh {
  const geom = roundedBox(w, h, d, radius);
  const mesh = new THREE.Mesh(geom);
  return mesh;
}

/** Плоская мягкая контактная тень под объектом (имитирует AO). */
let cachedShadowTex: THREE.Texture | null = null;
function getContactShadowTex(): THREE.Texture {
  if (cachedShadowTex) return cachedShadowTex;
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(0,0,0,1)");
  g.addColorStop(0.4, "rgba(0,0,0,0.6)");
  g.addColorStop(0.75, "rgba(0,0,0,0.15)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  cachedShadowTex = new THREE.CanvasTexture(c);
  return cachedShadowTex;
}

function contactShadow(w: number, d: number): THREE.Mesh {
  const geom = new THREE.PlaneGeometry(w * 1.4, d * 1.4);
  const mat = new THREE.MeshBasicMaterial({
    map: getContactShadowTex(),
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    color: 0xffffff,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.003;
  mesh.renderOrder = 1;
  return mesh;
}

/* ─────────── Билдеры мебели ─────────── */

interface BuildCtx {
  w: number;          // ширина в м
  d: number;          // глубина в м
  h: number;          // высота в м
  color: number;      // акцентный цвет (hex)
  item: FurnitureItem;
}

function buildSofa({ w, d, h, color }: BuildCtx): THREE.Group {
  const g = new THREE.Group();
  const fabric = fabricMaterial(color);
  const legMat = woodMaterial("#3d2817", 0.5);

  // База (низкая, массивная)
  const baseH = h * 0.35;
  const base = new THREE.Mesh(roundedBox(w, baseH, d, 0.04), fabric);
  base.position.set(0, h * 0.18 + 0.05, 0);
  base.castShadow = base.receiveShadow = true;
  g.add(base);

  // Сиденье — несколько подушек
  const cushH = h * 0.18;
  const cushW = w / 2 - 0.04;
  for (let i = 0; i < 2; i++) {
    const cush = pillow(cushW, cushH, d * 0.85, 0.06);
    cush.material = fabric;
    cush.position.set((i === 0 ? -1 : 1) * (cushW / 2 + 0.02), h * 0.36 + cushH / 2, d * 0.05);
    cush.castShadow = true;
    g.add(cush);
  }

  // Спинка
  const backH = h * 0.5;
  const back = new THREE.Mesh(roundedBox(w, backH, d * 0.22, 0.06), fabric);
  back.position.set(0, h * 0.5 + backH / 2 - 0.02, -d * 0.39);
  back.rotation.x = -0.05;
  back.castShadow = true;
  g.add(back);

  // Подушки на спинке
  for (let i = 0; i < 2; i++) {
    const bp = pillow(cushW, h * 0.35, d * 0.18, 0.07);
    bp.material = fabric;
    bp.position.set((i === 0 ? -1 : 1) * (cushW / 2 + 0.02), h * 0.62, -d * 0.32);
    bp.rotation.x = -0.1;
    bp.castShadow = true;
    g.add(bp);
  }

  // Подлокотники
  const armW = 0.12;
  for (const x of [-w / 2 + armW / 2, w / 2 - armW / 2]) {
    const arm = new THREE.Mesh(roundedBox(armW, h * 0.55, d * 0.95, 0.04), fabric);
    arm.position.set(x, h * 0.18 + (h * 0.55) / 2, 0);
    arm.castShadow = true;
    g.add(arm);
  }

  // Ножки
  const legGeom = new THREE.CylinderGeometry(0.015, 0.015, h * 0.1, 8);
  for (const [x, z] of [
    [-w / 2 + 0.06, -d / 2 + 0.06], [w / 2 - 0.06, -d / 2 + 0.06],
    [-w / 2 + 0.06, d / 2 - 0.06], [w / 2 - 0.06, d / 2 - 0.06],
  ]) {
    const leg = new THREE.Mesh(legGeom, legMat);
    leg.position.set(x, h * 0.05, z);
    leg.castShadow = true;
    g.add(leg);
  }

  return g;
}

function buildBed({ w, d, h, color }: BuildCtx): THREE.Group {
  const g = new THREE.Group();
  const fabric = fabricMaterial(0xf8f6f2);
  const sheet = fabricMaterial(0xffffff);
  const headboard = woodMaterial("#5d3a1f", 0.5);
  const blanket = fabricMaterial(color);

  // Каркас
  const frameH = h * 0.4;
  const frame = new THREE.Mesh(
    roundedBox(w, frameH, d, 0.03),
    woodMaterial("#3d2817", 0.55),
  );
  frame.position.set(0, frameH / 2, 0);
  frame.castShadow = frame.receiveShadow = true;
  g.add(frame);

  // Матрас
  const matH = h * 0.35;
  const mat = new THREE.Mesh(roundedBox(w * 0.96, matH, d * 0.96, 0.05), fabric);
  mat.position.set(0, frameH + matH / 2, 0);
  mat.castShadow = true;
  g.add(mat);

  // Простыня сверху (тонкий слой)
  const sheetMesh = new THREE.Mesh(roundedBox(w * 0.92, 0.01, d * 0.92, 0.02), sheet);
  sheetMesh.position.set(0, frameH + matH + 0.005, 0);
  g.add(sheetMesh);

  // Одеяло (примерно 2/3 длины)
  const blanketD = d * 0.6;
  const blanketMesh = new THREE.Mesh(roundedBox(w * 0.9, 0.05, blanketD, 0.03), blanket);
  blanketMesh.position.set(0, frameH + matH + 0.03, d * 0.18);
  blanketMesh.castShadow = true;
  g.add(blanketMesh);

  // 2 подушки
  for (let i = 0; i < 2; i++) {
    const p = pillow(w * 0.35, 0.1, d * 0.22, 0.04);
    p.material = sheet;
    p.position.set((i === 0 ? -1 : 1) * w * 0.2, frameH + matH + 0.06, -d * 0.32);
    p.castShadow = true;
    g.add(p);
  }

  // Изголовье
  const headH = h * 1.4;
  const headMesh = new THREE.Mesh(roundedBox(w, headH, 0.05, 0.03), headboard);
  headMesh.position.set(0, headH / 2, -d / 2 - 0.025);
  headMesh.castShadow = true;
  g.add(headMesh);

  return g;
}

function buildTable({ w, d, h, color }: BuildCtx): THREE.Group {
  const g = new THREE.Group();
  const isWood = (color & 0xffffff) === 0 || color === 0xcbd5e1;
  const top = isWood ? woodMaterial("#8b5a2b", 0.4) : paintedMaterial(color, true);
  const legMat = metalMaterial(0x2a2a2a, 0.4);

  // Столешница
  const topH = 0.04;
  const tableTop = new THREE.Mesh(roundedBox(w, topH, d, 0.015), top);
  tableTop.position.set(0, h - topH / 2, 0);
  tableTop.castShadow = tableTop.receiveShadow = true;
  g.add(tableTop);

  // Ножки (тонкие металлические)
  const legR = 0.02;
  const legH = h - topH;
  const legGeom = new THREE.CylinderGeometry(legR, legR * 1.2, legH, 12);
  const inset = 0.06;
  for (const [x, z] of [
    [-w / 2 + inset, -d / 2 + inset], [w / 2 - inset, -d / 2 + inset],
    [-w / 2 + inset, d / 2 - inset], [w / 2 - inset, d / 2 - inset],
  ]) {
    const leg = new THREE.Mesh(legGeom, legMat);
    leg.position.set(x, legH / 2, z);
    leg.castShadow = true;
    g.add(leg);
  }

  return g;
}

function buildChair({ w, d, h, color }: BuildCtx): THREE.Group {
  const g = new THREE.Group();
  const seat = fabricMaterial(color);
  const frame = woodMaterial("#3d2817", 0.55);

  // Сиденье
  const seatH = 0.06;
  const seatY = h * 0.5;
  const s = new THREE.Mesh(roundedBox(w, seatH, d, 0.03), seat);
  s.position.set(0, seatY, 0);
  s.castShadow = true;
  g.add(s);

  // Спинка
  const backH = h * 0.5;
  const back = new THREE.Mesh(roundedBox(w * 0.95, backH, 0.04, 0.03), seat);
  back.position.set(0, seatY + backH / 2, -d / 2 + 0.02);
  back.castShadow = true;
  g.add(back);

  // 4 ножки
  const legR = 0.018;
  const legGeom = new THREE.CylinderGeometry(legR, legR * 0.9, seatY, 10);
  const inset = 0.04;
  for (const [x, z] of [
    [-w / 2 + inset, -d / 2 + inset], [w / 2 - inset, -d / 2 + inset],
    [-w / 2 + inset, d / 2 - inset], [w / 2 - inset, d / 2 - inset],
  ]) {
    const leg = new THREE.Mesh(legGeom, frame);
    leg.position.set(x, seatY / 2, z);
    leg.castShadow = true;
    g.add(leg);
  }

  return g;
}

function buildBath({ w, d, h, color }: BuildCtx): THREE.Group {
  const g = new THREE.Group();
  const ceramic = ceramicMaterial(0xfafafa);
  const water = new THREE.MeshPhysicalMaterial({
    color: 0xb8e6f0,
    roughness: 0.05,
    metalness: 0.0,
    transmission: 0.6,
    transparent: true,
    opacity: 0.85,
  });

  // Внешняя ванна (округлый бокс)
  const outer = new THREE.Mesh(roundedBox(w, h, d, 0.08), ceramic);
  outer.position.set(0, h / 2, 0);
  outer.castShadow = outer.receiveShadow = true;
  g.add(outer);

  // Внутренняя выемка (более тёмная)
  const inner = new THREE.Mesh(
    roundedBox(w * 0.85, h * 0.7, d * 0.85, 0.06),
    new THREE.MeshPhysicalMaterial({ color: 0xeef0f0, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 }),
  );
  inner.position.set(0, h * 0.55, 0);
  g.add(inner);

  // Вода (опционально, поверх внутренней)
  const w2 = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.8, 0.02, d * 0.8),
    water,
  );
  w2.position.set(0, h * 0.85, 0);
  g.add(w2);

  // Кран
  const tap = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.025, 0.06, 12),
    metalMaterial(0xc0c0c0, 0.15),
  );
  base.position.set(0, h + 0.03, -d / 2 + 0.05);
  tap.add(base);
  const spout = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.015, 0.15, 12),
    metalMaterial(0xc0c0c0, 0.15),
  );
  spout.rotation.x = Math.PI / 2;
  spout.position.set(0, h + 0.1, -d / 2 + 0.12);
  tap.add(spout);
  g.add(tap);

  return g;
}

function buildStorage({ w, d, h, color }: BuildCtx): THREE.Group {
  const g = new THREE.Group();
  const body = woodMaterial(`#${(color & 0xffffff).toString(16).padStart(6, "0")}`, 0.5);
  const handle = metalMaterial(0xa8a8a8, 0.2);

  // Основной корпус
  const main = new THREE.Mesh(roundedBox(w, h, d, 0.015), body);
  main.position.set(0, h / 2, 0);
  main.castShadow = main.receiveShadow = true;
  g.add(main);

  // Дверцы — вертикальные швы
  const doors = Math.max(2, Math.round(w / 0.5));
  const doorW = w / doors;
  for (let i = 1; i < doors; i++) {
    const seam = new THREE.Mesh(
      new THREE.BoxGeometry(0.003, h * 0.95, 0.005),
      new THREE.MeshStandardMaterial({ color: 0x222, roughness: 0.9 }),
    );
    seam.position.set(-w / 2 + i * doorW, h / 2, d / 2 + 0.001);
    g.add(seam);
  }

  // Ручки
  for (let i = 0; i < doors; i++) {
    const handleMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.06, 8),
      handle,
    );
    handleMesh.rotation.z = Math.PI / 2;
    handleMesh.position.set(-w / 2 + (i + 0.5) * doorW + doorW * 0.35, h / 2, d / 2 + 0.012);
    handleMesh.castShadow = true;
    g.add(handleMesh);
  }

  return g;
}

function buildAppliance({ w, d, h, color }: BuildCtx): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.2,
    metalness: 0.85,
    clearcoat: 0.5,
  });
  const screen = new THREE.MeshStandardMaterial({ color: 0x111, roughness: 0.4 });

  const main = new THREE.Mesh(roundedBox(w, h, d, 0.02), body);
  main.position.set(0, h / 2, 0);
  main.castShadow = main.receiveShadow = true;
  g.add(main);

  // Передняя панель / экран
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.6, h * 0.15), screen);
  sc.position.set(0, h * 0.7, d / 2 + 0.001);
  g.add(sc);

  return g;
}

function buildDecor({ w, d, h, color }: BuildCtx): THREE.Group {
  const g = new THREE.Group();
  const isFlat = h < 0.1;
  const mat = paintedMaterial(color, true);

  if (isFlat) {
    // Ковёр / картина — плоский плоский
    const carpet = new THREE.Mesh(roundedBox(w, h, d, 0.01), fabricMaterial(color));
    carpet.position.set(0, h / 2, 0);
    carpet.receiveShadow = true;
    g.add(carpet);
  } else {
    // Лампа / тумбочка / прочий объёмный декор
    const m = new THREE.Mesh(roundedBox(w, h, d, 0.025), mat);
    m.position.set(0, h / 2, 0);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
  }
  return g;
}

function buildKitchen({ w, d, h, color }: BuildCtx): THREE.Group {
  const g = new THREE.Group();
  // Кухонный модуль = шкаф + столешница + плинтус
  const cabinet = new THREE.Mesh(
    roundedBox(w, h * 0.95, d, 0.01),
    paintedMaterial(color, false),
  );
  cabinet.position.set(0, h * 0.475 + 0.025, 0);
  cabinet.castShadow = cabinet.receiveShadow = true;
  g.add(cabinet);

  // Цоколь
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.96, 0.05, d * 0.9),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 }),
  );
  plinth.position.set(0, 0.025, 0);
  g.add(plinth);

  // Столешница (камень)
  const top = new THREE.Mesh(
    roundedBox(w + 0.02, 0.04, d + 0.02, 0.005),
    new THREE.MeshPhysicalMaterial({ color: 0xe5e5e5, roughness: 0.3, clearcoat: 0.6 }),
  );
  top.position.set(0, h - 0.02, 0);
  top.castShadow = true;
  g.add(top);

  // Ручки
  const handle = metalMaterial(0x999, 0.2);
  const doors = Math.max(2, Math.round(w / 0.45));
  const doorW = w / doors;
  for (let i = 0; i < doors; i++) {
    const hMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.08, 8), handle);
    hMesh.rotation.z = Math.PI / 2;
    hMesh.position.set(-w / 2 + (i + 0.5) * doorW, h * 0.75, d / 2 + 0.012);
    g.add(hMesh);
  }

  return g;
}

/* ─────────── Главный билдер ─────────── */

const HEIGHTS_CM: Record<string, number> = {
  sofa: 80, bed: 50, table: 75, chair: 90, kitchen: 90,
  bath: 60, storage: 200, appliance: 85, decor: 30,
};

export function buildRealisticFurniture(item: FurnitureItem): THREE.Group {
  const g = new THREE.Group();
  const w = item.w * CM;
  const d = item.h * CM;
  const hCm = HEIGHTS_CM[item.category] ?? 75;
  const h = hCm * CM;
  const color = item.color ? new THREE.Color(item.color).getHex() : 0xb89978;

  const ctx: BuildCtx = { w, d, h, color, item };

  let model: THREE.Group;
  switch (item.category) {
    case "sofa":      model = buildSofa(ctx); break;
    case "bed":       model = buildBed(ctx); break;
    case "table":     model = buildTable(ctx); break;
    case "chair":     model = buildChair(ctx); break;
    case "bath":      model = buildBath(ctx); break;
    case "storage":   model = buildStorage(ctx); break;
    case "appliance": model = buildAppliance(ctx); break;
    case "kitchen":   model = buildKitchen(ctx); break;
    default:          model = buildDecor(ctx);
  }

  // Контактная мягкая тень под моделью
  const shadow = contactShadow(w, d);
  g.add(shadow);
  g.add(model);

  // Все mesh кастуют тени
  model.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });

  // Позиция в плане
  const cx = (item.x + item.w / 2) * CM;
  const cz = (item.y + item.h / 2) * CM;
  g.position.set(cx, 0, cz);
  g.rotation.y = -((item.rotation || 0) * Math.PI) / 180;

  return g;
}