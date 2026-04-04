import { useRef, useCallback, useState } from "react";

export interface PhotoFrame {
  dataUrl: string;
  timestamp: number;
  index: number;
}

export interface PhotogrammetryState {
  frames: PhotoFrame[];
  isCapturing: boolean;
  isProcessing: boolean;
  progress: number;
  error: string | null;
}

const SCAN_URL = "https://functions.poehali.dev/648d87c2-171e-4729-b3e2-2cafa6015a40";
const FRAMES_TARGET = 30;
const CAPTURE_INTERVAL_MS = 500;

export function usePhotogrammetry() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIndexRef = useRef(0);

  const [state, setState] = useState<PhotogrammetryState>({
    frames: [],
    isCapturing: false,
    isProcessing: false,
    progress: 0,
    error: null,
  });

  const captureFrame = useCallback(
    (video: HTMLVideoElement): PhotoFrame | null => {
      const canvas = canvasRef.current;
      if (!canvas || !video.videoWidth) return null;

      canvas.width = Math.min(video.videoWidth, 640);
      canvas.height = Math.round(
        (canvas.width / video.videoWidth) * video.videoHeight
      );

      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      return {
        dataUrl: canvas.toDataURL("image/jpeg", 0.75),
        timestamp: Date.now(),
        index: frameIndexRef.current++,
      };
    },
    []
  );

  const startCapture = useCallback(
    (video: HTMLVideoElement, onProgress: (p: number) => void) => {
      frameIndexRef.current = 0;
      setState((s) => ({
        ...s,
        frames: [],
        isCapturing: true,
        progress: 0,
        error: null,
      }));

      intervalRef.current = setInterval(() => {
        const frame = captureFrame(video);
        if (!frame) return;

        setState((s) => {
          const frames = [...s.frames, frame];
          const progress = Math.round((frames.length / FRAMES_TARGET) * 100);
          onProgress(Math.min(100, progress));

          if (frames.length >= FRAMES_TARGET) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return { ...s, frames, isCapturing: false, progress: 100 };
          }
          return { ...s, frames, progress };
        });
      }, CAPTURE_INTERVAL_MS);
    },
    [captureFrame]
  );

  const stopCapture = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState((s) => ({ ...s, isCapturing: false }));
  }, []);

  const processFrames = useCallback(
    async (
      frames: PhotoFrame[],
      token: string
    ): Promise<{
      pointCount: number;
      roomBounds: { width: number; depth: number; height: number } | null;
      points: { x: number; y: number; z: number }[];
    } | null> => {
      if (frames.length === 0) return null;

      setState((s) => ({ ...s, isProcessing: true, error: null }));

      try {
        // Отправляем каждый 3-й кадр для экономии трафика
        const keyFrames = frames.filter((_, i) => i % 3 === 0).slice(0, 10);

        const response = await fetch(`${SCAN_URL}?action=photogrammetry`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Auth-Token": token,
          },
          body: JSON.stringify({
            frames: keyFrames.map((f) => ({
              data: f.dataUrl.split(",")[1], // base64 без префикса
              index: f.index,
              timestamp: f.timestamp,
            })),
            frameCount: frames.length,
          }),
        });

        const data = await response.json();
        setState((s) => ({ ...s, isProcessing: false }));

        if (response.ok && data.result) {
          return data.result;
        }
        setState((s) => ({
          ...s,
          error: data.error || "Ошибка обработки кадров",
        }));
        return null;
      } catch {
        setState((s) => ({
          ...s,
          isProcessing: false,
          error: "Ошибка соединения с сервером",
        }));
        return null;
      }
    },
    []
  );

  return {
    canvasRef,
    state,
    startCapture,
    stopCapture,
    processFrames,
    FRAMES_TARGET,
  };
}
