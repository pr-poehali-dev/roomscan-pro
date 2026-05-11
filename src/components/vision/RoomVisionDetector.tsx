import { useState } from "react";
import { toast } from "sonner";
import { saveDetection } from "@/lib/visionStore";
import type { DetectionResponse } from "./detector/constants";
import VisionDropzone from "./detector/VisionDropzone";
import VisionPreview from "./detector/VisionPreview";
import VisionStats from "./detector/VisionStats";
import VisionObjectList from "./detector/VisionObjectList";
import VisionActions from "./detector/VisionActions";

const ROOM_VISION_URL = "https://functions.poehali.dev/17f889d8-3cf6-4930-9c68-fc9f387dda28";

interface Props {
  /** Колбэк перехода в Планировщик после импорта */
  onImportToPlanner?: () => void;
}

/**
 * Детектор объектов в комнате по фото.
 * Загрузка фото → AI-детекция → bbox-overlay → импорт в планировщик.
 *
 * Держит state (фото / результат / исключённые / hover / loading) и
 * сетевой вызов. Презентация разнесена по detector/*.
 */
export default function RoomVisionDetector({ onImportToPlanner }: Props) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Это не изображение");
      return;
    }
    if (file.size > 5_000_000) {
      toast.error("Слишком большой файл", { description: "Максимум 5 МБ" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl);
      setResult(null);
      setExcluded(new Set());
    };
    reader.readAsDataURL(file);
  }

  async function analyze() {
    if (!imageBase64) {
      toast.error("Сначала загрузите фото");
      return;
    }
    setAnalyzing(true);
    try {
      const response = await fetch(ROOM_VISION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: imageBase64, area_m2: 25 }),
      });
      const data: DetectionResponse = await response.json();
      if (!response.ok) {
        toast.error("Не удалось распознать", {
          description: (data as { detail?: string }).detail ?? "Попробуйте ещё раз",
        });
        return;
      }
      setResult(data);
      if (data.fallback) {
        toast.info("AI не настроен", {
          description: "Показываем демо-результат. Администратор должен добавить ключ.",
        });
      } else {
        toast.success(
          `Найдено ${data.objects.length} объектов за ${((data.latency_ms ?? 0) / 1000).toFixed(1)} с`,
        );
      }
    } catch (e) {
      toast.error("Сетевая ошибка", {
        description: e instanceof Error ? e.message : "Попробуйте ещё раз",
      });
    } finally {
      setAnalyzing(false);
    }
  }

  function toggleExclude(idx: number) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function importToPlanner() {
    if (!result) return;
    const filtered = result.objects.filter((_, i) => !excluded.has(i));
    if (filtered.length === 0) {
      toast.error("Нечего импортировать", {
        description: "Все объекты исключены из выборки",
      });
      return;
    }
    saveDetection({
      objects: filtered,
      room_type: result.room_type,
      dominant_style: result.dominant_style,
      imagePreview: imagePreview ?? undefined,
    });
    toast.success(`${filtered.length} объектов готово к импорту`, {
      description: "Откройте Планировщик — нажмите «Импорт из фото»",
    });
    onImportToPlanner?.();
  }

  function reset() {
    setImagePreview(null);
    setImageBase64(null);
    setResult(null);
    setExcluded(new Set());
  }

  return (
    <div className="card-base p-5 lg:p-6 space-y-5">
      <div>
        <p className="t-meta text-primary mb-1.5">GPT-4 Vision · Object Detection</p>
        <h3 className="h-block text-foreground">Детектор мебели по фото</h3>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
          Загрузите фото комнаты — нейросеть распознает диваны, столы, кровати, окна, двери
          и автоматически создаст 3D-план. Никаких рулеток.
        </p>
      </div>

      {!imagePreview ? (
        <VisionDropzone onPick={handleFile} />
      ) : (
        <div className="space-y-4">
          <VisionPreview
            imagePreview={imagePreview}
            objects={result?.objects}
            excluded={excluded}
            hoverIdx={hoverIdx}
            analyzing={analyzing}
            onHover={setHoverIdx}
            onToggleExclude={toggleExclude}
          />

          {result && <VisionStats result={result} excludedCount={excluded.size} />}

          {result && (
            <VisionObjectList
              objects={result.objects}
              excluded={excluded}
              onHover={setHoverIdx}
              onToggleExclude={toggleExclude}
            />
          )}

          <VisionActions
            result={result}
            analyzing={analyzing}
            excludedCount={excluded.size}
            onAnalyze={analyze}
            onImport={importToPlanner}
            onReset={reset}
          />
        </div>
      )}
    </div>
  );
}
