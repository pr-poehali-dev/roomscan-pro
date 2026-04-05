import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import Icon from "@/components/ui/icon";

export interface Point3D {
  x: number;
  y: number;
  z: number;
  /** 0–1, используется для окраски точки */
  intensity?: number;
}

export interface RoomBox {
  width: number;
  depth: number;
  height: number;
  area: number;
}

interface Props {
  points: Point3D[];
  room?: RoomBox;
  /** Высота canvas в пикселях, дефолт 340 */
  height?: number;
  /** Показывать wireframe-параллелепипед комнаты */
  showRoom?: boolean;
  /** Показывать измерительные метки */
  showLabels?: boolean;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildPointCloud(points: Point3D[], color1: THREE.Color, color2: THREE.Color) {
  const n = points.length;
  const positions = new Float32Array(n * 3);
  const colors    = new Float32Array(n * 3);

  let minY = Infinity, maxY = -Infinity;
  for (const p of points) { if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y; }
  const rangeY = maxY - minY + 0.001;

  for (let i = 0; i < n; i++) {
    const p = points[i];
    positions[i * 3]     = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;

    const t = p.intensity ?? (p.y - minY) / rangeY;
    const c = color1.clone().lerp(color2, t);
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color",    new THREE.BufferAttribute(colors,    3));
  geo.computeBoundingBox();

  const mat = new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
  });
  return new THREE.Points(geo, mat);
}

function buildRoomWireframe(room: RoomBox): THREE.LineSegments {
  const { width, depth, height } = room;
  const geo = new THREE.BoxGeometry(width, height, depth);
  const edges = new THREE.EdgesGeometry(geo);
  const mat = new THREE.LineBasicMaterial({
    color: 0x22c55e,
    transparent: true,
    opacity: 0.25,
  });
  const mesh = new THREE.LineSegments(edges, mat);
  mesh.position.set(0, 0, 0);
  return mesh;
}

function buildGrid(size: number): THREE.GridHelper {
  const grid = new THREE.GridHelper(size, Math.round(size * 2), 0x1a2e1a, 0x0d1a0d);
  return grid;
}

function buildAxes(): THREE.AxesHelper {
  return new THREE.AxesHelper(0.4);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PointCloud3D({
  points,
  room,
  height = 340,
  showRoom = true,
  showLabels = true,
}: Props) {
  const mountRef  = useRef<HTMLDivElement>(null);
  const rafRef    = useRef<number>(0);
  const isDragRef = useRef(false);
  const prevRef   = useRef({ x: 0, y: 0 });

  const [autoRotate, setAutoRotate] = useState(true);
  const autoRotateRef = useRef(true);
  const [viewMode, setViewMode]     = useState<"3d" | "top" | "front">("3d");

  // держим ссылки на объекты Three.js, чтобы обновлять их без пересоздания сцены
  const sceneRef    = useRef<THREE.Scene | null>(null);
  const cameraRef   = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pivotRef    = useRef<THREE.Group | null>(null);
  const pcRef       = useRef<THREE.Points | null>(null);

  // ── инициализация Three.js ──────────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current || points.length === 0) return;
    const el = mountRef.current;

    const W = el.clientWidth || 600;
    const H = height;

    // scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060b12);
    sceneRef.current = scene;

    // camera
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.01, 200);
    camera.position.set(0, 2, 6);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ambient + directional light (влияет только на mesh, не на points)
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dir = new THREE.DirectionalLight(0x22ff88, 1.2);
    dir.position.set(3, 6, 3);
    scene.add(dir);

    // grid
    const gridSize = room ? Math.max(room.width, room.depth) * 1.5 + 2 : 10;
    scene.add(buildGrid(gridSize));
    scene.add(buildAxes());

    // pivot (вращается при орбите)
    const pivot = new THREE.Group();
    sceneRef.current.add(pivot);
    pivotRef.current = pivot;

    // point cloud
    const c1 = new THREE.Color(0x16a34a); // тёмно-зелёный (далеко)
    const c2 = new THREE.Color(0x86efac); // светло-зелёный (близко)

    // центрируем облако по bbox
    const raw = points;
    const xs = raw.map((p) => p.x);
    const ys = raw.map((p) => p.y);
    const zs = raw.map((p) => p.z);
    const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
    const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    const cz = (Math.max(...zs) + Math.min(...zs)) / 2;
    const centered = raw.map((p) => ({ ...p, x: p.x - cx, y: p.y - cy, z: p.z - cz }));

    const pc = buildPointCloud(centered, c1, c2);
    pivot.add(pc);
    pcRef.current = pc;

    // room wireframe
    if (showRoom && room) {
      const wire = buildRoomWireframe(room);
      pivot.add(wire);

      // floor plane
      const floorGeo = new THREE.PlaneGeometry(room.width, room.depth);
      const floorMat = new THREE.MeshBasicMaterial({
        color: 0x0d2010, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -room.height / 2;
      pivot.add(floor);
    }

    // ── анимация ──
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      if (autoRotateRef.current && !isDragRef.current) {
        pivot.rotation.y += 0.004;
      }
      renderer.render(scene, camera);
    };
    animate();

    // ── resize ──
    const onResize = () => {
      if (!el) return;
      const w = el.clientWidth;
      renderer.setSize(w, H);
      camera.aspect = w / H;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
     
  }, [points, room, height, showRoom]);

  // ── синхронизируем autoRotate ref ──
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  // ── смена вида камеры ──
  useEffect(() => {
    const cam = cameraRef.current;
    if (!cam) return;
    if (viewMode === "3d")    { cam.position.set(0, 2, 6);  cam.lookAt(0, 0, 0); }
    if (viewMode === "top")   { cam.position.set(0, 8, 0);  cam.lookAt(0, 0, 0); }
    if (viewMode === "front") { cam.position.set(0, 0, 8);  cam.lookAt(0, 0, 0); }
  }, [viewMode]);

  // ── drag-to-orbit (мышь + тач) ──
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragRef.current = true;
    prevRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragRef.current || !pivotRef.current) return;
    const dx = e.clientX - prevRef.current.x;
    const dy = e.clientY - prevRef.current.y;
    prevRef.current = { x: e.clientX, y: e.clientY };
    pivotRef.current.rotation.y += dx * 0.008;
    pivotRef.current.rotation.x += dy * 0.004;
    pivotRef.current.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pivotRef.current.rotation.x));
  }, []);

  const onPointerUp = useCallback(() => { isDragRef.current = false; }, []);

  // ── scroll-to-zoom ──
  const onWheel = useCallback((e: React.WheelEvent) => {
    const cam = cameraRef.current;
    if (!cam) return;
    cam.position.z = Math.max(1, Math.min(16, cam.position.z + e.deltaY * 0.01));
  }, []);

  if (points.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-[#060b12]"
        style={{ height }}
      >
        <Icon name="Box" size={32} className="text-border" />
        <p className="text-muted-foreground text-sm">Point cloud появится после сканирования</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-[#060b12] relative select-none">
      {/* 3D canvas */}
      <div
        ref={mountRef}
        style={{ height, cursor: "grab" }}
        className="w-full"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
      />

      {/* Тулбар */}
      <div className="absolute top-3 left-3 right-3 flex items-center gap-2 pointer-events-none">
        {/* Статус */}
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 pointer-events-none">
          <span className="w-1.5 h-1.5 bg-primary rounded-full pulse-dot" />
          <span className="text-primary font-mono text-xs">{points.length.toLocaleString()} точек</span>
        </div>

        {room && showLabels && (
          <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 font-mono text-xs text-muted-foreground pointer-events-none">
            {room.width}×{room.depth} м · {room.area} м²
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5 pointer-events-auto">
          {/* View mode */}
          {(["3d", "top", "front"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`text-xs font-mono px-2 py-1 rounded transition-colors ${
                viewMode === v
                  ? "bg-primary text-primary-foreground"
                  : "bg-black/60 backdrop-blur-sm text-muted-foreground hover:text-foreground"
              }`}
            >
              {v.toUpperCase()}
            </button>
          ))}

          {/* Auto-rotate */}
          <button
            onClick={() => setAutoRotate((r) => !r)}
            className={`p-1.5 rounded transition-colors ${
              autoRotate
                ? "bg-primary/20 text-primary"
                : "bg-black/60 backdrop-blur-sm text-muted-foreground hover:text-foreground"
            }`}
            title={autoRotate ? "Остановить вращение" : "Включить вращение"}
          >
            <Icon name={autoRotate ? "Pause" : "Play"} size={13} />
          </button>
        </div>
      </div>

      {/* Подсказка управления */}
      <div className="absolute bottom-3 left-3 pointer-events-none">
        <p className="text-xs text-muted-foreground/60 font-mono bg-black/40 px-2 py-1 rounded">
          Перетащите · Прокрутите для зума
        </p>
      </div>

      {/* Измерения комнаты — правый нижний угол */}
      {room && showLabels && (
        <div className="absolute bottom-3 right-3 space-y-1 pointer-events-none">
          {[
            { icon: "ArrowLeftRight", label: "Ш", val: `${room.width} м` },
            { icon: "MoveVertical",   label: "Г", val: `${room.depth} м` },
            { icon: "ArrowUpDown",    label: "В", val: `${room.height} м` },
          ].map((m) => (
            <div key={m.label}
              className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded px-2 py-1 text-xs font-mono"
            >
              <Icon name={m.icon} size={11} className="text-primary" />
              <span className="text-muted-foreground">{m.label}:</span>
              <span className="text-foreground font-semibold">{m.val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}