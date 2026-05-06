import { useState, useRef, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { saveLastScan } from "@/lib/scanStore";
import PointCloud3D, { type Point3D, type RoomBox } from "./PointCloud3D";
import ScannerViewport from "./photogrammetry/ScannerViewport";
import ScannerControls from "./photogrammetry/ScannerControls";
import ScanResultPanel from "./photogrammetry/ScanResultPanel";
import ProcessingTimeline from "./photogrammetry/ProcessingTimeline";
import type { ScanResult, Phase } from "./photogrammetry/types";

const PHOTO_URL = "https://functions.poehali.dev/aa224ee6-cbee-45f1-bcf6-92dbb5ecd974";

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function PhotogrammetryScanner({ onComplete }: { onComplete: (result: ScanResult) => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [scanId, setScanId] = useState<number | string | null>(null);
  const [framesCount, setFramesCount] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [points3D, setPoints3D] = useState<Point3D[]>([]);
  const [error, setError] = useState("");
  const [tip, setTip] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const framesRef = useRef<Blob[]>([]);
  const recordingRef = useRef(false);

  const TIPS = [
    "Медленно обводите все стены",
    "Снимайте углы помещения",
    "Держите телефон вертикально",
    "Пройдитесь по периметру комнаты",
    "Наклоните телефон к полу и потолку",
  ];

  const startCamera = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const { data } = await apiFetch(`${PHOTO_URL}?action=start`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!data.scan_id) throw new Error(data.error || "Не удалось создать сканирование");
      setScanId(data.scan_id);
      setFramesCount(0);
      framesRef.current = [];
      recordingRef.current = true;
      setPhase("recording");

      let tipIdx = 0;
      let frameIdx = 0;

      captureIntervalRef.current = setInterval(() => {
        if (!recordingRef.current || !videoRef.current) return;

        tipIdx = (tipIdx + 1) % TIPS.length;
        setTip(tipIdx);

        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0, 640, 480);
        canvas.toBlob((blob) => {
          if (blob) {
            framesRef.current.push(blob);
            frameIdx += 1;
            setFramesCount(frameIdx);
          }
        }, "image/jpeg", 0.75);
      }, 500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Нет доступа к камере");
      setPhase("error");
    }
  }, [TIPS.length]);

  const stopAndProcess = useCallback(async () => {
    if (!scanId) return;
    recordingRef.current = false;
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    const frames = framesRef.current;
    if (frames.length < 5) {
      setError("Слишком мало кадров. Нужно минимум 10 секунд съёмки.");
      setPhase("error");
      return;
    }

    setPhase("uploading");
    setUploadedCount(0);

    const BATCH = 5;
    for (let i = 0; i < frames.length; i += BATCH) {
      const batch = frames.slice(i, i + BATCH);
      const b64s = await Promise.all(batch.map((b) => toBase64(b)));
      for (let j = 0; j < b64s.length; j++) {
        await apiFetch(`${PHOTO_URL}?action=frame`, {
          method: "POST",
          body: JSON.stringify({ scan_id: scanId, frame: b64s[j], frame_index: i + j }),
        });
        setUploadedCount(i + j + 1);
      }
    }

    setPhase("processing");
    const { data } = await apiFetch(`${PHOTO_URL}?action=process`, {
      method: "POST",
      body: JSON.stringify({ scan_id: scanId }),
    });

    if (data.result) {
      setResult(data.result);
      setPhase("done");
      onComplete(data.result);

      // Сохраняем в общий store для Планировщика
      saveLastScan({
        width:  data.result.width,
        length: data.result.length,
        height: data.result.height,
        area:   data.result.area,
        doors:    data.result.doors,
        windows:  data.result.windows,
        openings: data.result.openings,
      });

      // Загружаем point_cloud_data из БД для 3D-визуализации
      const statusRes = await apiFetch(`${PHOTO_URL}?action=status&scan_id=${scanId}`);
      const cloudRaw: number[][] = statusRes.data?.scan?.point_cloud?.points ?? [];
      if (cloudRaw.length > 0) {
        const pts3D: Point3D[] = cloudRaw.slice(0, 3000).map(([x, y, z]) => ({
          x, y, z, intensity: y / (data.result.height || 2.7),
        }));
        setPoints3D(pts3D);
      }
    } else {
      setError(data.error || "Ошибка обработки");
      setPhase("error");
    }
  }, [scanId, onComplete]);

  const reset = useCallback(() => {
    framesRef.current = [];
    setPhase("idle");
    setFramesCount(0);
    setUploadedCount(0);
    setScanId(null);
    setResult(null);
    setPoints3D([]);
    setError("");
  }, []);

  const uploadPct = framesRef.current.length > 0
    ? Math.round((uploadedCount / framesRef.current.length) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <ScannerViewport
        videoRef={videoRef}
        phase={phase}
        framesCount={framesCount}
        uploadedCount={uploadedCount}
        totalFrames={framesRef.current.length}
        uploadPct={uploadPct}
        tip={tip}
        tips={TIPS}
        result={result}
        error={error}
      />

      <ScannerControls
        phase={phase}
        framesCount={framesCount}
        onStart={startCamera}
        onStop={stopAndProcess}
        onReset={reset}
      />

      {phase === "processing" && <ProcessingTimeline />}

      {result && <ScanResultPanel result={result} />}

      {/* 3D Point Cloud */}
      {points3D.length > 0 && result && (
        <div className="animate-fade-in space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground px-1">
            3D-визуализация облака точек
          </p>
          <PointCloud3D
            points={points3D}
            room={{
              width: result.width,
              depth: result.length,
              height: result.height,
              area: result.area,
            } satisfies RoomBox}
            height={320}
            showRoom
            showLabels
          />
        </div>
      )}
    </div>
  );
}