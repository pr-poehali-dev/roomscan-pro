import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import PointCloud3D, { type Point3D, type RoomBox } from "./PointCloud3D";

interface DepthPoint { x: number; y: number; depth: number; }
interface RoomMeasurement { width: number; height: number; depth: number; area: number; }

type XRSessionMode = "immersive-ar";
declare global {
  interface Navigator { xr?: { isSessionSupported: (mode: XRSessionMode) => Promise<boolean>; requestSession: (mode: XRSessionMode, options?: object) => Promise<XRSession>; }; }
  interface XRSession { requestReferenceSpace: (type: string) => Promise<XRReferenceSpace>; requestAnimationFrame: (cb: XRFrameRequestCallback) => number; end: () => Promise<void>; addEventListener: (e: string, cb: unknown) => void; }
  interface XRReferenceSpace { getOffsetReferenceSpace?: (t: XRRigidTransform) => XRReferenceSpace; }
  interface XRRigidTransform { position?: DOMPointInit; orientation?: DOMPointInit; }
  type XRFrameRequestCallback = (time: number, frame: XRFrame) => void;
  interface XRFrame { getDepthInformation?: (view: XRView) => XRDepthInformation | null; getViewerPose: (space: XRReferenceSpace) => XRViewerPose | null; }
  interface XRDepthInformation { width: number; height: number; getDepthInMeters: (x: number, y: number) => number; }
  interface XRViewerPose { views: XRView[]; }
  interface XRView { camera?: unknown; }
}

export default function WebXRScanner({ onComplete }: { onComplete: (data: RoomMeasurement) => void }) {
  const [supported, setSupported] = useState<"checking" | "yes" | "no">("checking");
  const [phase, setPhase] = useState<"idle" | "scanning" | "processing" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [depthPoints, setDepthPoints] = useState<DepthPoint[]>([]);
  const [measurement, setMeasurement] = useState<RoomMeasurement | null>(null);
  const [points3D, setPoints3D] = useState<Point3D[]>([]);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<XRSession | null>(null);
  const frameCountRef = useRef(0);
  const allDepthsRef = useRef<number[]>([]);
  const rawPoints3DRef = useRef<Point3D[]>([]);

  useEffect(() => {
    if (!navigator.xr) { setSupported("no"); return; }
    navigator.xr.isSessionSupported("immersive-ar").then((ok) => setSupported(ok ? "yes" : "no"));
  }, []);

  const computeMeasurements = useCallback((depths: number[]): RoomMeasurement => {
    const sorted = [...depths].sort((a, b) => a - b);
    const p5 = sorted[Math.floor(sorted.length * 0.05)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const median = sorted[Math.floor(sorted.length * 0.5)];
    const floorDist = p95;
    const nearWall = p5;
    const farWall = median;
    const width = parseFloat((farWall * 1.6).toFixed(2));
    const depth = parseFloat((floorDist).toFixed(2));
    const height = parseFloat((nearWall * 1.1 + 1.2).toFixed(2));
    const area = parseFloat((width * depth).toFixed(1));
    return { width, height, depth, area };
  }, []);

  const drawDepthMap = useCallback((pts: DepthPoint[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const depths = pts.map((p) => p.depth);
    const min = Math.min(...depths);
    const max = Math.max(...depths);
    pts.forEach(({ x, y, depth }) => {
      const t = (depth - min) / (max - min + 0.001);
      const r = Math.round(255 * (1 - t));
      const g = Math.round(180 * t);
      ctx.fillStyle = `rgba(${r},${g},60,0.7)`;
      ctx.fillRect(
        Math.round(x * canvas.width),
        Math.round(y * canvas.height),
        4, 4
      );
    });
  }, []);

  const startXR = useCallback(async () => {
    if (!navigator.xr) return;
    setError("");
    setPhase("scanning");
    setProgress(0);
    allDepthsRef.current = [];
    rawPoints3DRef.current = [];
    frameCountRef.current = 0;

    try {
      const session = await navigator.xr.requestSession("immersive-ar", {
        requiredFeatures: ["depth-sensing", "local-floor"],
        depthSensing: {
          usagePreference: ["cpu-optimized"],
          dataFormatPreference: ["luminance-alpha"],
        },
      } as object);
      sessionRef.current = session;

      const refSpace = await session.requestReferenceSpace("local-floor");

      session.requestAnimationFrame(function frame(_, xrFrame) {
        frameCountRef.current += 1;
        const TARGET_FRAMES = 90;
        const prog = Math.min(100, Math.round((frameCountRef.current / TARGET_FRAMES) * 100));
        setProgress(prog);

        const pose = xrFrame.getViewerPose(refSpace);
        if (pose && xrFrame.getDepthInformation) {
          for (const view of pose.views) {
            const depthInfo = xrFrame.getDepthInformation(view);
            if (depthInfo) {
              const pts: DepthPoint[] = [];
              const step = 8;
              for (let px = 0; px < depthInfo.width; px += step) {
                for (let py = 0; py < depthInfo.height; py += step) {
                  const d = depthInfo.getDepthInMeters(px / depthInfo.width, py / depthInfo.height);
                  if (d > 0.1 && d < 10) {
                    allDepthsRef.current.push(d);
                    pts.push({ x: px / depthInfo.width, y: py / depthInfo.height, depth: d });
                    // Строим 3D-точку: X/Y из NDC * depth, Z = -depth
                    const nx = (px / depthInfo.width) * 2 - 1;
                    const ny = 1 - (py / depthInfo.height) * 2;
                    rawPoints3DRef.current.push({
                      x: nx * d * 0.7,
                      y: ny * d * 0.4,
                      z: -d,
                      intensity: Math.min(1, d / 5),
                    });
                  }
                }
              }
              if (pts.length > 0) {
                setDepthPoints(pts);
                drawDepthMap(pts);
              }
            }
          }
        }

        if (frameCountRef.current < TARGET_FRAMES) {
          session.requestAnimationFrame(frame);
        } else {
          session.end().then(() => {
            sessionRef.current = null;
            setPhase("processing");
            setTimeout(() => {
              const m = computeMeasurements(allDepthsRef.current);
              setMeasurement(m);
              // Сэмплируем не более 3000 точек для рендера
              const sampled = rawPoints3DRef.current.filter((_, i) => i % 3 === 0).slice(0, 3000);
              setPoints3D(sampled);
              setPhase("done");
              onComplete(m);
            }, 800);
          });
        }
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка доступа к AR-сессии");
      setPhase("idle");
    }
  }, [computeMeasurements, drawDepthMap, onComplete]);

  const stopXR = useCallback(() => {
    sessionRef.current?.end();
    sessionRef.current = null;
    setPhase("idle");
    setProgress(0);
  }, []);

  if (supported === "checking") {
    return (
      <div className="flex items-center justify-center h-48 gap-2 text-muted-foreground">
        <Icon name="Loader2" size={18} className="animate-spin" />
        <span className="text-sm">Проверка WebXR Depth API...</span>
      </div>
    );
  }

  if (supported === "no") {
    return (
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-yellow-500/10 rounded-lg flex items-center justify-center shrink-0">
            <Icon name="AlertTriangle" size={18} className="text-yellow-500" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">WebXR Depth API недоступен</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Требуется <strong className="text-foreground">Chrome на Android</strong> с ToF/LiDAR сенсором (Pixel 6+, Samsung S21+).
              На этом устройстве используйте <strong className="text-foreground">Вариант B — фотограмметрию</strong>.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          {[
            ["Браузер", navigator.userAgent.includes("Chrome") ? "✓ Chrome" : "✗ Не Chrome"],
            ["Платформа", /Android/.test(navigator.userAgent) ? "✓ Android" : "✗ Не Android"],
            ["WebXR", navigator.xr ? "✓ Поддержка" : "✗ Нет"],
            ["Depth API", "✗ Нет сенсора"],
          ].map(([k, v]) => (
            <div key={k} className="bg-secondary rounded px-2.5 py-1.5">
              <span className="text-muted-foreground">{k}: </span>
              <span className={v.startsWith("✓") ? "text-primary" : "text-destructive"}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Превью depth-карты */}
      <div className="relative bg-[#050810] rounded-lg overflow-hidden border border-border"
        style={{ aspectRatio: "16/9" }}
      >
        <canvas
          ref={canvasRef}
          width={320} height={180}
          className="w-full h-full object-cover"
          style={{ imageRendering: "pixelated" }}
        />

        {phase === "idle" && depthPoints.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Icon name="Scan" size={40} className="text-border" />
            <p className="text-muted-foreground text-sm">Готов к WebXR-сканированию</p>
          </div>
        )}

        {phase === "scanning" && (
          <>
            <div className="scan-line absolute left-0 right-0 h-px bg-primary opacity-70"
              style={{ boxShadow: "0 0 10px 2px hsl(142 70% 36%)" }}
            />
            <div className="absolute top-2 left-2 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-primary rounded-full pulse-dot" />
              <span className="text-primary font-mono text-xs">DEPTH SENSING</span>
            </div>
            <div className="absolute bottom-2 left-2 right-2">
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-muted-foreground">Сбор глубины</span>
                <span className="text-primary">{progress}%</span>
              </div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-100" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </>
        )}

        {phase === "processing" && (
          <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2">
            <Icon name="Loader2" size={28} className="text-primary animate-spin" />
            <p className="text-sm text-foreground font-semibold">Вычисляю размеры...</p>
          </div>
        )}

        {phase === "done" && measurement && (
          <div className="absolute inset-0 bg-background/85 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 border-2 border-primary rounded-full flex items-center justify-center">
              <Icon name="Check" size={22} className="text-primary" />
            </div>
            <p className="text-primary font-mono text-sm font-semibold">СКАНИРОВАНИЕ ЗАВЕРШЕНО</p>
          </div>
        )}
      </div>

      {/* Кнопки */}
      <div className="flex gap-3">
        {phase === "idle" || phase === "done" ? (
          <button
            onClick={startXR}
            className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Icon name="Scan" size={17} />
            {phase === "done" ? "Сканировать заново" : "Запустить WebXR-сканирование"}
          </button>
        ) : (
          <button
            onClick={stopXR}
            className="flex-1 bg-destructive/20 text-destructive font-bold py-3 rounded-lg hover:bg-destructive/30 transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="Square" size={17} />
            Остановить
          </button>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <Icon name="AlertCircle" size={15} />
          {error}
        </div>
      )}

      {/* Результаты */}
      {measurement && (
        <div className="bg-card border border-border rounded-lg p-4 animate-fade-in">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            Результаты WebXR Depth
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Ширина", value: `${measurement.width} м` },
              { label: "Глубина", value: `${measurement.depth} м` },
              { label: "Высота", value: `${measurement.height} м` },
              { label: "Площадь", value: `${measurement.area} м²` },
            ].map((m) => (
              <div key={m.label} className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-xl font-black text-primary font-mono">{m.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 font-mono">
            Точек глубины собрано: {allDepthsRef.current.length.toLocaleString()}
          </p>
        </div>
      )}

      {/* 3D Point Cloud */}
      {points3D.length > 0 && measurement && (
        <div className="animate-fade-in space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground px-1">
            3D-визуализация облака точек
          </p>
          <PointCloud3D
            points={points3D}
            room={{
              width: measurement.width,
              depth: measurement.depth,
              height: measurement.height,
              area: measurement.area,
            }}
            height={320}
            showRoom
            showLabels
          />
        </div>
      )}
    </div>
  );
}