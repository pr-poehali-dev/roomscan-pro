import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { formatRubShort } from "@/lib/staging";

const API_URL = "https://functions.poehali.dev/1eba511f-2195-46e9-b37a-a15e0a816b9d";

interface AIRecommendation {
  title: string;
  desc: string;
  category: "clean" | "repair" | "decor" | "photo";
  priority: "must" | "should" | "nice";
  cost: number;
  impact: number;
  icon: string;
}

interface AIIssue {
  title: string;
  severity: "high" | "medium" | "low";
}

interface AIAnalysis {
  summary: string;
  rating: number;
  expected_uplift_pct: number;
  budget_min: number;
  budget_max: number;
  issues: AIIssue[];
  recommendations: AIRecommendation[];
}

const PRIORITY_LABELS: Record<AIRecommendation["priority"], string> = {
  must: "Обязательно",
  should: "Желательно",
  nice: "По желанию",
};

const PRIORITY_COLORS: Record<AIRecommendation["priority"], string> = {
  must: "bg-red-500/10 text-red-500 border-red-500/30",
  should: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  nice: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
};

const SEVERITY_COLORS: Record<AIIssue["severity"], string> = {
  high: "bg-red-500/10 text-red-500",
  medium: "bg-amber-500/10 text-amber-500",
  low: "bg-emerald-500/10 text-emerald-500",
};

/**
 * AI-анализ фото квартиры. Загружаешь фото — ИИ выдаёт чек-лист улучшений.
 * Использует Polza.ai Vision API через бэкенд.
 */
export default function PhotoAnalyzer() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AIAnalysis | null>(null);

  const onPick = (file: File) => {
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      analyze(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async (dataUrl: string) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось проанализировать фото");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreview("");
    setResult(null);
    setError("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="bg-gradient-to-r from-primary to-emerald-500 text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
          AI
        </span>
        <p className="font-black text-foreground uppercase tracking-wide text-sm">
          Анализ фото квартиры
        </p>
      </div>

      {!preview ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full bg-gradient-to-br from-primary/10 to-emerald-500/5 hover:from-primary/15 hover:to-emerald-500/10 border-2 border-dashed border-primary/40 hover:border-primary rounded-2xl p-8 text-center transition-all group"
        >
          <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Icon name="ImagePlus" size={26} className="text-primary" />
          </div>
          <p className="font-bold text-foreground text-base">Загрузите фото комнаты</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            ИИ проанализирует освещение, цвета, мебель, состояние стен — и выдаст
            персональный чек-лист улучшений с прогнозом роста цены продажи
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPick(f);
            }}
          />
        </button>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative bg-card border border-border rounded-2xl overflow-hidden">
            <img src={preview} alt="Анализ" className="w-full h-auto block" />
            <button
              onClick={reset}
              className="absolute top-2 right-2 bg-card/90 backdrop-blur border border-border rounded-lg p-1.5 hover:bg-secondary transition-colors"
            >
              <Icon name="X" size={14} />
            </button>
            {loading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                <Icon name="Loader2" size={28} className="text-primary animate-spin" />
                <p className="text-sm font-bold text-foreground">ИИ анализирует фото…</p>
                <p className="text-xs text-muted-foreground">обычно 5–15 секунд</p>
              </div>
            )}
          </div>

          {result && (
            <div className="bg-gradient-to-br from-primary/15 to-emerald-500/5 border-2 border-primary/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-full bg-card flex items-center justify-center border-2 border-primary">
                  <span className="text-xl font-black text-primary font-mono">
                    {result.rating}
                  </span>
                  <span className="absolute -bottom-1 text-[8px] font-mono text-muted-foreground">/10</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Оценка квартиры
                  </p>
                  <p className="text-sm font-bold text-foreground leading-tight">
                    {result.summary}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-primary/20">
                <div className="bg-card/60 rounded-lg p-2.5">
                  <p className="text-[10px] font-mono uppercase text-muted-foreground">Бюджет</p>
                  <p className="font-bold text-foreground text-sm mt-0.5">
                    {formatRubShort(result.budget_min)} – {formatRubShort(result.budget_max)}
                  </p>
                </div>
                <div className="bg-card/60 rounded-lg p-2.5">
                  <p className="text-[10px] font-mono uppercase text-muted-foreground">Прирост цены</p>
                  <p className="font-bold text-emerald-500 text-sm mt-0.5">
                    +{result.expected_uplift_pct}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <>
          {result.issues.length > 0 && (
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Что увидел ИИ
              </p>
              <div className="flex flex-wrap gap-2">
                {result.issues.map((iss, i) => (
                  <span
                    key={i}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full ${SEVERITY_COLORS[iss.severity]}`}
                  >
                    {iss.severity === "high" ? "⚠ " : iss.severity === "medium" ? "● " : "○ "}
                    {iss.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Персональные рекомендации
            </p>
            <div className="space-y-2">
              {result.recommendations.map((r, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl p-3 flex items-start gap-3 hover:border-primary/40 transition-colors"
                >
                  <Icon name={r.icon} size={20} className="text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="font-bold text-foreground text-sm">{r.title}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[r.priority]}`}>
                        {PRIORITY_LABELS[r.priority]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono">
                      <span className="text-muted-foreground">
                        <Icon name="Wallet" size={10} className="inline mr-1" />
                        {r.cost === 0 ? "бесплатно" : formatRubShort(r.cost)}
                      </span>
                      <span className="text-emerald-500">
                        <Icon name="TrendingUp" size={10} className="inline mr-1" />
                        +{r.impact}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
