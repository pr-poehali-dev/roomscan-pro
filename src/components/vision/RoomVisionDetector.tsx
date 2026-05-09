import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import {
  saveDetection,
  type DetectedObject,
} from "@/lib/visionStore";

const ROOM_VISION_URL = "https://functions.poehali.dev/17f889d8-3cf6-4930-9c68-fc9f387dda28";

interface DetectionResponse {
  objects: DetectedObject[];
  room_type: string;
  dominant_style: string;
  latency_ms?: number;
  fallback?: boolean;
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  living: "Гостиная",
  bedroom: "Спальня",
  kitchen: "Кухня",
  bathroom: "Ванная",
  hall: "Прихожая",
  office: "Кабинет",
  child: "Детская",
};

const STYLE_LABELS: Record<string, string> = {
  scandi: "Скандинавский",
  loft: "Лофт",
  classic: "Классика",
  minimal: "Минимализм",
  modern: "Модерн",
  japandi: "Японди",
  glamour: "Гламур",
  midcentury: "Mid-century",
};

// Палитра bbox по типу объекта (для визуального различия)
const BBOX_COLORS: Record<string, string> = {
  sofa: "#22c55e",
  armchair: "#10b981",
  table: "#f59e0b",
  chair: "#eab308",
  bed: "#8b5cf6",
  wardrobe: "#a855f7",
  tv: "#3b82f6",
  lamp: "#f97316",
  plant: "#16a34a",
  rug: "#ec4899",
  shelf: "#06b6d4",
  kitchen: "#ef4444",
  door: "#64748b",
  window: "#0ea5e9",
  fireplace: "#dc2626",
  sink: "#0284c7",
  toilet: "#475569",
  bathtub: "#14b8a6",
};

interface Props {
  /** Колбэк перехода в Планировщик после импорта */
  onImportToPlanner?: () => void;
}

/**
 * Детектор объектов в комнате по фото.
 * Загрузка фото → AI-детекция → bbox-overlay → импорт в планировщик.
 */
export default function RoomVisionDetector({ onImportToPlanner }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
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
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Icon name="ScanSearch" size={26} className="text-primary" />
          </div>
          <p className="font-bold text-foreground mb-1">Загрузите фото комнаты</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Лучше фронтально — чтобы камера видела все стены
          </p>
        </button>
      ) : (
        <div className="space-y-4">
          {/* Превью с overlay */}
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-secondary">
            <img
              src={imagePreview}
              alt="Фото комнаты"
              className="w-full h-full object-contain"
            />

            {/* Bbox-overlay */}
            {result?.objects.map((obj, i) => {
              const [x, y, w, h] = obj.bbox;
              const color = BBOX_COLORS[obj.type] || "#64748b";
              const isExcluded = excluded.has(i);
              const isHover = hoverIdx === i;
              return (
                <div
                  key={i}
                  onClick={() => toggleExclude(i)}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                  className="absolute border-2 rounded transition-all cursor-pointer"
                  style={{
                    left: `${x * 100}%`,
                    top: `${y * 100}%`,
                    width: `${w * 100}%`,
                    height: `${h * 100}%`,
                    borderColor: isExcluded ? "#94a3b8" : color,
                    backgroundColor: isHover
                      ? `${color}30`
                      : isExcluded
                        ? "rgba(148, 163, 184, 0.15)"
                        : "transparent",
                    opacity: isExcluded ? 0.4 : 1,
                  }}
                  title={isExcluded ? "Кликните чтобы вернуть" : "Кликните чтобы исключить"}
                >
                  <span
                    className="absolute -top-5 left-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white whitespace-nowrap"
                    style={{ backgroundColor: color }}
                  >
                    {obj.label}
                    <span className="ml-1 opacity-70">{Math.round(obj.confidence * 100)}%</span>
                  </span>
                </div>
              );
            })}

            {analyzing && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                <Icon name="ScanSearch" size={28} className="text-primary animate-pulse" />
                <p className="text-sm font-bold text-foreground">Распознаю объекты…</p>
                <p className="text-xs text-muted-foreground">Обычно 5-10 секунд</p>
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />

          {/* Топ-инфо после анализа */}
          {result && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <InfoStat
                label="Объектов"
                value={String(result.objects.length - excluded.size)}
                hint={excluded.size > 0 ? `(${excluded.size} исключено)` : ""}
              />
              <InfoStat
                label="Тип комнаты"
                value={ROOM_TYPE_LABELS[result.room_type] ?? result.room_type}
              />
              <InfoStat
                label="Стиль"
                value={STYLE_LABELS[result.dominant_style] ?? result.dominant_style}
              />
              <InfoStat
                label="Время"
                value={
                  result.latency_ms
                    ? `${(result.latency_ms / 1000).toFixed(1)} с`
                    : "—"
                }
              />
            </div>
          )}

          {/* Список объектов */}
          {result && result.objects.length > 0 && (
            <div className="card-base p-3 max-h-60 overflow-y-auto">
              <p className="t-meta mb-2">Найденные объекты · клик чтобы исключить</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                {result.objects.map((obj, i) => {
                  const isOff = excluded.has(i);
                  const color = BBOX_COLORS[obj.type] || "#64748b";
                  return (
                    <button
                      key={i}
                      onClick={() => toggleExclude(i)}
                      onMouseEnter={() => setHoverIdx(i)}
                      onMouseLeave={() => setHoverIdx(null)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                        isOff
                          ? "bg-secondary/30 text-muted-foreground line-through"
                          : "bg-secondary text-foreground hover:bg-secondary/70"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <Icon name={obj.icon} size={12} className="shrink-0" />
                      <span className="flex-1 truncate font-bold">{obj.label}</span>
                      <span className="text-[10px] font-mono opacity-70">
                        {Math.round(obj.confidence * 100)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Кнопки управления */}
          <div className="flex flex-wrap items-center gap-2">
            {!result ? (
              <button
                onClick={analyze}
                disabled={analyzing}
                className="flex-1 min-w-[200px] bg-primary text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 shadow-lg shadow-primary/20"
              >
                <Icon
                  name={analyzing ? "Loader2" : "ScanSearch"}
                  size={16}
                  className={analyzing ? "animate-spin" : ""}
                />
                {analyzing ? "Анализирую…" : "Распознать объекты"}
              </button>
            ) : (
              <>
                <button
                  onClick={importToPlanner}
                  className="flex-1 min-w-[200px] bg-primary text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  <Icon name="LayoutGrid" size={16} />
                  Импорт в Планировщик
                  <span className="text-[10px] font-mono opacity-80">
                    {result.objects.length - excluded.size} шт
                  </span>
                </button>
                <button
                  onClick={analyze}
                  className="px-4 py-3 rounded-xl bg-secondary text-foreground font-bold text-sm hover:bg-secondary/70 transition-colors"
                >
                  <Icon name="RotateCcw" size={13} className="inline mr-1" />
                  Переанализировать
                </button>
              </>
            )}
            <button
              onClick={() => {
                setImagePreview(null);
                setImageBase64(null);
                setResult(null);
                setExcluded(new Set());
              }}
              className="px-3 py-3 rounded-xl text-muted-foreground hover:text-destructive text-sm font-bold flex items-center gap-1.5"
            >
              <Icon name="X" size={13} />
              Сбросить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card-base p-2.5">
      <p className="t-meta">{label}</p>
      <p className="text-sm font-black text-foreground mt-0.5 truncate">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}
