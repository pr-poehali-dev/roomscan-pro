import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";

const AI_STYLING_URL = "https://functions.poehali.dev/3b4e476d-dbf9-45f6-8d30-2238ad4a3030";

interface StyleOption {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

const STYLES: StyleOption[] = [
  { id: "scandi",     label: "Скандинавский",  emoji: "🌿", description: "Светлое дерево, белые стены, пастель" },
  { id: "loft",       label: "Лофт",            emoji: "🧱", description: "Кирпич, бетон, металл, эдисон" },
  { id: "classic",    label: "Классика",        emoji: "🏛️", description: "Лепнина, мрамор, хрусталь, бархат" },
  { id: "minimal",    label: "Минимализм",      emoji: "⬜", description: "Чистые линии, моно-палитра" },
  { id: "modern",     label: "Модерн",          emoji: "✨", description: "Геометрия, акценты, бренд-арт" },
  { id: "japandi",    label: "Японди",          emoji: "🍵", description: "Японский минимализм + сканди" },
  { id: "glamour",    label: "Гламур",          emoji: "💎", description: "Ар-деко, латунь, зеркала" },
  { id: "midcentury", label: "Mid-century",     emoji: "🪑", description: "Орех, горчичный, 60-е" },
];

interface GenerationResult {
  style: string;
  resultUrl: string;
  latencyMs: number;
}

/**
 * Генератор AI-стилизации интерьера.
 * Пользователь загружает фото комнаты, выбирает стиль — на бэкенде Replicate API
 * возвращает изображение его комнаты в выбранном стиле.
 */
export default function AIStyleGenerator() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("scandi");
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [activeResult, setActiveResult] = useState<GenerationResult | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Это не изображение");
      return;
    }
    if (file.size > 5_000_000) {
      toast.error("Файл слишком большой", { description: "Максимум 5 МБ" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl);
      setResults([]);
      setActiveResult(null);
    };
    reader.readAsDataURL(file);
  }

  async function generate() {
    if (!imageBase64) {
      toast.error("Сначала загрузите фото комнаты");
      return;
    }
    setGenerating(true);
    try {
      const response = await fetch(AI_STYLING_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: imageBase64,
          style: selectedStyle,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 503) {
          toast.error("AI временно недоступен", {
            description: "Администратор не настроил API-ключ. Попробуйте позже.",
          });
        } else {
          toast.error("Не удалось сгенерировать", {
            description: data.detail || data.error || "Ошибка сервера",
          });
        }
        return;
      }
      const result: GenerationResult = {
        style: data.style,
        resultUrl: data.result_url,
        latencyMs: data.latency_ms ?? 0,
      };
      setResults((prev) => [
        result,
        ...prev.filter((r) => r.style !== result.style),
      ].slice(0, 4));
      setActiveResult(result);
      toast.success(`Готово за ${(result.latencyMs / 1000).toFixed(1)} с`, {
        description: `Стиль: ${STYLES.find((s) => s.id === result.style)?.label ?? result.style}`,
      });
    } catch (e) {
      toast.error("Сетевая ошибка", {
        description: e instanceof Error ? e.message : "Попробуйте ещё раз",
      });
    } finally {
      setGenerating(false);
    }
  }

  function downloadResult() {
    if (!activeResult) return;
    const a = document.createElement("a");
    a.href = activeResult.resultUrl;
    a.download = `ai-style-${activeResult.style}-${Date.now()}.jpg`;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="card-base p-5 lg:p-6 space-y-5">
      <div>
        <p className="t-meta text-primary mb-1.5">Stable Diffusion · Live</p>
        <h3 className="h-block text-foreground">AI-стилизация вашей комнаты</h3>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
          Загрузите фото комнаты — получите её в 8 разных стилях через FLUX-нейросеть.
          Реальная нейронка, не подбор похожих интерьеров.
        </p>
      </div>

      {/* ─── Шаг 1: Загрузка ─── */}
      {!imagePreview ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Icon name="ImagePlus" size={26} className="text-primary" />
          </div>
          <p className="font-bold text-foreground mb-1">Загрузите фото комнаты</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            JPG / PNG до 5 МБ. Снимайте при дневном свете, желательно фронтально к стене.
          </p>
        </button>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Оригинал */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="t-meta">Оригинал</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-primary hover:underline"
              >
                Заменить
              </button>
            </div>
            <div className="aspect-square rounded-xl overflow-hidden bg-secondary">
              <img
                src={imagePreview}
                alt="Оригинал комнаты"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Результат */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="t-meta">
                {activeResult
                  ? `${STYLES.find((s) => s.id === activeResult.style)?.emoji} ${STYLES.find((s) => s.id === activeResult.style)?.label}`
                  : "Результат AI"}
              </p>
              {activeResult && (
                <button
                  onClick={downloadResult}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Icon name="Download" size={11} />
                  Скачать
                </button>
              )}
            </div>
            <div className="aspect-square rounded-xl overflow-hidden bg-secondary relative">
              {generating ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Icon name="Sparkles" size={28} className="text-primary animate-pulse" />
                  <p className="text-sm font-bold">Нейросеть генерирует…</p>
                  <p className="text-xs">Обычно 5-15 секунд</p>
                </div>
              ) : activeResult ? (
                <img
                  src={activeResult.resultUrl}
                  alt={`Стиль ${activeResult.style}`}
                  className="w-full h-full object-cover animate-fade-in"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground p-6 text-center">
                  <Icon name="Wand2" size={28} className="opacity-40" />
                  <p className="text-xs">Выберите стиль и нажмите «Сгенерировать»</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      {/* ─── Шаг 2: Выбор стиля ─── */}
      {imagePreview && (
        <>
          <div>
            <p className="t-meta mb-2">Выберите стиль</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STYLES.map((s) => {
                const isActive = selectedStyle === s.id;
                const isGenerated = results.some((r) => r.style === s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedStyle(s.id);
                      const cached = results.find((r) => r.style === s.id);
                      if (cached) setActiveResult(cached);
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition-all relative ${
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-foreground/30"
                    }`}
                  >
                    {isGenerated && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Icon name="Check" size={11} className="text-primary-foreground" />
                      </span>
                    )}
                    <div className="text-2xl mb-1.5">{s.emoji}</div>
                    <p className="text-xs font-bold text-foreground">{s.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">
                      {s.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Кнопка генерации */}
          <button
            onClick={generate}
            disabled={generating || !imageBase64}
            className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-wait shadow-lg shadow-primary/20"
          >
            <Icon
              name={generating ? "Loader2" : "Wand2"}
              size={16}
              className={generating ? "animate-spin" : ""}
            />
            {generating
              ? "Генерация…"
              : `Сгенерировать «${STYLES.find((s) => s.id === selectedStyle)?.label}»`}
          </button>

          {/* Превью всех ранее сгенерированных */}
          {results.length > 0 && (
            <div>
              <p className="t-meta mb-2">История генераций</p>
              <div className="grid grid-cols-4 gap-2">
                {results.map((r) => {
                  const style = STYLES.find((s) => s.id === r.style);
                  const isActive = activeResult?.resultUrl === r.resultUrl;
                  return (
                    <button
                      key={r.resultUrl}
                      onClick={() => {
                        setActiveResult(r);
                        setSelectedStyle(r.style);
                      }}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        isActive ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-foreground/40"
                      }`}
                    >
                      <img
                        src={r.resultUrl}
                        alt={style?.label ?? r.style}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] font-bold py-0.5 text-center">
                        {style?.emoji} {style?.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
