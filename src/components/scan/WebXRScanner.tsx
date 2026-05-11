import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import PointCloud3D, { type Point3D } from "./PointCloud3D";
import { computeMeasurements } from "./webxr/depthMath";
import { drawDepthMap } from "./webxr/depthCanvas";
import WebXRUnsupported from "./webxr/WebXRUnsupported";
import DepthPreview from "./webxr/DepthPreview";
import MeasurementsCard from "./webxr/MeasurementsCard";
import type { DepthPoint, RoomMeasurement, ScanPhase, Supported } from "./webxr/types";

/**
 * WebXR Depth API сканер. Открывает immersive-ar сессию с depth-sensing,
 * собирает облако точек/глубины 90 кадров, считает размеры и показывает
 * 3D-облако точек. Состоит из чистой математики (depthMath), рендера canvas
 * (depthCanvas) и презентационных подкомпонентов в /webxr.
 */
export default function WebXRScanner({
  onComplete,
}: {
  onComplete: (data: RoomMeasurement) => void;
}) {
  const [supported, setSupported] = useState<Supported>("checking");
  const [phase, setPhase] = useState<ScanPhase>("idle");
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
    if (!navigator.xr) {
      setSupported("no");
      return;
    }
    navigator.xr.isSessionSupported("immersive-ar").then((ok) => setSupported(ok ? "yes" : "no"));
  }, []);

  const renderDepth = useCallback((pts: DepthPoint[]) => {
    drawDepthMap(canvasRef.current, pts);
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
                renderDepth(pts);
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
  }, [renderDepth, onComplete]);

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
    return <WebXRUnsupported />;
  }

  return (
    <div className="space-y-4">
      <DepthPreview
        ref={canvasRef}
        phase={phase}
        progress={progress}
        depthPoints={depthPoints}
        measurement={measurement}
      />

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

      {measurement && (
        <MeasurementsCard
          measurement={measurement}
          depthPointsCollected={allDepthsRef.current.length}
        />
      )}

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
