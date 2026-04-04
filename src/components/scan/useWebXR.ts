import { useRef, useCallback, useState } from "react";
import * as THREE from "three";

export interface XRPoint {
  x: number;
  y: number;
  z: number;
  confidence: number;
}

export interface XRScanResult {
  points: XRPoint[];
  roomBounds: { width: number; depth: number; height: number } | null;
  frameCount: number;
}

export function useWebXR() {
  const sessionRef = useRef<XRSession | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pointsRef = useRef<XRPoint[]>([]);
  const animFrameRef = useRef<number>(0);

  const [result, setResult] = useState<XRScanResult>({
    points: [],
    roomBounds: null,
    frameCount: 0,
  });
  const [supported, setSupported] = useState<boolean | null>(null);

  const checkSupport = useCallback(async () => {
    if (!("xr" in navigator) || !navigator.xr) {
      setSupported(false);
      return false;
    }
    try {
      const ok = await navigator.xr.isSessionSupported("immersive-ar");
      setSupported(ok);
      return ok;
    } catch {
      setSupported(false);
      return false;
    }
  }, []);

  const extractRoomBounds = (points: XRPoint[]) => {
    if (points.length < 10) return null;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const zs = points.map((p) => p.z);
    return {
      width: parseFloat((Math.max(...xs) - Math.min(...xs)).toFixed(2)),
      height: parseFloat((Math.max(...ys) - Math.min(...ys)).toFixed(2)),
      depth: parseFloat((Math.max(...zs) - Math.min(...zs)).toFixed(2)),
    };
  };

  const startXRScan = useCallback(
    async (canvas: HTMLCanvasElement, onProgress: (p: number) => void) => {
      if (!navigator.xr) return false;

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
      renderer.xr.enabled = true;
      rendererRef.current = renderer;
      pointsRef.current = [];

      let frameCount = 0;
      const TARGET_FRAMES = 120;

      try {
        const session = await navigator.xr.requestSession("immersive-ar", {
          requiredFeatures: ["depth-sensing"],
          depthSensing: {
            usagePreference: ["cpu-optimized"],
            dataFormatPreference: ["luminance-alpha"],
          },
        } as XRSessionInit);

        sessionRef.current = session;
        renderer.xr.setSession(session);

        session.addEventListener("end", () => {
          sessionRef.current = null;
        });

        renderer.setAnimationLoop((_time, frame) => {
          if (!frame) return;
          frameCount++;
          onProgress(Math.min(100, Math.round((frameCount / TARGET_FRAMES) * 100)));

          const pose = frame.getViewerPose(
            renderer.xr.getReferenceSpace()!
          );
          if (!pose) return;

          // Пытаемся получить данные глубины
          for (const view of pose.views) {
            try {
              // @ts-expect-error — Depth API experimental
              const depthInfo = frame.getDepthInformation?.(view);
              if (!depthInfo) continue;

              const { width, height, data } = depthInfo;
              const step = Math.max(1, Math.floor(width / 40));

              for (let y = 0; y < height; y += step) {
                for (let x = 0; x < width; x += step) {
                  const idx = (y * width + x) * 2;
                  const depthRaw = (data[idx + 1] << 8) | data[idx];
                  const depth = depthRaw * depthInfo.rawValueToMeters;
                  if (depth < 0.1 || depth > 8) continue;

                  const nx = (x / width) * 2 - 1;
                  const ny = -(y / height) * 2 + 1;
                  const matrix = new THREE.Matrix4().fromArray(
                    view.projectionMatrix
                  );
                  const invProj = matrix.invert();

                  const vec = new THREE.Vector4(nx, ny, -1, 1)
                    .applyMatrix4(invProj)
                    .multiplyScalar(depth);

                  pointsRef.current.push({
                    x: parseFloat(vec.x.toFixed(3)),
                    y: parseFloat(vec.y.toFixed(3)),
                    z: parseFloat(vec.z.toFixed(3)),
                    confidence: Math.min(1, depthRaw / 4000),
                  });
                }
              }
            } catch {
              // Depth API не поддерживается на этом устройстве
            }
          }

          if (frameCount >= TARGET_FRAMES) {
            renderer.setAnimationLoop(null);
            const pts = pointsRef.current;
            setResult({
              points: pts,
              roomBounds: extractRoomBounds(pts),
              frameCount,
            });
            session.end();
          }
        });

        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const stopXRScan = useCallback(() => {
    rendererRef.current?.setAnimationLoop(null);
    sessionRef.current?.end().catch(() => {});
    sessionRef.current = null;
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  return { supported, result, checkSupport, startXRScan, stopXRScan };
}
