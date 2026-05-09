import Icon from "@/components/ui/icon";
import {
  STYLE_LABELS,
  STYLE_ORDER,
  type Category,
  type StyleTag,
} from "@/lib/furnitureCatalog";

interface Props {
  styleFilter: StyleTag | "all";
  setStyleFilter: (v: StyleTag | "all") => void;
  styleCounts: Map<StyleTag, number>;

  categories: ("Все" | Category)[];
  filter: "Все" | Category;
  setFilter: (v: "Все" | Category) => void;
}

/**
 * Фильтр-табы по стилям интерьера + табы по категориям мебели.
 * Логика 1:1 перенесена из CatalogSection.tsx без изменений.
 */
export default function CatalogTabs({
  styleFilter,
  setStyleFilter,
  styleCounts,
  categories,
  filter,
  setFilter,
}: Props) {
  return (
    <>
      {/* Стили — фильтр-табы */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="Palette" size={14} className="text-muted-foreground" />
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Стиль интерьера
          </p>
          {styleFilter !== "all" && (
            <button
              onClick={() => setStyleFilter("all")}
              className="text-xs text-primary font-semibold hover:underline ml-auto"
            >
              Сбросить стиль
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap overflow-x-auto pb-1">
          <button
            onClick={() => setStyleFilter("all")}
            className={`text-xs px-4 py-2 rounded-lg border font-semibold transition-colors whitespace-nowrap ${
              styleFilter === "all"
                ? "bg-foreground text-background border-foreground"
                : "bg-card text-foreground border-border hover:border-primary/40"
            }`}
          >
            Все стили
          </button>
          {STYLE_ORDER.map((s) => {
            const active = styleFilter === s;
            const count = styleCounts.get(s) ?? 0;
            const styleColors: Record<StyleTag, string> = {
              scandi: "from-amber-50 to-stone-100 text-stone-800 border-stone-300",
              loft: "from-zinc-800 to-zinc-900 text-zinc-100 border-zinc-700",
              classic: "from-rose-50 to-amber-50 text-amber-900 border-amber-300",
              modern: "from-sky-50 to-slate-100 text-slate-800 border-slate-300",
              japandi: "from-stone-50 to-stone-100 text-stone-700 border-stone-300",
              glam: "from-fuchsia-100 to-amber-100 text-amber-800 border-amber-400",
              midcentury: "from-orange-100 to-amber-100 text-orange-900 border-orange-400",
            };
            return (
              <button
                key={s}
                onClick={() => setStyleFilter(s)}
                className={`text-xs px-4 py-2 rounded-lg border font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                  active
                    ? `bg-gradient-to-br ${styleColors[s]} shadow-sm scale-[1.02]`
                    : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
                title={`${STYLE_LABELS[s]} — ${count} позиций`}
              >
                <span>{STYLE_LABELS[s]}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  active ? "bg-black/10" : "bg-secondary"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Категории */}
      <div className="flex gap-2 flex-wrap mb-5 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
              filter === c
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </>
  );
}
