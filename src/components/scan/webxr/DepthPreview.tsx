import { forwardRef } from "react";
import Icon from "@/components/ui/icon";
import type { ScanPhase, DepthPoint, RoomMeasurement } from "./types";

/**
 * Превью depth-карты со всеми состояниями фаз сканирования:
 * idle — приглашение, scanning — линия + прогресс, processing — спиннер, done — галочка.
 * canvas-реф пробрасывается наружу через forwardRef, чтобы родитель мог рисовать на нём.
 */
interface Props {
  phase: ScanPhase;
  progress: number;
  depthPoints: DepthPoint[];
  measurement: RoomMeasurement | null;
}

const DepthPreview = forwardRef<HTMLCanvasElement, Props>(function DepthPreview(
  { phase, progress, depthPoints, measurement },
  canvasRef,
) {
  return (
    <div
      className="relative bg-[#050810] rounded-lg overflow-hidden border border-border"
      style={{ aspectRatio: "16/9" }}
    >
      <canvas
        ref={canvasRef}
        width={320}
        height={180}
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
          <div
            className="scan-line absolute left-0 right-0 h-px bg-primary opacity-70"
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
              <div
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
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
  );
});

export default DepthPreview;
