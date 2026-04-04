import { useState, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { apiFetch, getToken } from "@/lib/api";

const PHOTO_URL = "https://functions.poehali.dev/aa224ee6-cbee-45f1-bcf6-92dbb5ecd974";

interface ScanResult {
  area: number;
  width: number;
  length: number;
  height: number;
  frames_used: number;
  accuracy_estimate: string;
  point_cloud_points: number;
}

type Phase = "idle" | "recording" | "uploading" | "processing" | "done" | "error";

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
  const [scanId, setScanId] = useState<number | null>(null);
  const [framesCount, setFramesCount] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
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
    setError("");
  }, []);

  const uploadPct = framesRef.current.length > 0
    ? Math.round((uploadedCount / framesRef.current.length) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Видео / статус */}
      <div className="relative bg-[#050810] rounded-lg overflow-hidden border border-border"
        style={{ aspectRatio: "16/9" }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline muted
          style={{ display: phase === "recording" ? "block" : "none" }}
        />

        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 bg-primary/10 border-2 border-primary/30 rounded-full flex items-center justify-center">
              <Icon name="Camera" size={28} className="text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">Медленно снимайте все стены помещения</p>
            <p className="text-xs text-muted-foreground font-mono">Рекомендуется 30–60 секунд съёмки</p>
          </div>
        )}

        {phase === "recording" && (
          <>
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1.5">
              <span className="w-2 h-2 bg-red-500 rounded-full pulse-dot" />
              <span className="text-white font-mono text-xs">REC · {framesCount} кадров</span>
            </div>
            <div className="absolute bottom-3 left-3 right-3 bg-black/60 rounded-lg px-3 py-2">
              <p className="text-white text-xs font-semibold">
                💡 {TIPS[tip]}
              </p>
              <div className="mt-1.5 h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min((framesCount / 60) * 100, 100)}%` }}
                />
              </div>
              <p className="text-white/60 text-xs mt-0.5 font-mono">{framesCount}/60 кадров</p>
            </div>
          </>
        )}

        {phase === "uploading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/90">
            <Icon name="Upload" size={32} className="text-primary" />
            <p className="text-foreground font-semibold">Загружаю кадры на сервер</p>
            <div className="w-48 h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${uploadPct}%` }} />
            </div>
            <p className="text-muted-foreground font-mono text-xs">
              {uploadedCount} / {framesRef.current.length} кадров · {uploadPct}%
            </p>
          </div>
        )}

        {phase === "processing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/90">
            <Icon name="Loader2" size={32} className="text-primary animate-spin" />
            <p className="text-foreground font-semibold">Structure from Motion</p>
            <p className="text-muted-foreground text-xs font-mono">OpenCV · поиск ключевых точек...</p>
          </div>
        )}

        {phase === "done" && result && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/90">
            <div className="w-14 h-14 border-2 border-primary rounded-full flex items-center justify-center">
              <Icon name="Check" size={24} className="text-primary" />
            </div>
            <p className="text-primary font-semibold font-mono">РЕКОНСТРУКЦИЯ ЗАВЕРШЕНА</p>
          </div>
        )}

        {phase === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 bg-background/90">
            <Icon name="AlertCircle" size={32} className="text-destructive" />
            <p className="text-destructive font-semibold text-center text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Кнопки управления */}
      <div className="flex gap-3">
        {phase === "idle" && (
          <button onClick={startCamera}
            className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Icon name="Camera" size={17} />
            Начать съёмку
          </button>
        )}
        {phase === "recording" && (
          <>
            <button onClick={stopAndProcess} disabled={framesCount < 10}
              className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
            >
              <Icon name="Cpu" size={17} />
              {framesCount < 10 ? `Ещё ${10 - framesCount} кадров...` : "Обработать"}
            </button>
            <button onClick={reset}
              className="bg-secondary text-muted-foreground px-4 rounded-lg hover:bg-border transition-colors"
            >
              <Icon name="X" size={17} />
            </button>
          </>
        )}
        {(phase === "done" || phase === "error") && (
          <button onClick={reset}
            className="flex-1 bg-secondary text-secondary-foreground font-semibold py-3 rounded-lg hover:bg-border transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="RotateCcw" size={17} />
            Сканировать заново
          </button>
        )}
      </div>

      {/* Результаты */}
      {result && (
        <div className="bg-card border border-border rounded-lg p-4 animate-fade-in space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Фотограмметрия · SfM
            </p>
            <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${
              result.accuracy_estimate.includes("5") ? "bg-primary/10 text-primary" : "bg-yellow-500/10 text-yellow-500"
            }`}>
              {result.accuracy_estimate}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Ширина", value: `${result.width} м` },
              { label: "Длина", value: `${result.length} м` },
              { label: "Высота", value: `${result.height} м` },
              { label: "Площадь", value: `${result.area} м²` },
            ].map((m) => (
              <div key={m.label} className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-xl font-black text-primary font-mono">{m.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground font-mono pt-1 border-t border-border">
            <span>Кадров: {result.frames_used}</span>
            <span>Точек облака: {result.point_cloud_points.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
