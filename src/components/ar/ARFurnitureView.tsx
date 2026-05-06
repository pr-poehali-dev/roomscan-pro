import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Icon from "@/components/ui/icon";

export interface ARFurniture {
  id: number;
  name: string;
  /** размеры в метрах */
  width: number;
  depth: number;
  height: number;
  color?: string;
}

interface Props {
  item: ARFurniture;
  onClose: () => void;
}

type Status = "checking" | "unsupported" | "ready" | "active" | "error";

/**
 * AR-предпросмотр мебели через WebXR Hit Test API.
 *
 * Что делает:
 * 1. Запрашивает immersive-ar сессию с requiredFeatures: hit-test
 * 2. Рендерит видеопоток камеры через Three.js + xr-renderer
 * 3. Прицел (reticle) ищет горизонтальную плоскость в реальном времени
 * 4. По тапу ставит виртуальный bbox-mesh мебели в реальном масштабе
 * 5. Можно ставить несколько копий, очищать сцену
 *
 * Требования: Android Chrome 90+, ARCore-совместимое устройство.
 */
export default function ARFurnitureView({ item, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState("");
  const [placedCount, setPlacedCount] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [gestureMode, setGestureMode] = useState<"place" | "edit">("place");

  // Рефы для XR-объектов
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const reticleRef = useRef<THREE.Mesh | null>(null);
  const hitTestSourceRef = useRef<XRHitTestSource | null>(null);
  const sessionRef = useRef<XRSession | null>(null);
  const placedMeshesRef = useRef<THREE.Mesh[]>([]);

  // Touch gesture state
  const touchStateRef = useRef<{
    mode: "idle" | "drag" | "rotate";
    startX: number;
    startY: number;
    startAngle: number;
    startMeshRotY: number;
    startMeshPos: THREE.Vector3 | null;
    activeIdx: number | null;
  }>({ mode: "idle", startX: 0, startY: 0, startAngle: 0, startMeshRotY: 0, startMeshPos: null, activeIdx: null });
  const selectedIdxRef = useRef<number | null>(null);
  const gestureModeRef = useRef<"place" | "edit">("place");

  // Синхронизируем рефы со стейтом
  useEffect(() => { selectedIdxRef.current = selectedIdx; }, [selectedIdx]);
  useEffect(() => { gestureModeRef.current = gestureMode; }, [gestureMode]);

  // Проверяем поддержку
  useEffect(() => {
    const check = async () => {
      // @ts-expect-error — webxr namespace
      if (typeof navigator === "undefined" || !navigator.xr) {
        setStatus("unsupported");
        setError("WebXR не поддерживается этим браузером. Используйте Chrome на Android.");
        return;
      }
      try {
        // @ts-expect-error — xr namespace
        const supported = await navigator.xr.isSessionSupported("immersive-ar");
        if (!supported) {
          setStatus("unsupported");
          setError("AR-режим не поддерживается. Нужен Android-смартфон с ARCore.");
        } else {
          setStatus("ready");
        }
      } catch (e) {
        setStatus("unsupported");
        setError(e instanceof Error ? e.message : "AR недоступен");
      }
    };
    check();
  }, []);

  const startAR = async () => {
    if (!containerRef.current) return;
    try {
      // @ts-expect-error — webxr
      const session: XRSession = await navigator.xr.requestSession("immersive-ar", {
        requiredFeatures: ["hit-test"],
        optionalFeatures: ["dom-overlay", "local-floor"],
        domOverlay: { root: containerRef.current },
      });
      sessionRef.current = session;

      // Three.js setup
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera();
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl", { xrCompatible: true } as WebGLContextAttributes) as WebGLRenderingContext;
      const renderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true });
      renderer.autoClear = false;
      renderer.xr.enabled = true;
      await renderer.xr.setSession(session as unknown as XRSession);
      rendererRef.current = renderer;

      // Освещение
      const hemi = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.2);
      scene.add(hemi);
      const dir = new THREE.DirectionalLight(0xffffff, 0.6);
      dir.position.set(0.5, 1, 0.25);
      scene.add(dir);

      // Reticle: тонкое зелёное кольцо на полу
      const reticleGeo = new THREE.RingGeometry(0.07, 0.09, 32).rotateX(-Math.PI / 2);
      const reticleMat = new THREE.MeshBasicMaterial({ color: 0x16a34a, transparent: true, opacity: 0.85 });
      const reticle = new THREE.Mesh(reticleGeo, reticleMat);
      reticle.matrixAutoUpdate = false;
      reticle.visible = false;
      scene.add(reticle);
      reticleRef.current = reticle;

      // Hit test source
      // @ts-expect-error — webxr api types are not fully typed in DOM lib
      const refSpace = await session.requestReferenceSpace("viewer");
      // @ts-expect-error — requestHitTestSource is a webxr extension
      const hitTestSource = await session.requestHitTestSource({ space: refSpace });
      hitTestSourceRef.current = hitTestSource as XRHitTestSource;

      // @ts-expect-error — local reference space, not in default DOM lib
      const localSpace = await session.requestReferenceSpace("local");

      // Тап (XR select) → ставим мебель только в режиме "place"
      const onSelect = () => {
        if (gestureModeRef.current === "edit") return; // в редакторе не ставим новые
        const r = reticleRef.current;
        if (!r || !r.visible || !sceneRef.current) return;
        const mesh = createFurnitureMesh(item);
        mesh.position.setFromMatrixPosition(r.matrix);
        const yEuler = new THREE.Euler();
        yEuler.setFromRotationMatrix(r.matrix);
        mesh.rotation.y = yEuler.y;
        sceneRef.current.add(mesh);
        placedMeshesRef.current.push(mesh);
        const newIdx = placedMeshesRef.current.length - 1;
        setPlacedCount((c) => c + 1);
        // Авто-выбираем последнюю поставленную → можно сразу таскать
        setSelectedIdx(newIdx);
      };
      session.addEventListener("select", onSelect);

      // ─── Touch жесты для drag/rotate ────────────────────────────────────
      const overlay = containerRef.current;
      if (overlay) {
        const onTouchStart = (e: TouchEvent) => {
          if (gestureModeRef.current !== "edit") return;
          const idx = selectedIdxRef.current;
          if (idx == null) return;
          const mesh = placedMeshesRef.current[idx];
          if (!mesh) return;
          const ts = touchStateRef.current;
          ts.activeIdx = idx;
          ts.startMeshPos = mesh.position.clone();
          ts.startMeshRotY = mesh.rotation.y;

          if (e.touches.length === 1) {
            ts.mode = "drag";
            ts.startX = e.touches[0].clientX;
            ts.startY = e.touches[0].clientY;
          } else if (e.touches.length === 2) {
            ts.mode = "rotate";
            const dx = e.touches[1].clientX - e.touches[0].clientX;
            const dy = e.touches[1].clientY - e.touches[0].clientY;
            ts.startAngle = Math.atan2(dy, dx);
          }
          e.preventDefault();
        };

        const onTouchMove = (e: TouchEvent) => {
          if (gestureModeRef.current !== "edit") return;
          const ts = touchStateRef.current;
          if (ts.mode === "idle" || ts.activeIdx == null) return;
          const mesh = placedMeshesRef.current[ts.activeIdx];
          if (!mesh) return;

          if (ts.mode === "drag" && e.touches.length === 1 && ts.startMeshPos) {
            // Перемещение по плоскости пола (XZ).
            // Используем простой коэффициент: 1 пиксель ≈ 0.003 м на расстоянии руки.
            const dx = e.touches[0].clientX - ts.startX;
            const dy = e.touches[0].clientY - ts.startY;
            const k = 0.003;
            mesh.position.x = ts.startMeshPos.x + dx * k;
            mesh.position.z = ts.startMeshPos.z + dy * k;
            // Y не трогаем — мебель остаётся на полу
          } else if (ts.mode === "rotate" && e.touches.length === 2) {
            const dx = e.touches[1].clientX - e.touches[0].clientX;
            const dy = e.touches[1].clientY - e.touches[0].clientY;
            const ang = Math.atan2(dy, dx);
            mesh.rotation.y = ts.startMeshRotY + (ang - ts.startAngle);
          }
          e.preventDefault();
        };

        const onTouchEnd = (e: TouchEvent) => {
          const ts = touchStateRef.current;
          // переход 2→1 — оставляем drag на оставшемся пальце
          if (e.touches.length === 1 && ts.mode === "rotate" && ts.activeIdx != null) {
            const mesh = placedMeshesRef.current[ts.activeIdx];
            if (mesh) {
              ts.mode = "drag";
              ts.startX = e.touches[0].clientX;
              ts.startY = e.touches[0].clientY;
              ts.startMeshPos = mesh.position.clone();
            }
          } else if (e.touches.length === 0) {
            ts.mode = "idle";
            ts.activeIdx = null;
          }
        };

        overlay.addEventListener("touchstart", onTouchStart, { passive: false });
        overlay.addEventListener("touchmove",  onTouchMove,  { passive: false });
        overlay.addEventListener("touchend",   onTouchEnd);
        overlay.addEventListener("touchcancel", onTouchEnd);
      }

      // Render loop
      renderer.setAnimationLoop((_t, frame) => {
        if (!frame) return;
        const hits = (frame as XRFrame).getHitTestResults(hitTestSource as XRHitTestSource);
        const ret = reticleRef.current;
        // Reticle виден только в режиме установки
        if (gestureModeRef.current === "place" && hits.length > 0 && ret) {
          const pose = hits[0].getPose(localSpace as unknown as XRReferenceSpace);
          if (pose) {
            ret.visible = true;
            ret.matrix.fromArray(pose.transform.matrix);
          }
        } else if (ret) {
          ret.visible = false;
        }

        // Подсветка выбранного объекта: яркие edges
        const selected = selectedIdxRef.current;
        placedMeshesRef.current.forEach((m, idx) => {
          const wire = m.children[0] as THREE.LineSegments | undefined;
          if (wire && wire.material instanceof THREE.LineBasicMaterial) {
            wire.material.color.set(idx === selected ? 0xfb923c : 0x16a34a);
          }
          if (m.material instanceof THREE.MeshStandardMaterial) {
            m.material.opacity = idx === selected ? 0.75 : 0.55;
          }
        });

        renderer.render(scene, camera);
      });

      session.addEventListener("end", () => {
        cleanup();
      });

      setStatus("active");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось запустить AR");
      setStatus("error");
    }
  };

  const cleanup = () => {
    const r = rendererRef.current;
    if (r) {
      r.setAnimationLoop(null);
      r.dispose();
    }
    rendererRef.current = null;
    sceneRef.current = null;
    reticleRef.current = null;
    hitTestSourceRef.current = null;
    sessionRef.current = null;
    placedMeshesRef.current = [];
    setStatus("ready");
    setPlacedCount(0);
    setSelectedIdx(null);
    setGestureMode("place");
  };

  const stopAR = async () => {
    if (sessionRef.current) {
      try { await sessionRef.current.end(); } catch { /* noop */ }
    }
    cleanup();
  };

  const clearPlaced = () => {
    if (!sceneRef.current) return;
    placedMeshesRef.current.forEach((m) => sceneRef.current?.remove(m));
    placedMeshesRef.current = [];
    setPlacedCount(0);
    setSelectedIdx(null);
  };

  useEffect(() => {
    return () => { void stopAR(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div ref={containerRef} className="relative w-full max-w-2xl bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name="View" size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground">AR-предпросмотр</p>
              <p className="text-xs text-muted-foreground font-mono">
                {item.name} · {item.width}×{item.depth} м
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 min-h-[280px]">
          {status === "checking" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Icon name="Loader2" size={28} className="text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Проверяем поддержку AR…</p>
            </div>
          )}

          {(status === "unsupported" || status === "error") && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center">
                <Icon name="AlertCircle" size={26} className="text-destructive" />
              </div>
              <p className="text-sm font-semibold text-foreground text-center">
                {status === "unsupported" ? "AR недоступен" : "Ошибка"}
              </p>
              <p className="text-xs text-muted-foreground text-center max-w-md">
                {error || "Откройте этот сайт на Android в Chrome 90+ с поддержкой ARCore. " +
                "Список устройств: developers.google.com/ar/devices"}
              </p>
              <div className="bg-secondary/40 rounded-lg p-3 mt-2 w-full">
                <p className="text-xs font-semibold text-foreground mb-2">Что нужно для работы:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Android-смартфон Pixel 4+ / Galaxy S10+ / OnePlus 7+</li>
                  <li>• Браузер Chrome 90+ или Edge</li>
                  <li>• Установленный Google Play Services for AR</li>
                  <li>• Доступ к камере</li>
                </ul>
              </div>
            </div>
          )}

          {status === "ready" && (
            <div className="space-y-3">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icon name="CheckCircle2" size={18} className="text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground">AR доступен на этом устройстве</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Нажмите «Запустить AR», направьте камеру на пол и тапните, чтобы поставить мебель.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-secondary/40 rounded-md p-2 text-center">
                  <p className="text-primary font-bold font-mono">{item.width} м</p>
                  <p className="text-muted-foreground">Ширина</p>
                </div>
                <div className="bg-secondary/40 rounded-md p-2 text-center">
                  <p className="text-primary font-bold font-mono">{item.depth} м</p>
                  <p className="text-muted-foreground">Глубина</p>
                </div>
                <div className="bg-secondary/40 rounded-md p-2 text-center">
                  <p className="text-primary font-bold font-mono">{item.height} м</p>
                  <p className="text-muted-foreground">Высота</p>
                </div>
              </div>

              <div className="bg-secondary/30 rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Инструкция
                </p>
                {[
                  "Направьте камеру на пол",
                  "Подождите, пока появится зелёный кружок",
                  "Тапните, чтобы поставить предмет",
                  "Можете обойти его и оценить габариты",
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 bg-primary/10 text-primary rounded-md flex items-center justify-center font-mono font-bold">
                      {i + 1}
                    </span>
                    <span className="text-foreground">{s}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={startAR}
                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Icon name="View" size={17} />
                Запустить AR
              </button>
            </div>
          )}

          {status === "active" && (
            <div className="space-y-3">
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full pulse-dot" />
                <p className="text-sm font-bold text-foreground">AR активен</p>
                <span className="ml-auto text-xs font-mono text-primary">
                  Поставлено: {placedCount}
                </span>
              </div>

              {/* Режим */}
              <div className="grid grid-cols-2 gap-2 bg-secondary/30 rounded-lg p-1">
                {(["place", "edit"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setGestureMode(m);
                      if (m === "place") setSelectedIdx(null);
                    }}
                    className={`text-xs font-semibold py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                      gestureMode === m
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon name={m === "place" ? "MousePointerClick" : "Move3d"} size={12} />
                    {m === "place" ? "Установка" : "Редактор"}
                  </button>
                ))}
              </div>

              {gestureMode === "place" ? (
                <p className="text-xs text-muted-foreground">
                  Тапайте на экран в позиции зелёного кружка — мебель появится в реальном масштабе.
                </p>
              ) : placedCount === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Сначала поставьте хотя бы один предмет в режиме «Установка».
                </p>
              ) : (
                <>
                  <div className="bg-secondary/40 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Жесты в режиме редактора
                    </p>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <Icon name="Hand" size={12} className="text-primary" />
                        <span className="text-foreground">1 палец — перемещение по полу</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="RotateCw" size={12} className="text-primary" />
                        <span className="text-foreground">2 пальца — вращение</span>
                      </div>
                    </div>
                  </div>

                  {/* Селектор объекта */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedIdx((i) => {
                        const n = placedMeshesRef.current.length;
                        if (n === 0) return null;
                        return i == null ? n - 1 : (i - 1 + n) % n;
                      })}
                      className="w-9 h-9 rounded-md bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center"
                    >
                      <Icon name="ChevronLeft" size={14} />
                    </button>
                    <div className="flex-1 text-center bg-secondary/40 rounded-md py-2">
                      <p className="text-xs font-mono text-foreground font-semibold">
                        {selectedIdx == null ? "Выберите объект" : `Объект ${selectedIdx + 1} из ${placedCount}`}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedIdx((i) => {
                        const n = placedMeshesRef.current.length;
                        if (n === 0) return null;
                        return i == null ? 0 : (i + 1) % n;
                      })}
                      className="w-9 h-9 rounded-md bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center"
                    >
                      <Icon name="ChevronRight" size={14} />
                    </button>
                  </div>

                  {/* Быстрые действия с выбранным */}
                  {selectedIdx != null && (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          const mesh = placedMeshesRef.current[selectedIdx];
                          if (mesh) mesh.rotation.y -= Math.PI / 2;
                        }}
                        className="bg-secondary py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1 hover:bg-border transition-colors"
                      >
                        <Icon name="RotateCcw" size={12} />
                        −90°
                      </button>
                      <button
                        onClick={() => {
                          const mesh = placedMeshesRef.current[selectedIdx];
                          if (mesh) mesh.rotation.y += Math.PI / 2;
                        }}
                        className="bg-secondary py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1 hover:bg-border transition-colors"
                      >
                        <Icon name="RotateCw" size={12} />
                        +90°
                      </button>
                      <button
                        onClick={() => {
                          const mesh = placedMeshesRef.current[selectedIdx];
                          if (mesh && sceneRef.current) {
                            sceneRef.current.remove(mesh);
                            placedMeshesRef.current.splice(selectedIdx, 1);
                            setPlacedCount(placedMeshesRef.current.length);
                            setSelectedIdx(null);
                          }
                        }}
                        className="bg-destructive/10 text-destructive py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1 hover:bg-destructive/20 transition-colors"
                      >
                        <Icon name="Trash2" size={12} />
                        Удалить
                      </button>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-2">
                {placedCount > 0 && (
                  <button
                    onClick={clearPlaced}
                    className="flex-1 bg-secondary text-secondary-foreground py-2.5 rounded-lg hover:bg-border transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                  >
                    <Icon name="Eraser" size={15} />
                    Очистить
                  </button>
                )}
                <button
                  onClick={stopAR}
                  className="flex-1 bg-destructive/10 text-destructive py-2.5 rounded-lg hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                >
                  <Icon name="X" size={15} />
                  Завершить AR
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Хелпер: создаёт mesh мебели в виде bbox с лейблом ─────────────────────
function createFurnitureMesh(item: ARFurniture): THREE.Mesh {
  const geo = new THREE.BoxGeometry(item.width, item.height, item.depth);
  const mat = new THREE.MeshStandardMaterial({
    color: item.color ?? 0x16a34a,
    transparent: true,
    opacity: 0.55,
    roughness: 0.7,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  // Поднимаем на половину высоты, чтобы низ касался пола
  mesh.position.y = item.height / 2;

  // Каркас (edges) — зелёный контур поверх полупрозрачного бокса
  const edges = new THREE.EdgesGeometry(geo);
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x16a34a });
  const wire = new THREE.LineSegments(edges, edgeMat);
  mesh.add(wire);

  return mesh;
}