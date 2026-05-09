import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { FloorPlan } from "@/lib/floorPlan";
import type { FloorStyle, WallStyle } from "./scene3d/textures";
import { computePlanCenter, rebuildRoom } from "./scene3d/geometryBuilders";
import Scene3DControls from "./scene3d/Scene3DControls";

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

    // Лёгкий объёмный туман для атмосферной глубины (далёкие объекты бледнеют)
    scene.fog = new THREE.Fog(0xeef2f6, 25, 80);

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

    // Renderer — высокое качество
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      stencil: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = showShadows;
    renderer.shadowMap.type = THREE.VSMShadowMap; // более мягкие тени, чем PCF
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    wrap.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // IBL — Image Based Lighting через PMREM из процедурного неба
    // Это даёт реалистичные отражения на металле, стекле, глянцевых поверхностях
    const pmremGen = new THREE.PMREMGenerator(renderer);
    pmremGen.compileEquirectangularShader();
    // Простая equirect-текстура неба
    const envCanvas = document.createElement("canvas");
    envCanvas.width = 512; envCanvas.height = 256;
    const ec = envCanvas.getContext("2d")!;
    const grad = ec.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#a8c8e8");   // верх — голубое небо
    grad.addColorStop(0.45, "#e0e8f0"); // горизонт — светлое
    grad.addColorStop(0.55, "#d8d4cc"); // переход
    grad.addColorStop(1, "#8a7860");    // низ — тёплая земля
    ec.fillStyle = grad;
    ec.fillRect(0, 0, 512, 256);
    const envTex = new THREE.CanvasTexture(envCanvas);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    envTex.colorSpace = THREE.SRGBColorSpace;
    const envMap = pmremGen.fromEquirectangular(envTex).texture;
    scene.environment = envMap;
    envTex.dispose();
    pmremGen.dispose();

    // Трёхточечное освещение (key + fill + rim)
    // Ambient — мягкий заполняющий свет
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    // Key light — основной источник (имитирует солнце через окно)
    const sun = new THREE.DirectionalLight(0xfff5e6, 2.2);
    sun.position.set(7, 12, 5);
    sun.castShadow = showShadows;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 40;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    sun.shadow.radius = 6; // VSM blur
    scene.add(sun);

    // Fill light — мягкий с противоположной стороны (имитирует отражённый свет)
    const fill = new THREE.DirectionalLight(0xc8d8e8, 0.6);
    fill.position.set(-6, 5, -4);
    scene.add(fill);

    // Rim light — задний контровой свет (выделяет силуэты)
    const rim = new THREE.DirectionalLight(0xfff0d0, 0.4);
    rim.position.set(-3, 4, 8);
    scene.add(rim);

    // Hemisphere — небо/земля для естественного цветового градиента
    const hemi = new THREE.HemisphereLight(0xb8d4e8, 0xc8a878, 0.5);
    scene.add(hemi);

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
    </div>
  );
}