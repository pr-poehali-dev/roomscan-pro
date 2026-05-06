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

    // Диагностика 0: проверка iframe и Permissions Policy
    const inIframe = typeof window !== "undefined" && window.self !== window.top;
    let permissionPolicyBlocked = false;
    try {
      if (inIframe && document.featurePolicy?.allowsFeature) {
        permissionPolicyBlocked = !document.featurePolicy.allowsFeature("camera");
      }
    } catch {
      // featurePolicy не поддерживается — игнорируем
    }

    if (permissionPolicyBlocked) {
      const directUrl = window.location.href.replace(/^https?:\/\/preview--/, "https://");
      setError(
        `Камера заблокирована политикой разрешений iframe предпросмотра. ` +
        `Откройте сайт напрямую (не в редакторе): ${directUrl}`
      );
      setPhase("error");
      return;
    }

    // Диагностика 1: HTTPS обязателен для getUserMedia
    if (typeof window !== "undefined" && window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
      setError("Камера работает только по HTTPS. Откройте сайт по защищённому соединению.");
      setPhase("error");
      return;
    }

    // Диагностика 2: проверяем поддержку API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Браузер не поддерживает доступ к камере. Используйте Chrome 90+ или Safari 14+.");
      setPhase("error");
      return;
    }

    // Диагностика 3: предварительная проверка статуса разрешения
    try {
      if (navigator.permissions?.query) {
        const status = await navigator.permissions.query({ name: "camera" as PermissionName });
        if (status.state === "denied") {
          setError(
            "Камера заблокирована для этого сайта. " +
            "Нажмите на иконку замка слева от адреса → Разрешения сайта → Камера → Разрешить, " +
            "затем перезагрузите страницу."
          );
          setPhase("error");
          return;
        }
      }
    } catch {
      // permissions API не поддерживается — пропускаем
    }

    // Шаг 1: получаем камеру
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string };
      let msg = "Не удалось получить доступ к камере.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        if (inIframe) {
          msg =
            "Доступ к камере запрещён внутри окна предпросмотра. " +
            "Откройте сайт в отдельной вкладке (кнопка «Открыть» вверху редактора или прямая ссылка вашего проекта), " +
            "и тогда браузер спросит разрешение на камеру.";
        } else {
          msg =
            "Доступ к камере запрещён. " +
            "Нажмите на иконку замка/камеры в адресной строке → разрешите камеру → перезагрузите страницу.";
        }
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "Камера не найдена. Проверьте, что устройство имеет камеру.";
      } else if (err.name === "NotReadableError") {
        msg = "Камера занята другим приложением. Закройте Skype/Zoom/другие камеры и попробуйте снова.";
      } else if (err.name === "OverconstrainedError") {
        // фолбек на любую камеру
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          msg = "";
        } catch {
          msg = "Не удалось настроить камеру с нужным разрешением.";
        }
        if (msg) {
          setError(msg);
          setPhase("error");
          return;
        }
      } else {
        msg = `Ошибка камеры: ${err.message || err.name || "неизвестная"}`;
      }
      if (msg) {
        setError(msg);
        setPhase("error");
        return;
      }
      stream = null as unknown as MediaStream;
    }

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      try {
        await videoRef.current.play();
      } catch {
        // некоторые браузеры требуют user gesture — игнорируем, видео всё равно стартует
      }
    }

    // Шаг 2: создаём scan_id на бэке
    let scanIdData: { scan_id?: string | number; error?: string };
    try {
      const { status, data } = await apiFetch(`${PHOTO_URL}?action=start`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      scanIdData = data;
      if (status !== 200 || !data.scan_id) {
        throw new Error(data.error || `Сервер вернул статус ${status}`);
      }
    } catch (e: unknown) {
      // если бэк не доступен — освобождаем камеру
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setError("Не удалось создать сканирование. " + (e instanceof Error ? e.message : ""));
      setPhase("error");
      return;
    }

    setScanId(scanIdData.scan_id!);
    setFramesCount(0);
    framesRef.current = [];
    recordingRef.current = true;
    setPhase("recording");

    let tipIdx = 0;
    let frameIdx = 0;

    captureIntervalRef.current = setInterval(() => {
      if (!recordingRef.current || !videoRef.current) return;
      // Проверяем, что видео реально играет
      if (videoRef.current.readyState < 2 || videoRef.current.videoWidth === 0) return;

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
    if (frames.length < 10) {
      setError(`Слишком мало кадров (${frames.length}/10). Нужно минимум 10 секунд съёмки. Попробуйте сканировать дольше и медленнее.`);
      setPhase("error");
      return;
    }

    setPhase("uploading");
    setUploadedCount(0);

    // Загрузка кадров с обработкой ошибок и повторами
    let uploadFailed = 0;
    const BATCH = 5;
    for (let i = 0; i < frames.length; i += BATCH) {
      const batch = frames.slice(i, i + BATCH);
      const b64s = await Promise.all(batch.map((b) => toBase64(b)));
      for (let j = 0; j < b64s.length; j++) {
        try {
          const { status, data } = await apiFetch(`${PHOTO_URL}?action=frame`, {
            method: "POST",
            body: JSON.stringify({ scan_id: scanId, frame: b64s[j], frame_index: i + j }),
          });
          if (status >= 400) {
            uploadFailed += 1;
            console.warn("Frame upload failed:", status, data);
          }
        } catch (e) {
          uploadFailed += 1;
          console.warn("Frame upload exception:", e);
        }
        setUploadedCount(i + j + 1);
      }
    }

    // Если упал каждый второй кадр — дальше нет смысла
    if (uploadFailed > frames.length / 2) {
      setError(`Не удалось загрузить кадры на сервер (${uploadFailed} ошибок из ${frames.length}). Проверьте интернет-соединение.`);
      setPhase("error");
      return;
    }

    setPhase("processing");
    let data: { result?: ScanResult; error?: string };
    try {
      const r = await apiFetch(`${PHOTO_URL}?action=process`, {
        method: "POST",
        body: JSON.stringify({ scan_id: scanId }),
      });
      data = r.data;
      if (r.status >= 400) {
        setError(data.error || `Сервер вернул статус ${r.status}`);
        setPhase("error");
        return;
      }
    } catch (e) {
      setError("Сервер обработки не ответил. " + (e instanceof Error ? e.message : ""));
      setPhase("error");
      return;
    }

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