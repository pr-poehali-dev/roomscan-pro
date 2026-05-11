import Icon from "@/components/ui/icon";
import WebXRScanner from "./WebXRScanner";
import PhotogrammetryScanner from "./PhotogrammetryScanner";
import RoomVisionDetector from "@/components/vision/RoomVisionDetector";
import RoomPoseDetector from "@/components/vision/RoomPoseDetector";
import type { Method, Measurement } from "./types";

/**
 * Активный экран выбранного метода сканирования: рисует шапку
 * с иконкой/подписью и подключает соответствующий сканер.
 */
interface Props {
  method: Exclude<Method, "choose">;
  onComplete: (data: Measurement) => void;
  onApplied: () => void;
}

function MethodHeader({
  icon,
  title,
  subtitle,
  accent = false,
}: {
  icon: string;
  title: string;
  subtitle: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 mb-4 bg-card rounded-xl px-4 py-3 ${
        accent ? "border-2 border-primary/40" : "border border-border"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          accent ? "bg-primary/15" : "bg-primary/10"
        }`}
      >
        <Icon name={icon} size={16} className="text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground font-mono">{subtitle}</p>
      </div>
    </div>
  );
}

export default function MethodRunner({ method, onComplete, onApplied }: Props) {
  if (method === "webxr") {
    return (
      <div className="animate-fade-in">
        <MethodHeader
          icon="Scan"
          title="WebXR Depth API"
          subtitle="Chrome Android · ToF/LiDAR"
        />
        <WebXRScanner onComplete={onComplete} />
      </div>
    );
  }

  if (method === "photo") {
    return (
      <div className="animate-fade-in">
        <MethodHeader
          icon="Camera"
          title="Фотограмметрия · Structure from Motion"
          subtitle="OpenCV · любой Android"
        />
        <PhotogrammetryScanner onComplete={onComplete} />
      </div>
    );
  }

  if (method === "vision") {
    return (
      <div className="animate-fade-in">
        <MethodHeader
          icon="ScanSearch"
          title="AI-детекция объектов · GPT-4 Vision"
          subtitle="Авто-импорт мебели и проёмов в план"
        />
        <RoomVisionDetector />
      </div>
    );
  }

  // pose
  return (
    <div className="animate-fade-in">
      <MethodHeader
        icon="ScanEye"
        title="Pose AI · полная 3D-планировка из 1 фото"
        subtitle="Габариты комнаты + стены + проёмы + поза каждой мебели"
        accent
      />
      <RoomPoseDetector onApplied={onApplied} />
    </div>
  );
}
