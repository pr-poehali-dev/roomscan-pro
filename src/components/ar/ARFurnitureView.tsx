import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Icon from "@/components/ui/icon";
import { createFurnitureMesh } from "./arMeshHelpers";
import { ARCheckingView, ARErrorView, ARReadyView } from "./ARStatusViews";
import ARActiveControls from "./ARActiveControls";

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

  // Проверяем поддержку (с таймаутом, чтобы не висеть в "checking" бесконечно)
  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      // @ts-expect-error — webxr namespace
      if (typeof navigator === "undefined" || !navigator.xr) {
        if (cancelled) return;
        setStatus("unsupported");
        setError("WebXR не поддерживается этим браузером. AR доступен на Android Chrome 90+ с ARCore.");
        return;
      }
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Таймаут проверки AR")), 3000),
        );
        const supportPromise =
          // @ts-expect-error — xr namespace
          navigator.xr.isSessionSupported("immersive-ar") as Promise<boolean>;

        const supported = await Promise.race([supportPromise, timeoutPromise]);
        if (cancelled) return;
        if (!supported) {
          setStatus("unsupported");
          setError("AR-режим не поддерживается. Нужен Android-смартфон с ARCore.");
        } else {
          setStatus("ready");
        }
      } catch (e) {
        if (cancelled) return;
        setStatus("unsupported");
        setError(e instanceof Error ? e.message : "AR недоступен");
      }
    };
    check();

    return () => { cancelled = true; };
  }, []);

  // Закрытие по Esc + блокировка скролла страницы
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

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
          if (e.touches.length === 1 && ts.mode === "rotate") {
            // переход с двух пальцев на один — продолжаем тащить
            const idx = ts.activeIdx;
            if (idx != null) {
              const mesh = placedMeshesRef.current[idx];
              if (!mesh) return;
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
    <div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        // Закрытие по клику на бэкдроп (только если AR-сессия не активна)
        if (e.target === e.currentTarget && status !== "active") onClose();
      }}
    >
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl bg-card border border-border rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
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
          {status === "checking" && <ARCheckingView />}

          {(status === "unsupported" || status === "error") && (
            <ARErrorView status={status} error={error} />
          )}

          {status === "ready" && <ARReadyView item={item} onStart={startAR} />}

          {status === "active" && (
            <ARActiveControls
              placedCount={placedCount}
              selectedIdx={selectedIdx}
              setSelectedIdx={setSelectedIdx}
              gestureMode={gestureMode}
              setGestureMode={setGestureMode}
              placedMeshesRef={placedMeshesRef}
              sceneRef={sceneRef}
              setPlacedCount={setPlacedCount}
              clearPlaced={clearPlaced}
              stopAR={stopAR}
            />
          )}
        </div>
      </div>
    </div>
  );
}