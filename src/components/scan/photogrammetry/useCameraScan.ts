import { useState, useRef, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { saveLastScan } from "@/lib/scanStore";
import type { Point3D } from "../PointCloud3D";
import type { ScanResult, Phase } from "./types";
import { PHOTO_URL, TIPS } from "./constants";
import { runCameraGuards } from "./cameraGuards";
import { requestCameraStream } from "./cameraErrors";
import { captureFrameBlob } from "./frameCapture";
import { uploadFrames } from "./uploadFrames";
import { processScan, fetchPointCloud } from "./processScan";

/**
 * Хук с полной логикой реального сканирования через камеру.
 * Оркестрирует фазы (idle → recording → uploading → processing → done/error),
 * а грязная работа (guards, getUserMedia, захват кадра, загрузка, обработка)
 * вынесена в чистые модули рядом.
 */
export function useCameraScan(onComplete: (result: ScanResult) => void) {
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

  const startCamera = useCallback(async () => {
    setError("");

    // pre-flight (iframe / https / API / permission)
    const guard = await runCameraGuards();
    if (!guard.ok) {
      setError(guard.error);
      setPhase("error");
      return;
    }

    // запрос камеры
    const inIframe = typeof window !== "undefined" && window.self !== window.top;
    const camRes = await requestCameraStream(inIframe);
    if ("error" in camRes) {
      setError(camRes.error);
      setPhase("error");
      return;
    }
    const stream = camRes.stream;

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      try {
        await videoRef.current.play();
      } catch {
        // некоторые браузеры требуют user gesture — игнорируем
      }
    }

    // создаём scan_id на бэке
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

    captureIntervalRef.current = setInterval(async () => {
      if (!recordingRef.current || !videoRef.current) return;
      tipIdx = (tipIdx + 1) % TIPS.length;
      setTip(tipIdx);

      const blob = await captureFrameBlob(videoRef.current);
      if (blob) {
        framesRef.current.push(blob);
        frameIdx += 1;
        setFramesCount(frameIdx);
      }
    }, 500);
  }, []);

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
      setError(
        `Слишком мало кадров (${frames.length}/10). Нужно минимум 10 секунд съёмки. Попробуйте сканировать дольше и медленнее.`,
      );
      setPhase("error");
      return;
    }

    setPhase("uploading");
    setUploadedCount(0);

    const { failed } = await uploadFrames(scanId, frames, setUploadedCount);
    if (failed > frames.length / 2) {
      setError(
        `Не удалось загрузить кадры на сервер (${failed} ошибок из ${frames.length}). Проверьте интернет-соединение.`,
      );
      setPhase("error");
      return;
    }

    setPhase("processing");
    const out = await processScan(scanId);
    if ("error" in out) {
      setError(out.error);
      setPhase("error");
      return;
    }

    const scanResult = out.result;
    setResult(scanResult);
    setPhase("done");
    onComplete(scanResult);

    // Сохраняем в общий store для Планировщика
    saveLastScan({
      width: scanResult.width,
      length: scanResult.length,
      height: scanResult.height,
      area: scanResult.area,
      doors: scanResult.doors,
      windows: scanResult.windows,
      openings: scanResult.openings,
    });

    // 3D-облако точек
    const pts3D = await fetchPointCloud(scanId, scanResult.height);
    if (pts3D.length > 0) setPoints3D(pts3D);
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

  return {
    // state
    phase, setPhase,
    framesCount,
    uploadedCount,
    result, setResult,
    points3D, setPoints3D,
    error, setError,
    tip,
    // refs
    videoRef,
    framesRef,
    // actions
    startCamera,
    stopAndProcess,
    reset,
  };
}
