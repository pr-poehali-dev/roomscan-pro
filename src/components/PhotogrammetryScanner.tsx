import { useState, useRef, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { SCAN_URL, apiFetch } from "@/lib/api";

interface ScanResult {
  area: number;
  width: number;
  length: number;
  height: number;
  framesUsed: number;
  accuracy: string;
  glbUrl?: string;
  scanId: number;
}

interface PhotogrammetryScannerProps {
  onResult: (result: ScanResult) => void;
  onCancel: () => void;
  projectId?: number;
}

const MAX_FRAMES = 60;
const CAPTURE_INTERVAL_MS = 800;

export default function PhotogrammetryScanner({ onResult, onCancel, projectId }: PhotogrammetryScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanIdRef = useRef<number | null>(null);
  const frameIndexRef = useRef(0);

  const [phase, setPhase] = useState<"intro" | "camera" | "capturing" | "uploading" | "processing" | "done" | "error">("intro");
  const [framesCapt, setFramesCapt] = useState(0);
  const [framesUploaded, setFramesUploaded] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [motionHint, setMotionHint] = useState("Начните медленно поворачиваться по комнате");

  const motionHints = [
    "Медленно обходите комнату по периметру",
    "Задержитесь на углах — они важны",
    "Снимайте от пола до потолка",
    "Держите телефон плавно, без тряски",
    "Перекрывайте соседние кадры на 60%",
    "Осталось ещё немного — продолжайте",
  ];

  useEffect(() => {
    if (phase !== "capturing") return;
    let i = 0;
    const iv = setInterval(() => {
      i = (i + 1) % motionHints.length;
      setMotionHint(motionHints[i]);
    }, 6000);
    return () => clearInterval(iv);
  }, [phase]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
      if (captureTimerRef.current) clearInterval(captureTimerRef.current);
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setPhase("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch (err) {
      setErrorMsg("Не удалось получить доступ к камере. Разрешите доступ в настройках браузера.");
      setPhase("error");
    }
  };

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    canvas.width = 960;
    canvas.height = Math.round((video.videoHeight / video.videoWidth) * 960);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // качество 0.7 — баланс между размером и деталями для фотограмметрии
    return canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
  }, []);

  const uploadFrame = async (frame: string, index: number, scanId: number): Promise<boolean> => {
    const { status } = await apiFetch(`${SCAN_URL}?action=frame`, {
      method: "POST",
      body: JSON.stringify({ scan_id: scanId, frame, frame_index: index }),
    });
    return status === 200;
  };

  const startCapturing = async () => {
    // 1. Создаём новое сканирование на сервере
    const { status, data } = await apiFetch(`${SCAN_URL}?action=start`, {
      method: "POST",
      body: JSON.stringify({ project_id: projectId }),
    });
    if (status !== 200 || !data.scan_id) {
      setErrorMsg(data.error || "Не удалось создать сканирование");
      setPhase("error");
      return;
    }
    scanIdRef.current = data.scan_id;
    frameIndexRef.current = 0;
    setFramesCapt(0);
    setPhase("capturing");
    setMotionHint("Медленно обходите комнату по периметру");

    // 2. Захват кадров каждые 800мс + немедленная загрузка
    captureTimerRef.current = setInterval(async () => {
      if (frameIndexRef.current >= MAX_FRAMES) {
        if (captureTimerRef.current) clearInterval(captureTimerRef.current);
        finishCapturing();
        return;
      }

      const frame = captureFrame();
      if (!frame) return;

      const idx = frameIndexRef.current++;
      setFramesCapt(idx + 1);

      // Загружаем кадр асинхронно, не блокируя захват
      uploadFrame(frame, idx, scanIdRef.current!).then((ok) => {
        if (ok) setFramesUploaded((n) => n + 1);
      });
    }, CAPTURE_INTERVAL_MS);
  };

  const finishCapturing = useCallback(async () => {
    if (captureTimerRef.current) { clearInterval(captureTimerRef.current); captureTimerRef.current = null; }
    stopCamera();
    setPhase("uploading");

    // Ждём завершения всех загрузок (до 15 сек)
    const scanId = scanIdRef.current!;
    let waited = 0;
    while (framesUploaded < frameIndexRef.current - 2 && waited < 15000) {
      await new Promise((r) => setTimeout(r, 500));
      waited += 500;
      setUploadProgress(Math.round((framesUploaded / Math.max(frameIndexRef.current, 1)) * 100));
    }

    // 3. Запускаем реконструкцию
    setPhase("processing");
    const { status, data } = await apiFetch(`${SCAN_URL}?action=process`, {
      method: "POST",
      body: JSON.stringify({ scan_id: scanId }),
    });

    if (status !== 200 || !data.result) {
      setErrorMsg(data.error || "Ошибка реконструкции");
      setPhase("error");
      return;
    }

    setPhase("done");
    onResult({
      area: data.result.area,
      width: data.result.width,
      length: data.result.length,
      height: data.result.height,
      framesUsed: data.result.frames_used,
      accuracy: data.result.accuracy_estimate,
      glbUrl: data.result.glb_url,
      scanId,
    });
  }, [framesUploaded, onResult]);

  const stopEarly = () => {
    if (captureTimerRef.current) clearInterval(captureTimerRef.current);
    finishCapturing();
  };

  const progressPct = Math.round((framesCapt / MAX_FRAMES) * 100);

  // ── Intro ──
  if (phase === "intro") {
    return (
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-center">
              <Icon name="Camera" size={20} className="text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground">Фотограмметрия</p>
              <p className="text-xs text-muted-foreground">3D-реконструкция из видеокадров</p>
            </div>
            <span className="ml-auto text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-mono">Любой телефон</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { icon: "Ruler", label: "Точность", val: "±5–8 см" },
              { icon: "Camera", label: "Кадров", val: "30–60" },
              { icon: "Clock", label: "Время", val: "~2 мин" },
            ].map((s) => (
              <div key={s.label} className="bg-secondary rounded-lg p-3 text-center">
                <Icon name={s.icon} size={16} className="text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xs font-semibold text-foreground">{s.val}</p>
              </div>
            ))}
          </div>

          <div className="bg-secondary/50 rounded-lg p-3 mb-5 space-y-2">
            <p className="text-xs font-semibold text-foreground">Как получить лучший результат:</p>
            {[
              "Хорошее освещение — включите весь свет",
              "Медленно обходите комнату по периметру",
              "Снимайте каждый угол отдельно",
              "Избегайте зеркал и блестящих поверхностей",
              "Держите телефон на одной высоте (~120 см)",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Icon name="CheckCircle2" size={12} className="text-primary shrink-0 mt-0.5" />
                {tip}
              </div>
            ))}
          </div>

          <button
            onClick={startCamera}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Icon name="Camera" size={18} />
            Открыть камеру
          </button>
        </div>
        <button onClick={onCancel} className="w-full text-muted-foreground text-sm py-2 hover:text-foreground transition-colors">
          Отмена
        </button>
      </div>
    );
  }

  // ── Camera preview ──
  if (phase === "camera") {
    return (
      <div className="space-y-4">
        <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "9/16", maxHeight: 480 }}>
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon name="Loader2" size={32} className="text-primary animate-spin" />
            </div>
          )}
          {cameraReady && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Grid overlay для выравнивания */}
              <div className="absolute inset-0" style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                backgroundSize: "33.3% 33.3%"
              }} />
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-white text-xs bg-black/50 inline-block px-3 py-1 rounded-full backdrop-blur-sm">
                  Встаньте в центр комнаты
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={startCapturing}
            disabled={!cameraReady}
            className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
          >
            <Icon name="Circle" size={18} />
            Начать съёмку
          </button>
          <button onClick={() => { stopCamera(); onCancel(); }}
            className="bg-secondary text-secondary-foreground px-4 py-3 rounded-lg hover:bg-border transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>
      </div>
    );
  }

  // ── Capturing ──
  if (phase === "capturing") {
    return (
      <div className="space-y-4">
        <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "9/16", maxHeight: 480 }}>
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          {/* Recording indicator */}
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse block" />
            <span className="text-white text-xs font-mono">REC {framesCapt}/{MAX_FRAMES}</span>
          </div>
          {/* Progress arc overlay */}
          <div className="absolute top-3 right-3">
            <svg viewBox="0 0 44 44" className="w-11 h-11 -rotate-90">
              <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
              <circle cx="22" cy="22" r="18" fill="none" stroke="hsl(142,70%,36%)"
                strokeWidth="3" strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - progressPct / 100)}`}
                strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s" }} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">{progressPct}%</span>
          </div>
          {/* Hint */}
          <div className="absolute bottom-4 left-3 right-3">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex items-start gap-2">
              <Icon name="Info" size={13} className="text-primary shrink-0 mt-0.5" />
              <p className="text-white text-xs">{motionHint}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-secondary rounded-lg p-3 text-center">
              <p className="text-lg font-black text-primary font-mono">{framesCapt}</p>
              <p className="text-xs text-muted-foreground">кадров захвачено</p>
            </div>
            <div className="bg-secondary rounded-lg p-3 text-center">
              <p className="text-lg font-black text-primary font-mono">{framesUploaded}</p>
              <p className="text-xs text-muted-foreground">загружено</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-muted-foreground">Прогресс съёмки</span>
              <span className="text-primary">{progressPct}%</span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <button
            onClick={stopEarly}
            disabled={framesCapt < 15}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
          >
            <Icon name="CheckCircle2" size={18} />
            {framesCapt < 15 ? `Ещё ${15 - framesCapt} кадров...` : "Завершить и обработать"}
          </button>
        </div>
      </div>
    );
  }

  // ── Uploading ──
  if (phase === "uploading") {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center mx-auto">
          <Icon name="Upload" size={28} className="text-primary" />
        </div>
        <div>
          <p className="font-bold text-foreground mb-1">Загрузка кадров</p>
          <p className="text-sm text-muted-foreground">{framesUploaded} из {framesCapt} кадров</p>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
        </div>
      </div>
    );
  }

  // ── Processing ──
  if (phase === "processing") {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center space-y-5">
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-2 border-2 border-primary/10 rounded-full" />
          <div className="absolute inset-2 border-2 border-primary/40 border-b-transparent rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          <Icon name="Box" size={24} className="text-primary absolute inset-0 m-auto" />
        </div>
        <div>
          <p className="font-bold text-foreground text-lg mb-1">Реконструкция 3D-модели</p>
          <p className="text-sm text-muted-foreground">Анализируем {framesCapt} кадров...</p>
        </div>
        <div className="bg-secondary rounded-lg p-3 text-left space-y-2">
          {[
            { label: "Обнаружение ключевых точек", done: true },
            { label: "Сопоставление кадров (feature matching)", done: true },
            { label: "Structure from Motion (SfM)", done: framesCapt > 10 },
            { label: "Построение mesh", done: false },
            { label: "Вычисление размеров", done: false },
          ].map((step) => (
            <div key={step.label} className="flex items-center gap-2 text-xs">
              {step.done
                ? <Icon name="CheckCircle2" size={13} className="text-primary shrink-0" />
                : <Icon name="Loader2" size={13} className="text-muted-foreground shrink-0 animate-spin" />
              }
              <span className={step.done ? "text-foreground" : "text-muted-foreground"}>{step.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Обычно занимает 5–15 секунд</p>
      </div>
    );
  }

  // ── Error ──
  if (phase === "error") {
    return (
      <div className="bg-card border border-destructive/30 rounded-xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center shrink-0">
            <Icon name="AlertCircle" size={20} className="text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Ошибка сканирования</p>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setPhase("intro")} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
            Попробовать снова
          </button>
          <button onClick={onCancel} className="flex-1 bg-secondary text-secondary-foreground py-2.5 rounded-lg text-sm font-semibold hover:bg-border transition-colors">
            Отмена
          </button>
        </div>
      </div>
    );
  }

  return null;
}
