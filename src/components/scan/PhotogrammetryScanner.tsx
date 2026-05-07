import PointCloud3D, { type RoomBox } from "./PointCloud3D";
import MobileQRBlock from "./MobileQRBlock";
import CameraPermissionStatus from "./CameraPermissionStatus";
import ScannerViewport from "./photogrammetry/ScannerViewport";
import ScannerControls from "./photogrammetry/ScannerControls";
import ScanResultPanel from "./photogrammetry/ScanResultPanel";
import ProcessingTimeline from "./photogrammetry/ProcessingTimeline";
import { TIPS } from "./photogrammetry/constants";
import { useCameraScan } from "./photogrammetry/useCameraScan";
import { useDemoScan } from "./photogrammetry/useDemoScan";
import {
  DesktopIframeHelp,
  MobileIframeHelp,
  DemoFallbackButton,
} from "./photogrammetry/IframeHelpBlocks";
import type { ScanResult } from "./photogrammetry/types";

/**
 * PhotogrammetryScanner — главный компонент сканирования через камеру.
 *
 * Декомпозирован на:
 *  • useCameraScan       — реальная камера + загрузка кадров + обработка
 *  • useDemoScan         — синтетический скан без камеры (для iframe/демо)
 *  • IframeHelpBlocks    — три UI-блока подсказок (desktop iframe, mobile iframe, демо-кнопка)
 *  • constants           — PHOTO_URL, TIPS, toBase64
 *
 * Все состояния, рефы и переходы фаз остались идентичны исходной версии.
 */
export default function PhotogrammetryScanner({ onComplete }: { onComplete: (result: ScanResult) => void }) {
  const camera = useCameraScan(onComplete);
  const {
    phase, framesCount, uploadedCount, result, points3D, error, tip,
    videoRef, framesRef,
    startCamera, stopAndProcess, reset,
    setPhase, setError, setPoints3D, setResult,
  } = camera;

  const runDemoScan = useDemoScan({ setError, setPhase, setPoints3D, setResult, onComplete });

  const uploadPct = framesRef.current.length > 0
    ? Math.round((uploadedCount / framesRef.current.length) * 100)
    : 0;

  // Превентивная проверка iframe — показываем предупреждение ДО клика «Начать»
  const inIframe = typeof window !== "undefined" && window.self !== window.top;
  const isMobile = typeof navigator !== "undefined"
    && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const directUrl = typeof window !== "undefined"
    ? window.location.href.replace(/^(https?:\/\/)preview--/, "$1") + "#scan"
    : "";
  // Десктоп в iframe — QR + кнопки. Мобильный в iframe — отдельный мобильный блок.
  const showIframeHelp = inIframe && phase === "idle" && !isMobile;
  const showMobileIframeHelp = inIframe && phase === "idle" && isMobile;

  return (
    <div className="space-y-4">
      {showIframeHelp && (
        <DesktopIframeHelp directUrl={directUrl} onDemo={runDemoScan} />
      )}

      {showIframeHelp && <MobileQRBlock />}

      {showMobileIframeHelp && (
        <MobileIframeHelp directUrl={directUrl} onDemo={runDemoScan} />
      )}

      {phase === "idle" && !showIframeHelp && !showMobileIframeHelp && <CameraPermissionStatus />}

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

      {phase === "idle" && <DemoFallbackButton onDemo={runDemoScan} />}

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
