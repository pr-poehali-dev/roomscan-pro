/** Общие типы для WebXR-сканера и его подкомпонентов. */

export interface DepthPoint {
  x: number;
  y: number;
  depth: number;
}

export interface RoomMeasurement {
  width: number;
  height: number;
  depth: number;
  area: number;
}

export type ScanPhase = "idle" | "scanning" | "processing" | "done";
export type Supported = "checking" | "yes" | "no";

/* Глобальные типы WebXR Depth API */
type XRSessionMode = "immersive-ar";

declare global {
  interface Navigator {
    xr?: {
      isSessionSupported: (mode: XRSessionMode) => Promise<boolean>;
      requestSession: (mode: XRSessionMode, options?: object) => Promise<XRSession>;
    };
  }
  interface XRSession {
    requestReferenceSpace: (type: string) => Promise<XRReferenceSpace>;
    requestAnimationFrame: (cb: XRFrameRequestCallback) => number;
    end: () => Promise<void>;
    addEventListener: (e: string, cb: unknown) => void;
  }
  interface XRReferenceSpace {
    getOffsetReferenceSpace?: (t: XRRigidTransform) => XRReferenceSpace;
  }
  interface XRRigidTransform {
    position?: DOMPointInit;
    orientation?: DOMPointInit;
  }
  type XRFrameRequestCallback = (time: number, frame: XRFrame) => void;
  interface XRFrame {
    getDepthInformation?: (view: XRView) => XRDepthInformation | null;
    getViewerPose: (space: XRReferenceSpace) => XRViewerPose | null;
  }
  interface XRDepthInformation {
    width: number;
    height: number;
    getDepthInMeters: (x: number, y: number) => number;
  }
  interface XRViewerPose {
    views: XRView[];
  }
  interface XRView {
    camera?: unknown;
  }
}

export {};
