import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { FloorPlan } from "@/lib/floorPlan";
import type { FloorStyle, WallStyle } from "./scene3d/textures";
import { computePlanCenter, rebuildRoom } from "./scene3d/geometryBuilders";
import Scene3DControls from "./scene3d/Scene3DControls";
import {
  getActiveWallCoating,
  setActiveWallCoating,
  type ActiveWallCoating,
} from "@/lib/scanStore";
import {
  applyFog,
  applyIBL,
  createRenderer,
  createSky,
} from "./scene3d/sceneSetup";
import { setupLighting } from "./scene3d/lighting";
import {
  attachOrbitControls,
  defaultCamState,
  type CamState,
} from "./scene3d/cameraControls";

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
 *
 * Логика декомпозирована на 3 модуля:
 *  - scene3d/sceneSetup     — небо, renderer, IBL, fog
 *  - scene3d/lighting       — трёхточечное освещение + ambient + hemisphere
 *  - scene3d/cameraControls — orbital camera + pointer/wheel handlers
 */

interface Props {
  plan: FloorPlan;
  /** Высота стен (см), по умолчанию 270 (2.7 м) */
  wallHeight?: number;
}

export default function PlanScene3D({ plan, wallHeight = 270 }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const [wallStyle, setWallStyle] = useState<WallStyle>("white");
  const [floorStyle, setFloorStyle] = useState<FloorStyle>("parquet");
  const [showShadows, setShowShadows] = useState(true);
  const [coating, setCoating] = useState<ActiveWallCoating | null>(getActiveWallCoating());

  useEffect(() => {
    const reload = () => setCoating(getActiveWallCoating());
    window.addEventListener("roomscan:wallCoating:changed", reload);
    return () => window.removeEventListener("roomscan:wallCoating:changed", reload);
  }, []);

  // Камера: сохраняем углы между ререндерами
  const camStateRef = useRef<CamState>(defaultCamState());

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
    camStateRef.current = defaultCamState();
  };

  /* ────────── основная инициализация сцены ────────── */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const width = wrap.clientWidth;
    const height = wrap.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    applyFog(scene);
    scene.add(createSky());

    // Камера
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    cameraRef.current = camera;

    // Renderer — высокое качество
    const renderer = createRenderer(width, height, showShadows);
    wrap.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // IBL — Image Based Lighting через PMREM из процедурного неба
    applyIBL(scene, renderer);

    // Трёхточечное освещение (key + fill + rim) + ambient + hemisphere
    setupLighting(scene, showShadows);

    // Группа для всего интерьера (чтобы можно было полностью пересобирать)
    const room = new THREE.Group();
    scene.add(room);

    /* ─── Построение помещения ─── */
    rebuildRoom(room, plan, wallHeight, wallStyle, floorStyle, coating?.color);

    // Центрируем камеру по плану
    const center = computePlanCenter(plan);
    camStateRef.current.target.set(center.x, 0, center.z);

    /* ─── Управление камерой ─── */
    const { updateCamera, cleanup: cleanupControls } = attachOrbitControls(
      renderer.domElement,
      camera,
      camStateRef,
    );
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
      cleanupControls();
      renderer.dispose();
      const dom = renderer.domElement;
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
    rebuildRoom(room, plan, wallHeight, wallStyle, floorStyle, coating?.color);
    scene.add(room);
  }, [plan, wallHeight, wallStyle, floorStyle, coating?.color]);

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

      <Scene3DControls
        wallStyle={wallStyle}
        setWallStyle={setWallStyle}
        floorStyle={floorStyle}
        setFloorStyle={setFloorStyle}
        showShadows={showShadows}
        setShowShadows={setShowShadows}
        resetCamera={resetCamera}
        screenshot={screenshot}
      />

      {coating && (
        <div className="absolute top-3 right-3 max-w-[260px] flex items-center gap-2 bg-background/95 backdrop-blur-sm border rounded-lg p-2 shadow-lg">
          <div
            className="w-9 h-9 rounded-md border shrink-0"
            style={{ backgroundColor: coating.color }}
          />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-widest font-mono text-primary">
              На стенах
            </div>
            <div className="text-xs font-bold text-foreground truncate">{coating.title}</div>
            <div className="text-[11px] text-muted-foreground truncate">{coating.brand}</div>
          </div>
          <button
            onClick={() => setActiveWallCoating(null)}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            aria-label="Снять покрытие"
            title="Снять покрытие"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}