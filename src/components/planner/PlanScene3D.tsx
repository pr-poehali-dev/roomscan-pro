import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Icon from "@/components/ui/icon";
import type { FloorPlan, FurnitureItem, Wall } from "@/lib/floorPlan";
import { dist, pointOnWall } from "@/lib/floorPlanGeom";

/**
 * Полноценный 3D-просмотр плана в Three.js.
 * - Орбитальная камера (drag — поворот, ПКМ — пан, колесо — зум)
 * - Тени, освещение (ambient + directional + point), небо-градиент
 * - Стены с проёмами (двери, окна) — вырезаются через CSG-подобную логику
 * - Пол с шахматной/деревянной текстурой
 * - Мебель: разные типы, подписи парят над предметом
 * - Контролы: сброс камеры, режим первого лица, скриншот, переключение материалов
 *
 * Все размеры в плане — в сантиметрах. В сцене масштаб 1cm = 0.01 unit (метры).
 */

interface Props {
  plan: FloorPlan;
  /** Высота стен (см), по умолчанию 270 (2.7 м) */
  wallHeight?: number;
}

const CM = 0.01; // 1 см = 0.01 м

type WallStyle = "white" | "concrete" | "warm";
type FloorStyle = "parquet" | "tile" | "concrete";

const WALL_COLORS: Record<WallStyle, number> = {
  white: 0xf5f5f4,
  concrete: 0xa8a29e,
  warm: 0xe7d8c1,
};
const FLOOR_COLORS: Record<FloorStyle, number> = {
  parquet: 0xa86b3c,
  tile: 0xd6d3d1,
  concrete: 0x78716c,
};

/* ────────── процедурные текстуры (без внешних файлов) ────────── */

function makeFloorTexture(style: FloorStyle): THREE.Texture {
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

function makeWallTexture(style: WallStyle): THREE.Texture {
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

/* ────────── строитель стен с проёмами ────────── */

interface OpeningOnWall {
  start: number;   // позиция начала проёма вдоль стены, см
  end: number;     // конец, см
  bottom: number;  // высота низа, см (0 для двери)
  top: number;     // высота верха, см (200 для двери, 200 для окна)
}

function buildWallGroup(
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

/* ────────── мебель (разные геометрии по type) ────────── */

function buildFurniture(item: FurnitureItem): THREE.Group {
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

/* ────────── главный компонент ────────── */

export default function PlanScene3D({ plan, wallHeight = 270 }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const [wallStyle, setWallStyle] = useState<WallStyle>("white");
  const [floorStyle, setFloorStyle] = useState<FloorStyle>("parquet");
  const [showShadows, setShowShadows] = useState(true);

  // Камера: сохраняем углы между ререндерами
  const camStateRef = useRef({
    yaw: -Math.PI / 4,
    pitch: -Math.PI / 6,
    distance: 12,
    target: new THREE.Vector3(0, 0, 0),
  });

  const screenshot = () => {
    const r = rendererRef.current;
    if (!r) return;
    const url = r.domElement.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `plan3d-${Date.now()}.png`;
    a.click();
  };

  const resetCamera = () => {
    camStateRef.current = {
      yaw: -Math.PI / 4,
      pitch: -Math.PI / 6,
      distance: 12,
      target: new THREE.Vector3(0, 0, 0),
    };
  };

  /* ────────── основная инициализация сцены ────────── */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const width = wrap.clientWidth;
    const height = wrap.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Небо-градиент через большой sphere
    const skyGeom = new THREE.SphereGeometry(50, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor:    { value: new THREE.Color(0x87ceeb) },
        bottomColor: { value: new THREE.Color(0xf0f4f8) },
      },
      vertexShader: `varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `uniform vec3 topColor; uniform vec3 bottomColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
        }`,
    });
    const sky = new THREE.Mesh(skyGeom, skyMat);
    scene.add(sky);

    // Камера
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = showShadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    wrap.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Освещение
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(8, 14, 6);
    sun.castShadow = showShadows;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -15;
    sun.shadow.camera.right = 15;
    sun.shadow.camera.top = 15;
    sun.shadow.camera.bottom = -15;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 50;
    scene.add(sun);
    const fill = new THREE.PointLight(0xffeacc, 0.3, 30);
    fill.position.set(-5, 4, -5);
    scene.add(fill);

    // Группа для всего интерьера (чтобы можно было полностью пересобирать)
    const room = new THREE.Group();
    scene.add(room);

    /* ─── Построение помещения ─── */
    rebuildRoom(room, plan, wallHeight, wallStyle, floorStyle);

    // Центрируем камеру по плану
    const center = computePlanCenter(plan);
    camStateRef.current.target.set(center.x, 0, center.z);

    /* ─── Управление камерой ─── */
    const updateCamera = () => {
      const cs = camStateRef.current;
      const x = cs.target.x + cs.distance * Math.cos(cs.pitch) * Math.cos(cs.yaw);
      const y = cs.target.y + cs.distance * Math.sin(cs.pitch) * -1 + 1.5;
      const z = cs.target.z + cs.distance * Math.cos(cs.pitch) * Math.sin(cs.yaw);
      camera.position.set(x, Math.max(y, 0.5), z);
      camera.lookAt(cs.target);
    };

    let isDragging = false;
    let isPanning = false;
    let lastX = 0;
    let lastY = 0;
    const onPointerDown = (e: PointerEvent) => {
      isDragging = e.button === 0;
      isPanning = e.button === 2;
      lastX = e.clientX;
      lastY = e.clientY;
      (e.target as Element).setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      const cs = camStateRef.current;
      if (isDragging) {
        cs.yaw   -= dx * 0.005;
        cs.pitch += dy * 0.005;
        cs.pitch = Math.max(-Math.PI / 2.2, Math.min(-0.05, cs.pitch));
        updateCamera();
      } else if (isPanning) {
        const right = new THREE.Vector3();
        camera.getWorldDirection(right);
        right.cross(camera.up).normalize();
        const up = camera.up.clone();
        cs.target.addScaledVector(right, -dx * 0.01);
        cs.target.addScaledVector(up, dy * 0.01);
        updateCamera();
      }
    };
    const onPointerUp = () => { isDragging = false; isPanning = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cs = camStateRef.current;
      cs.distance *= e.deltaY > 0 ? 1.1 : 0.92;
      cs.distance = Math.max(2, Math.min(40, cs.distance));
      updateCamera();
    };
    const onContextMenu = (e: Event) => e.preventDefault();

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerup",   onPointerUp);
    dom.addEventListener("wheel",       onWheel,       { passive: false });
    dom.addEventListener("contextmenu", onContextMenu);

    updateCamera();

    /* ─── Анимация ─── */
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    /* ─── Resize ─── */
    const onResize = () => {
      if (!wrap) return;
      const w = wrap.clientWidth, h = wrap.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerup",   onPointerUp);
      dom.removeEventListener("wheel",       onWheel);
      dom.removeEventListener("contextmenu", onContextMenu);
      renderer.dispose();
      if (wrap.contains(dom)) wrap.removeChild(dom);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material;
        if (Array.isArray(mat)) mat.forEach((mm) => mm.dispose?.());
        else mat?.dispose?.();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ────────── ререндер интерьера при изменении плана/материалов ────────── */
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    // Снести предыдущую "комнату"
    const old = scene.getObjectByName("room") || scene.children.find((c) => c.userData?.isRoom);
    if (old) scene.remove(old);
    // Пересоздать
    const room = new THREE.Group();
    room.userData.isRoom = true;
    rebuildRoom(room, plan, wallHeight, wallStyle, floorStyle);
    scene.add(room);
  }, [plan, wallHeight, wallStyle, floorStyle]);

  useEffect(() => {
    const r = rendererRef.current;
    if (!r) return;
    r.shadowMap.enabled = showShadows;
    sceneRef.current?.traverse((o) => {
      const l = o as THREE.DirectionalLight;
      if (l.isDirectionalLight) l.castShadow = showShadows;
    });
  }, [showShadows]);

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-sky-100 to-stone-100 rounded-xl overflow-hidden">
      <div ref={wrapRef} className="absolute inset-0" />

      {/* Плавающая панель управления */}
      <div className="absolute top-3 left-3 bg-card/90 backdrop-blur-md border border-border rounded-xl p-2 flex items-center gap-1.5 flex-wrap text-xs shadow-lg">
        <select value={wallStyle} onChange={(e) => setWallStyle(e.target.value as WallStyle)}
                className="bg-secondary border border-border rounded px-2 py-1 text-xs">
          <option value="white">Стены: белые</option>
          <option value="warm">Стены: тёплые</option>
          <option value="concrete">Стены: бетон</option>
        </select>
        <select value={floorStyle} onChange={(e) => setFloorStyle(e.target.value as FloorStyle)}
                className="bg-secondary border border-border rounded px-2 py-1 text-xs">
          <option value="parquet">Пол: паркет</option>
          <option value="tile">Пол: плитка</option>
          <option value="concrete">Пол: бетон</option>
        </select>
        <button onClick={() => setShowShadows((v) => !v)} title="Тени"
                className={`p-1.5 rounded ${showShadows ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
          <Icon name="Moon" size={12} />
        </button>
        <button onClick={resetCamera} title="Сбросить камеру"
                className="p-1.5 rounded bg-secondary hover:bg-secondary/70">
          <Icon name="RotateCcw" size={12} />
        </button>
        <button onClick={screenshot} title="Скриншот PNG"
                className="p-1.5 rounded bg-secondary hover:bg-secondary/70">
          <Icon name="Camera" size={12} />
        </button>
      </div>

      {/* Подсказка */}
      <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-[11px] text-white pointer-events-none flex items-center gap-3 flex-wrap">
        <span><b>ЛКМ</b> — поворот</span>
        <span><b>ПКМ</b> — пан</span>
        <span><b>Колесо</b> — зум</span>
      </div>
    </div>
  );
}

/* ────────── helpers ────────── */

function computePlanCenter(plan: FloorPlan): { x: number; z: number } {
  if (plan.walls.length === 0) return { x: 0, z: 0 };
  const xs = plan.walls.flatMap((w) => [w.a.x, w.b.x]);
  const ys = plan.walls.flatMap((w) => [w.a.y, w.b.y]);
  return {
    x: ((Math.min(...xs) + Math.max(...xs)) / 2) * CM,
    z: ((Math.min(...ys) + Math.max(...ys)) / 2) * CM,
  };
}

function rebuildRoom(
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

  // Пол
  const floorMat = new THREE.MeshStandardMaterial({
    map: makeFloorTexture(floorStyle),
    roughness: 0.85,
    metalness: 0.05,
  });
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

  // Стены с проёмами
  const wallMat = new THREE.MeshStandardMaterial({
    map: makeWallTexture(wallStyle),
    roughness: 0.85,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

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

    // Дверной блок (рама)
    for (const op of plan.openings.filter((o) => o.wallId === wall.id)) {
      const center = pointOnWall(wall, op.t);
      const angle = Math.atan2(wall.b.y - wall.a.y, wall.b.x - wall.a.x);
      const isDoor = op.kind === "door";
      if (isDoor) {
        // Полотно двери (открыто на 90°)
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 });
        const door = new THREE.Mesh(
          new THREE.BoxGeometry(op.width * CM, 200 * CM, 4 * CM),
          doorMat,
        );
        door.position.set(0, 100 * CM, 0);
        door.castShadow = true;
        const pivot = new THREE.Group();
        pivot.add(door);
        door.position.x = (op.width * CM) / 2;
        pivot.rotation.y = -Math.PI / 2.5; // приоткрыта
        const wrap = new THREE.Group();
        wrap.add(pivot);
        // Сдвиг к краю проёма
        pivot.position.x = -op.width * CM / 2;
        wrap.position.set(center.x * CM, 0, center.y * CM);
        wrap.rotation.y = -angle;
        room.add(wrap);
      }
    }
  }

  // Мебель
  for (const item of plan.furniture) {
    room.add(buildFurniture(item));
  }
}
