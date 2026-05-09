import * as THREE from "three";
import type { FloorPlan, FurnitureItem, Wall } from "@/lib/floorPlan";
import { dist, pointOnWall } from "@/lib/floorPlanGeom";
import {
  CM,
  makeFloorMaps,
  makeWallMaps,
  makeFloorTexture,
  makeWallTexture,
  type FloorStyle,
  type WallStyle,
} from "./textures";
import { buildRealisticFurniture } from "./realisticFurniture";

/**
 * «Строители» Three-объектов для 3D-планировщика:
 *  - стены с проёмами (двери, окна со стеклом, перемычки, подоконники)
 *  - мебель разных категорий (диван, кровать, стол, стул, ванна, бокс)
 *  - полная пересборка интерьера (rebuildRoom)
 *  - вычисление центра плана (computePlanCenter)
 *
 * Логика 1:1 перенесена из PlanScene3D.tsx без изменений.
 */

export interface OpeningOnWall {
  start: number;   // позиция начала проёма вдоль стены, см
  end: number;     // конец, см
  bottom: number;  // высота низа, см (0 для двери)
  top: number;     // высота верха, см (200 для двери, 200 для окна)
}

export function buildWallGroup(
  wall: Wall,
  wallHeight: number,
  openings: OpeningOnWall[],
  material: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();
  const len = dist(wall.a, wall.b);
  // Сортируем проёмы по началу
  const sorted = [...openings].sort((a, b) => a.start - b.start);

  // Стена в локальных координатах: лежит вдоль X от 0 до len*CM, высота по Y
  // Разбиваем на сегменты с проёмами
  let cursor = 0;
  const thickness = wall.thickness * CM;
  const h = wallHeight * CM;

  const segments: { from: number; to: number }[] = [];
  for (const op of sorted) {
    if (op.start > cursor) segments.push({ from: cursor, to: op.start });
    cursor = Math.max(cursor, op.end);
  }
  if (cursor < len) segments.push({ from: cursor, to: len });

  // Полные стены между проёмами
  for (const s of segments) {
    const sLen = (s.to - s.from) * CM;
    if (sLen <= 0) continue;
    const geom = new THREE.BoxGeometry(sLen, h, thickness);
    const mesh = new THREE.Mesh(geom, material);
    mesh.position.set(s.from * CM + sLen / 2, h / 2, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // Перемычки над проёмами (от верха проёма до потолка)
  for (const op of sorted) {
    const opLen = (op.end - op.start) * CM;
    const opTopM = op.top * CM;
    if (h > opTopM) {
      const lintelH = h - opTopM;
      const geom = new THREE.BoxGeometry(opLen, lintelH, thickness);
      const mesh = new THREE.Mesh(geom, material);
      mesh.position.set(op.start * CM + opLen / 2, opTopM + lintelH / 2, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    // Подоконник снизу окна (от 0 до низа окна)
    if (op.bottom > 0) {
      const sillH = op.bottom * CM;
      const geom = new THREE.BoxGeometry(opLen, sillH, thickness);
      const mesh = new THREE.Mesh(geom, material);
      mesh.position.set(op.start * CM + opLen / 2, sillH / 2, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      // Стекло окна
      const glassGeom = new THREE.BoxGeometry(opLen * 0.92, (op.top - op.bottom) * CM * 0.92, thickness * 0.2);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x88c8ff, transparent: true, opacity: 0.35,
        roughness: 0.05, metalness: 0.1, transmission: 0.7,
      });
      const glass = new THREE.Mesh(glassGeom, glassMat);
      glass.position.set(op.start * CM + opLen / 2, (op.top + op.bottom) * CM / 2, 0);
      group.add(glass);
    }
  }

  // Поворот всей группы по направлению стены
  const angle = Math.atan2(wall.b.y - wall.a.y, wall.b.x - wall.a.x);
  group.rotation.y = -angle;
  group.position.set(wall.a.x * CM, 0, wall.a.y * CM);

  return group;
}

export function buildFurniture(item: FurnitureItem): THREE.Group {
  const g = new THREE.Group();
  const w = item.w * CM;
  const d = item.h * CM;
  const color = item.color ? new THREE.Color(item.color).getHex() : 0xcbd5e1;

  // Высоты по категории (см)
  const heights: Record<string, number> = {
    sofa: 80, bed: 50, table: 75, chair: 90, kitchen: 90,
    bath: 60, storage: 200, appliance: 85, decor: 30,
  };
  const hCm = heights[item.category] ?? 75;
  const h = hCm * CM;

  const mainMat = new THREE.MeshStandardMaterial({
    color, roughness: 0.7, metalness: 0.1,
  });

  if (item.category === "sofa") {
    // База + спинка + подлокотники
    const base = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.5, d), mainMat);
    base.position.set(0, h * 0.25, 0);
    base.castShadow = true;
    g.add(base);
    const back = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.5, d * 0.25), mainMat);
    back.position.set(0, h * 0.75, -d * 0.375);
    back.castShadow = true;
    g.add(back);
  } else if (item.category === "bed") {
    const matress = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.6, d), mainMat);
    matress.position.set(0, h * 0.3, 0);
    matress.castShadow = true;
    g.add(matress);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.8 });
    const head = new THREE.Mesh(new THREE.BoxGeometry(w, h * 1.5, d * 0.1), headMat);
    head.position.set(0, h * 0.75, -d * 0.5 + 0.05);
    head.castShadow = true;
    g.add(head);
  } else if (item.category === "table") {
    const top = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.05, d), mainMat);
    top.position.set(0, h * 0.95, 0);
    top.castShadow = true;
    g.add(top);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x44403c });
    const legGeom = new THREE.BoxGeometry(0.05, h * 0.95, 0.05);
    [
      [-w/2 + 0.05, -d/2 + 0.05], [w/2 - 0.05, -d/2 + 0.05],
      [-w/2 + 0.05, d/2 - 0.05], [w/2 - 0.05, d/2 - 0.05],
    ].forEach(([x, z]) => {
      const leg = new THREE.Mesh(legGeom, legMat);
      leg.position.set(x, h * 0.475, z);
      leg.castShadow = true;
      g.add(leg);
    });
  } else if (item.category === "chair") {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.05, d), mainMat);
    seat.position.set(0, h * 0.5, 0);
    seat.castShadow = true;
    g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.5, d * 0.1), mainMat);
    back.position.set(0, h * 0.75, -d * 0.45);
    back.castShadow = true;
    g.add(back);
  } else if (item.category === "bath") {
    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(Math.min(w, d) / 2, Math.min(w, d) / 2, h, 24, 1, false),
      mainMat,
    );
    cyl.scale.set(w / Math.min(w, d), 1, d / Math.min(w, d));
    cyl.position.set(0, h / 2, 0);
    cyl.castShadow = true;
    g.add(cyl);
  } else {
    // Универсальный «бокс»
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mainMat);
    box.position.set(0, h / 2, 0);
    box.castShadow = true;
    g.add(box);
  }

  // Поставить в мировые координаты
  const cx = (item.x + item.w / 2) * CM;
  const cz = (item.y + item.h / 2) * CM;
  g.position.set(cx, 0, cz);
  g.rotation.y = -((item.rotation || 0) * Math.PI) / 180;

  return g;
}

export function computePlanCenter(plan: FloorPlan): { x: number; z: number } {
  if (plan.walls.length === 0) return { x: 0, z: 0 };
  const xs = plan.walls.flatMap((w) => [w.a.x, w.b.x]);
  const ys = plan.walls.flatMap((w) => [w.a.y, w.b.y]);
  return {
    x: ((Math.min(...xs) + Math.max(...xs)) / 2) * CM,
    z: ((Math.min(...ys) + Math.max(...ys)) / 2) * CM,
  };
}

export function rebuildRoom(
  room: THREE.Group,
  plan: FloorPlan,
  wallHeight: number,
  wallStyle: WallStyle,
  floorStyle: FloorStyle,
) {
  // Очистка старой геометрии
  while (room.children.length) {
    const c = room.children[0];
    room.remove(c);
    (c as THREE.Mesh).geometry?.dispose?.();
  }

  // Пол: bbox по стенам или дефолт
  let minX = 0, maxX = 600, minY = 0, maxY = 600;
  if (plan.walls.length) {
    const xs = plan.walls.flatMap((w) => [w.a.x, w.b.x]);
    const ys = plan.walls.flatMap((w) => [w.a.y, w.b.y]);
    minX = Math.min(...xs) - 30; maxX = Math.max(...xs) + 30;
    minY = Math.min(...ys) - 30; maxY = Math.max(...ys) + 30;
  }
  const fW = (maxX - minX) * CM;
  const fD = (maxY - minY) * CM;

  // Пол — PBR с normalMap и roughnessMap
  const floorMaps = makeFloorMaps(floorStyle);
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorMaps.map,
    normalMap: floorMaps.normalMap,
    normalScale: new THREE.Vector2(0.6, 0.6),
    roughnessMap: floorMaps.roughnessMap,
    roughness: floorStyle === "tile" ? 0.3 : 0.7,
    metalness: 0.05,
    envMapIntensity: 0.7,
  });
  // Подгоняем повторение под размер пола
  const repeatScale = Math.max(2, Math.min(fW, fD) / 1.2);
  for (const t of [floorMaps.map, floorMaps.normalMap, floorMaps.roughnessMap]) {
    t.repeat.set(repeatScale, repeatScale);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(fW, fD), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set((minX + maxX) / 2 * CM, 0, (minY + maxY) / 2 * CM);
  floor.receiveShadow = true;
  room.add(floor);

  // Потолок (полупрозрачный — для атмосферы)
  const ceilMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.0, // невидим, но для теней оставлен
    side: THREE.DoubleSide,
  });
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(fW, fD), ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set((minX + maxX) / 2 * CM, wallHeight * CM, (minY + maxY) / 2 * CM);
  room.add(ceiling);

  // Стены с проёмами — PBR
  const wallMaps = makeWallMaps(wallStyle);
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallMaps.map,
    normalMap: wallMaps.normalMap,
    normalScale: new THREE.Vector2(0.4, 0.4),
    roughnessMap: wallMaps.roughnessMap,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide,
    envMapIntensity: 0.4,
  });

  // Плинтус — тёмный декоративный элемент по периметру комнаты
  const baseboardMat = new THREE.MeshStandardMaterial({
    color: 0xfafaf7,
    roughness: 0.5,
  });
  const BASEBOARD_H = 0.08;
  const BASEBOARD_T = 0.015;

  for (const wall of plan.walls) {
    const len = dist(wall.a, wall.b);
    // Собираем проёмы для этой стены
    const ops = plan.openings
      .filter((o) => o.wallId === wall.id)
      .map((o) => {
        const center = o.t * len;
        const half = o.width / 2;
        const isDoor = o.kind === "door";
        return {
          start: Math.max(0, center - half),
          end: Math.min(len, center + half),
          bottom: isDoor ? 0 : 90,    // окна на высоте 90 см
          top: isDoor ? 200 : 210,    // дверь до 200, окно до 210
        } as OpeningOnWall;
      });
    const group = buildWallGroup(wall, wallHeight, ops, wallMat);
    room.add(group);

    // Плинтус — низкая планка вдоль стены
    const angle = Math.atan2(wall.b.y - wall.a.y, wall.b.x - wall.a.x);
    const wallLenM = len * CM;
    const baseboard = new THREE.Mesh(
      new THREE.BoxGeometry(wallLenM, BASEBOARD_H, BASEBOARD_T),
      baseboardMat,
    );
    baseboard.position.set(
      (wall.a.x + wall.b.x) / 2 * CM,
      BASEBOARD_H / 2,
      (wall.a.y + wall.b.y) / 2 * CM,
    );
    baseboard.rotation.y = -angle;
    // Сдвигаем плинтус так, чтобы он торчал чуть в комнату
    const offsetX = -Math.sin(angle) * (wall.thickness * CM / 2 + BASEBOARD_T / 2);
    const offsetZ = -Math.cos(angle) * (wall.thickness * CM / 2 + BASEBOARD_T / 2);
    baseboard.position.x += offsetX;
    baseboard.position.z += offsetZ;
    baseboard.castShadow = true;
    baseboard.receiveShadow = true;
    room.add(baseboard);

    // Дверной блок (рама)
    for (const op of plan.openings.filter((o) => o.wallId === wall.id)) {
      const center = pointOnWall(wall, op.t);
      const isDoor = op.kind === "door";
      if (isDoor) {
        // Полотно двери (открыто на 90°) — реалистичное дерево
        const doorMat = new THREE.MeshPhysicalMaterial({
          color: 0x8b5a2b,
          roughness: 0.55,
          metalness: 0.05,
          clearcoat: 0.3,
          clearcoatRoughness: 0.5,
        });
        const door = new THREE.Mesh(
          new THREE.BoxGeometry(op.width * CM, 200 * CM, 4 * CM),
          doorMat,
        );
        door.position.set(0, 100 * CM, 0);
        door.castShadow = true;
        const pivot = new THREE.Group();
        pivot.add(door);
        door.position.x = (op.width * CM) / 2;
        pivot.rotation.y = -Math.PI / 2.5;
        const wrap = new THREE.Group();
        wrap.add(pivot);
        pivot.position.x = -op.width * CM / 2;
        wrap.position.set(center.x * CM, 0, center.y * CM);
        wrap.rotation.y = -angle;
        room.add(wrap);

        // Дверная ручка
        const handle = new THREE.Mesh(
          new THREE.SphereGeometry(0.025, 12, 8),
          new THREE.MeshStandardMaterial({ color: 0xc0a060, roughness: 0.2, metalness: 0.9 }),
        );
        handle.position.set(0, 100 * CM, 0);
        // позиционируем у двери
        const handleWrap = new THREE.Group();
        handleWrap.add(handle);
        handle.position.set(op.width * CM * 0.85, 0, 0.04);
        handleWrap.position.copy(pivot.position);
        handleWrap.rotation.copy(pivot.rotation);
        wrap.add(handleWrap);
      }
    }
  }

  // Мебель — реалистичная PBR
  for (const item of plan.furniture) {
    room.add(buildRealisticFurniture(item));
  }
}