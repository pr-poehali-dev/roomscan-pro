import { RefObject } from "react";
import Icon from "@/components/ui/icon";
import type { Phase, ScanResult } from "./types";

interface Props {
  videoRef: RefObject<HTMLVideoElement>;
  phase: Phase;
  framesCount: number;
  uploadedCount: number;
  totalFrames: number;
  uploadPct: number;
  tip: number;
  tips: string[];
  result: ScanResult | null;
  error: string;
}

export default function ScannerViewport({
  videoRef, phase, framesCount, uploadedCount, totalFrames, uploadPct, tip, tips, result, error,
}: Props) {
  return (
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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="w-16 h-16 bg-primary/10 border-2 border-primary/30 rounded-full flex items-center justify-center">
            <Icon name="Camera" size={28} className="text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">Медленно снимайте все стены помещения</p>
          <p className="text-xs text-muted-foreground font-mono">Минимум 10 секунд · рекомендуется 30–60 секунд</p>
          <p className="text-[10px] text-muted-foreground/70 font-mono mt-2">
            При первом запуске разрешите доступ к камере во всплывающем окне
          </p>
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
              💡 {tips[tip]}
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
            {uploadedCount} / {totalFrames} кадров · {uploadPct}%
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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 bg-background/95 overflow-y-auto">
          <Icon name="AlertCircle" size={32} className="text-destructive shrink-0" />
          <p className="text-destructive font-semibold text-center text-sm max-w-md">{error}</p>
          <div className="bg-secondary/40 rounded-md p-3 text-xs text-muted-foreground max-w-md text-left">
            <p className="font-semibold text-foreground mb-1.5">Что попробовать:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Перезагрузите страницу и нажмите «Разрешить» для камеры</li>
              <li>Откройте сайт по HTTPS (не HTTP)</li>
              <li>Проверьте, что камеру не использует другое приложение</li>
              <li>Используйте Chrome 90+ на Android или Safari 14+ на iOS</li>
              <li>В настройках браузера: разрешения → камера → разрешить</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}