import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { useCamera } from "./useCamera";
import { useWebXR } from "./useWebXR";
import { usePhotogrammetry } from "./usePhotogrammetry";
import PointCloudViewer from "./PointCloudViewer";
import { getToken } from "@/lib/api";

type ScanPhase =
  | "idle"          // Начальный экран
  | "mode-select"   // Выбор метода
  | "camera"        // Камера активна, выбор метода
  | "xr-scanning"   // WebXR идёт
  | "photo-capture" // Захват кадров
  | "processing"    // Обработка на сервере
  | "result";       // Результат

interface ScanResult {
  pointCount: number;
  points: { x: number; y: number; z: number; confidence?: number }[];
  roomBounds: {
    width: number;
    depth: number;
    height: number;
    area: number;
    perimeter: number;
    volume: number;
    wallCount: number;
    confidence: number;
  } | null;
  method: "webxr" | "photogrammetry";
}

export default function ScanSection() {
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const xrCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { videoRef, state: camState, startCamera, stopCamera, detectMode } = useCamera();
  const { supported: xrSupported, checkSupport, startXRScan, stopXRScan } = useWebXR();
  const { canvasRef: photoCanvas, state: photoState, startCapture, stopCapture, processFrames, FRAMES_TARGET } = usePhotogrammetry();

  // Проверяем WebXR при монтировании
  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  // Авто-стоп захвата кадров при достижении цели
  useEffect(() => {
    if (photoState.frames.length >= FRAMES_TARGET && phase === "photo-capture") {
      handlePhotoComplete();
    }
  }, [photoState.frames.length, phase]);

  const handleStart = async () => {
    setPhase("mode-select");
  };

  const handleModeSelect = async (mode: "webxr" | "photogrammetry") => {
    const stream = await startCamera();
    if (!stream) {
      setPhase("idle");
      return;
    }

    if (mode === "webxr") {
      if (!xrSupported) {
        setStatusMsg("WebXR не поддерживается. Используем фотограмметрию.");
        startPhotogrammetry();
        return;
      }
      setPhase("xr-scanning");
      setProgress(0);
      setStatusMsg("AR-сессия запускается...");

      if (!xrCanvasRef.current) return;
      const ok = await startXRScan(xrCanvasRef.current, (p) => {
        setProgress(p);
        setStatusMsg(`Глубинное сканирование: ${p}%`);
      });

      if (!ok) {
        setStatusMsg("WebXR недоступен — переключаемся на фотограмметрию");
        startPhotogrammetry();
      }
    } else {
      startPhotogrammetry();
    }
  };

  const startPhotogrammetry = () => {
    setPhase("photo-capture");
    setProgress(0);
    setStatusMsg("Медленно обводите камерой комнату...");
    if (videoRef.current) {
      startCapture(videoRef.current, (p) => {
        setProgress(p);
        setStatusMsg(p < 50
          ? "Снимаем левую часть комнаты..."
          : p < 80
          ? "Снимаем правую часть и углы..."
          : "Завершаем захват кадров...");
      });
    }
  };

  const handlePhotoComplete = async () => {
    stopCamera();
    setPhase("processing");
    setStatusMsg("Анализируем кадры и строим 3D-модель...");
    setProgress(0);

    // Имитируем прогресс обработки
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 3, 90));
    }, 200);

    const res = await processFrames(photoState.frames, getToken());
    clearInterval(progressInterval);
    setProgress(100);

    if (res) {
      setResult({
        pointCount: res.pointCount,
        points: res.points,
        roomBounds: res.roomBounds,
        method: "photogrammetry",
      });
      setPhase("result");
    } else {
      setStatusMsg("Ошибка обработки. Попробуйте ещё раз.");
      setPhase("idle");
    }
  };

  const handleCancel = () => {
    stopCamera();
    stopCapture();
    stopXRScan();
    setPhase("idle");
    setProgress(0);
    setStatusMsg("");
  };

  const handleReset = () => {
    setResult(null);
    setPhase("idle");
    setProgress(0);
    setStatusMsg("");
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest">
            {xrSupported ? "WebXR Depth + Photogrammetry" : "Photogrammetry"}
          </p>
          {xrSupported && (
            <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              ToF Ready
            </span>
          )}
        </div>
        <h2 className="text-3xl font-bold text-foreground">Сканирование помещения</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Основная панель */}
        <div className="lg:col-span-3 space-y-4">

          {/* Видео / Canvas */}
          <div className="bg-card border border-border rounded-xl overflow-hidden relative">
            <div
              ref={containerRef}
              className="relative bg-[#04080f] flex items-center justify-center"
              style={{ minHeight: 280 }}
            >
              {/* Скрытые служебные элементы */}
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover absolute inset-0 ${
                  (phase === "photo-capture") ? "opacity-100" : "opacity-0"
                }`}
                style={{ maxHeight: 340 }}
              />
              <canvas ref={photoCanvas} className="hidden" />
              <canvas
                ref={xrCanvasRef}
                className={`absolute inset-0 w-full h-full ${phase === "xr-scanning" ? "opacity-100" : "opacity-0"}`}
              />

              {/* === IDLE === */}
              {phase === "idle" && !result && (
                <div className="text-center py-14 px-6 z-10">
                  <div
                    className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                    style={{ background: "hsl(142 70% 36% / 0.12)", border: "1px solid hsl(142 70% 36% / 0.3)" }}
                  >
                    <Icon name="ScanLine" size={36} className="text-primary" />
                  </div>
                  <p className="text-foreground font-semibold text-lg mb-2">Готов к сканированию</p>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    Медленно обведите камерой все стены и углы помещения
                  </p>
                </div>
              )}

              {/* === MODE SELECT === */}
              {phase === "mode-select" && (
                <div className="w-full p-6 z-10 space-y-3">
                  <p className="text-center text-sm font-semibold text-foreground mb-4">Выберите метод сканирования</p>

                  <button
                    onClick={() => handleModeSelect("webxr")}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      xrSupported
                        ? "border-primary/40 bg-primary/5 hover:bg-primary/10 cursor-pointer"
                        : "border-border opacity-40 cursor-not-allowed"
                    }`}
                    disabled={!xrSupported}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon name="Cpu" size={20} className="text-primary" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-foreground text-sm">WebXR Depth API</p>
                      <p className="text-xs text-muted-foreground">ToF-сенсор, точность ±5 см · Android Chrome</p>
                    </div>
                    {xrSupported
                      ? <Icon name="CheckCircle2" size={18} className="text-primary shrink-0" />
                      : <span className="text-xs font-mono text-muted-foreground shrink-0">Н/Д</span>
                    }
                  </button>

                  <button
                    onClick={() => handleModeSelect("photogrammetry")}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/40 bg-secondary/30 hover:bg-secondary/50 transition-all cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Icon name="Camera" size={20} className="text-muted-foreground" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-foreground text-sm">Фотограмметрия</p>
                      <p className="text-xs text-muted-foreground">По видеокадрам, точность ±3–5 см · Любой телефон</p>
                    </div>
                    <Icon name="ChevronRight" size={18} className="text-muted-foreground shrink-0" />
                  </button>

                  <button
                    onClick={handleCancel}
                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    Отмена
                  </button>
                </div>
              )}

              {/* === PHOTO CAPTURE === */}
              {phase === "photo-capture" && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                  {/* Угловые маркеры */}
                  <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-primary rounded-tl" />
                  <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-primary rounded-tr" />
                  <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-primary rounded-bl" />
                  <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-primary rounded-br" />

                  {/* Статус */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-white text-xs font-mono">
                      {photoState.frames.length}/{FRAMES_TARGET} кадров
                    </span>
                  </div>

                  {/* Прогресс-дуга */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <div className="w-40 h-2 bg-black/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-white text-xs font-mono text-center mt-1">{statusMsg}</p>
                  </div>
                </div>
              )}

              {/* === XR SCANNING === */}
              {phase === "xr-scanning" && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-center">
                  <div className="w-48 h-1.5 bg-black/40 rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-white text-xs font-mono">{statusMsg}</p>
                </div>
              )}

              {/* === PROCESSING === */}
              {phase === "processing" && (
                <div className="text-center py-14 px-6 z-10">
                  <div className="relative mx-auto mb-5 w-16 h-16">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
                      <circle
                        cx="32" cy="32" r="28"
                        fill="none"
                        stroke="hsl(142 70% 36%)"
                        strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                        className="transition-all duration-300"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-primary text-sm font-bold font-mono">
                      {progress}%
                    </span>
                  </div>
                  <p className="text-foreground font-semibold mb-1">Строим 3D-модель</p>
                  <p className="text-muted-foreground text-sm">{statusMsg}</p>
                </div>
              )}

              {/* === RESULT preview === */}
              {phase === "result" && result && result.points.length > 0 && (
                <div className="w-full" style={{ height: 280 }}>
                  <PointCloudViewer points={result.points} width={600} height={280} />
                </div>
              )}

              {/* HUD — статус устройства */}
              {phase === "idle" && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="pulse-dot w-2 h-2 rounded-full bg-primary block" />
                  <span className="text-primary font-mono text-xs">
                    {xrSupported ? "WEBXR + PHOTO" : "PHOTO MODE"}
                  </span>
                </div>
              )}
            </div>

            {/* Кнопки управления */}
            <div className="p-4 border-t border-border flex gap-3">
              {(phase === "idle" || phase === "result") && (
                <>
                  <button
                    onClick={phase === "result" ? handleReset : handleStart}
                    className="flex-1 bg-primary text-primary-foreground font-semibold text-sm py-2.5 px-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Icon name={phase === "result" ? "RotateCcw" : "ScanLine"} size={16} />
                    {phase === "result" ? "Сканировать снова" : "Начать сканирование"}
                  </button>
                  <button className="bg-secondary text-secondary-foreground text-sm py-2.5 px-3 rounded-lg hover:bg-border transition-colors">
                    <Icon name="Settings2" size={16} />
                  </button>
                </>
              )}

              {(phase === "photo-capture" || phase === "xr-scanning") && (
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-destructive/10 border border-destructive/30 text-destructive text-sm py-2.5 px-4 rounded-lg hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Icon name="X" size={16} />
                  Остановить
                </button>
              )}

              {phase === "photo-capture" && (
                <button
                  onClick={handlePhotoComplete}
                  className="bg-primary text-primary-foreground text-sm py-2.5 px-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Icon name="Check" size={16} />
                  Готово
                </button>
              )}
            </div>
          </div>

          {/* Инструкция */}
          {phase === "photo-capture" && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 animate-fade-in">
              <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Icon name="Info" size={15} className="text-primary" />
                Как сканировать правильно
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex gap-2"><span className="text-primary">1.</span> Держите телефон вертикально</li>
                <li className="flex gap-2"><span className="text-primary">2.</span> Медленно поворачивайтесь на 360°</li>
                <li className="flex gap-2"><span className="text-primary">3.</span> Направьте камеру к полу, затем к потолку</li>
                <li className="flex gap-2"><span className="text-primary">4.</span> Зайдите в каждый угол комнаты</li>
              </ul>
            </div>
          )}
        </div>

        {/* Правая панель — параметры и результат */}
        <div className="lg:col-span-2 space-y-3">

          {/* Характеристики метода */}
          <div className="space-y-2">
            {[
              {
                icon: "Wifi",
                label: "WebXR Depth API",
                value: xrSupported ? "Поддерживается" : "Недоступен",
                ok: !!xrSupported,
              },
              {
                icon: "Camera",
                label: "Фотограмметрия",
                value: "Любое устройство",
                ok: true,
              },
              {
                icon: "Ruler",
                label: "Точность",
                value: xrSupported ? "±3–5 см" : "±5–10 см",
                ok: true,
              },
              {
                icon: "Zap",
                label: "Обработка",
                value: "ИИ на сервере",
                ok: true,
              },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Icon name={item.icon} size={16} className={item.ok ? "text-primary" : "text-muted-foreground"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-semibold text-foreground">{item.value}</p>
                </div>
                {item.ok && <Icon name="CheckCircle2" size={15} className="text-primary shrink-0" />}
              </div>
            ))}
          </div>

          {/* Результаты */}
          {result?.roomBounds ? (
            <div className="bg-card border border-primary/30 rounded-xl p-4 animate-fade-in">
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-3">
                Результат сканирования
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { v: `${result.roomBounds.width} м`, l: "ширина" },
                  { v: `${result.roomBounds.depth} м`, l: "глубина" },
                  { v: `${result.roomBounds.height} м`, l: "высота" },
                  { v: `${result.roomBounds.area} м²`, l: "площадь" },
                ].map((s) => (
                  <div key={s.l} className="bg-secondary rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-black text-primary font-mono">{s.v}</p>
                    <p className="text-xs text-muted-foreground">{s.l}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-mono border-t border-border pt-2 mt-1">
                <span>Периметр: {result.roomBounds.perimeter} м</span>
                <span>Объём: {result.roomBounds.volume} м³</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {result.pointCount.toLocaleString()} точек · {result.method === "webxr" ? "WebXR" : "Фото"}
                </span>
                <span className="text-primary font-semibold">
                  {Math.round(result.roomBounds.confidence * 100)}% уверенность
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                Ожидание сканирования
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: "—", l: "комнаты" },
                  { v: "— м²", l: "площадь" },
                  { v: "—", l: "проёмов" },
                ].map((s) => (
                  <div key={s.l} className="text-center">
                    <p className="text-xl font-black text-border font-mono">{s.v}</p>
                    <p className="text-xs text-muted-foreground">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ошибка */}
          {(camState.error || photoState.error) && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex gap-2 animate-fade-in">
              <Icon name="AlertCircle" size={16} className="text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{camState.error || photoState.error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
