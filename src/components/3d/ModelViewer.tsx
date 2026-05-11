/**
 * Обёртка над Google <model-viewer> для просмотра GLB в браузере.
 * Поддерживает AR Quick Look на iOS/Android.
 * Сам Web Component подгружается из CDN в index.html.
 */
import { useEffect, useRef } from "react";

interface ModelViewerProps {
  src: string;
  alt?: string;
  poster?: string;
  ar?: boolean;
  autoRotate?: boolean;
  cameraControls?: boolean;
  iosSrc?: string;
  className?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          ar?: boolean | string;
          "ar-modes"?: string;
          "auto-rotate"?: boolean | string;
          "camera-controls"?: boolean | string;
          "ios-src"?: string;
          poster?: string;
          "shadow-intensity"?: string;
          exposure?: string;
          "environment-image"?: string;
          loading?: "auto" | "lazy" | "eager";
        },
        HTMLElement
      >;
    }
  }
}

export default function ModelViewer({
  src,
  alt = "3D-модель",
  poster,
  ar = true,
  autoRotate = true,
  cameraControls = true,
  iosSrc,
  className = "",
}: ModelViewerProps) {
  const ref = useRef<HTMLElement>(null);

  // Если model-viewer ещё не загрузился — показываем плейсхолдер.
  useEffect(() => {
    const check = setInterval(() => {
      if (customElements.get("model-viewer")) {
        clearInterval(check);
      }
    }, 200);
    return () => clearInterval(check);
  }, []);

  return (
    <model-viewer
      ref={ref}
      src={src}
      alt={alt}
      poster={poster}
      ar={ar || undefined}
      ar-modes="webxr scene-viewer quick-look"
      auto-rotate={autoRotate || undefined}
      camera-controls={cameraControls || undefined}
      ios-src={iosSrc}
      shadow-intensity="1"
      exposure="1"
      loading="lazy"
      className={className}
      style={{
        width: "100%",
        height: "100%",
        background: "transparent",
        "--poster-color": "transparent",
      } as React.CSSProperties}
    />
  );
}
