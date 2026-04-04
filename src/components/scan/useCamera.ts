import { useRef, useState, useCallback } from "react";

export type ScanMode = "webxr" | "photogrammetry" | "none";

export interface CameraState {
  stream: MediaStream | null;
  mode: ScanMode;
  error: string | null;
  isActive: boolean;
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<CameraState>({
    stream: null,
    mode: "none",
    error: null,
    isActive: false,
  });

  const startCamera = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState((s) => ({ ...s, stream, isActive: true, error: null }));
      return stream;
    } catch (e) {
      const msg =
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Нет разрешения на камеру. Разрешите доступ в настройках браузера."
          : "Не удалось получить доступ к камере.";
      setState((s) => ({ ...s, error: msg, isActive: false }));
      return null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    state.stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setState((s) => ({ ...s, stream: null, isActive: false }));
  }, [state.stream]);

  const detectMode = useCallback((): ScanMode => {
    // WebXR Depth API — Chrome Android с ToF-сенсором
    if ("xr" in navigator && navigator.xr) return "webxr";
    // Иначе — фотограмметрия
    return "photogrammetry";
  }, []);

  const setMode = useCallback((mode: ScanMode) => {
    setState((s) => ({ ...s, mode }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((s) => ({ ...s, error }));
  }, []);

  return { videoRef, state, startCamera, stopCamera, detectMode, setMode, setError };
}
