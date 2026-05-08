import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { type CatalogItem, type FurnitureCategory } from "@/lib/floorPlan";
import {
  FURNITURE_LIBRARY,
  CATEGORY_META,
  searchFurniture,
  toCatalogItem,
  formatPriceRub,
  type RichCatalogItem,
} from "@/lib/furniture-library";

interface Props {
  selected: CatalogItem | null;
  onSelect: (item: CatalogItem | null) => void;
}

const CATEGORY_ORDER: (FurnitureCategory | "all")[] = [
  "all",
  "sofa",
  "bed",
  "table",
  "chair",
  "kitchen",
  "bath",
  "storage",
  "appliance",
  "decor",
];

/**
 * Каталог интерьерной библиотеки.
 * - AI-сгенерированные превью каждого объекта (3D-изометрия на белом фоне)
 * - Поиск по названию, описанию, тегам
 * - Фильтр по категориям
 * - Брендовая полка партнёра «Шкафулькин» (шкафы, гардеробные, прихожие)
 * - Hover-карточка с описанием и ценой
 *
 * Клик по предмету — выбираем для размещения, повторный клик — снимаем выбор.
 */
export default function FurnitureCatalog({ selected, onSelect }: Props) {
  const [cat, setCat] = useState<FurnitureCategory | "all">("all");
  const [q, setQ] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list: RichCatalogItem[] = FURNITURE_LIBRARY;
    if (cat !== "all") list = list.filter((i) => i.category === cat);
    if (q.trim()) list = searchFurniture(list, q);
    return list;
  }, [cat, q]);

  const partnerCount = useMemo(
    () => FURNITURE_LIBRARY.filter((i) => i.partnerSlug === "shkafulkin").length,
    [],
  );

  const handlePick = (item: RichCatalogItem) => {
    const ci = toCatalogItem(item);
    const isActive = selected?.type === item.type;
    onSelect(isActive ? null : ci);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-3">
      {/* Заголовок */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Библиотека интерьера
          </p>
          <span className="text-[10px] font-mono text-muted-foreground">
            {filtered.length} / {FURNITURE_LIBRARY.length}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-tight">
          AI-каталог реалистичных объектов · партнёр{" "}
          <a
            href="https://shkafulkin.ru/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-bold hover:underline"
          >
            Шкафулькин
          </a>
        </p>
      </div>

      {/* Поиск */}
      <div className="relative">
        <Icon
          name="Search"
          size={12}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Найти: диван, шкаф, ванна…"
          className="w-full bg-secondary border border-border rounded-lg pl-7 pr-7 py-1.5 text-xs focus:outline-none focus:border-primary"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Очистить"
          >
            <Icon name="X" size={11} />
          </button>
        )}
      </div>

      {/* Категории */}
      <div className="flex flex-wrap gap-1">
        {CATEGORY_ORDER.map((id) => {
          const meta = CATEGORY_META[id];
          const isActive = cat === id;
          const showPartnerBadge = id === "storage" && partnerCount > 0;
          return (
            <button
              key={id}
              onClick={() => setCat(id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground bg-secondary hover:bg-secondary/70"
              }`}
              title={meta.description}
            >
              <Icon name={meta.icon} size={11} />
              {meta.label}
              {showPartnerBadge && (
                <span
                  className={`ml-0.5 text-[8px] font-black px-1 rounded ${
                    isActive ? "bg-primary-foreground/20" : "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                  }`}
                  title="Шкафулькин"
                >
                  Ш
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Брендовая полка Шкафулькин (только когда выбрано «Хранение» или «Всё») */}
      {(cat === "all" || cat === "storage") && !q && (
        <ShkafulkinShelf onPick={handlePick} selected={selected} />
      )}

      {/* Items grid */}
      <div className="grid grid-cols-2 gap-2 max-h-[460px] overflow-y-auto pr-1">
        {filtered.map((item) => {
          const isActive = selected?.type === item.type;
          const isHovered = hoveredId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handlePick(item)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`group relative text-left bg-secondary hover:bg-secondary/70 rounded-lg overflow-hidden transition-all border-2 ${
                isActive ? "border-primary scale-[0.98] shadow-lg shadow-primary/20" : "border-transparent"
              }`}
              title={`${item.type} · ${item.w}×${item.h} см`}
            >
              {/* Превью */}
              <div
                className="aspect-square bg-white relative overflow-hidden"
                style={{
                  backgroundImage: `url(${item.preview})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Бейджи поверх превью */}
                <div className="absolute top-1 left-1 flex gap-1">
                  {item.partnerSlug === "shkafulkin" && (
                    <span className="bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow">
                      ШКАФУЛЬКИН
                    </span>
                  )}
                </div>
                {isActive && (
                  <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                    <div className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg">
                      <Icon name="Check" size={14} />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-1 right-1 bg-card/90 backdrop-blur text-[9px] font-mono px-1 rounded text-foreground">
                  {item.w}×{item.h}
                </div>
              </div>

              {/* Метаданные */}
              <div className="p-1.5">
                <p className="text-[11px] font-bold text-foreground leading-tight line-clamp-1">
                  {item.type}
                </p>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <span className="text-[9px] text-muted-foreground font-mono">
                    {CATEGORY_META[item.category].label}
                  </span>
                  {item.price && (
                    <span className="text-[9px] font-bold text-primary">
                      {formatPriceRub(item.price)}
                    </span>
                  )}
                </div>
              </div>

              {/* Tooltip с описанием при hover */}
              {isHovered && item.description && (
                <div className="absolute z-20 left-0 right-0 -top-1 -translate-y-full bg-card border border-border rounded-lg p-2 shadow-xl pointer-events-none">
                  <p className="text-[10px] text-foreground leading-snug">
                    {item.description}
                  </p>
                </div>
              )}
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-6 text-muted-foreground">
            <Icon name="SearchX" size={20} className="mx-auto mb-1 opacity-40" />
            <p className="text-[11px]">Ничего не найдено</p>
            <button
              onClick={() => { setQ(""); setCat("all"); }}
              className="text-[10px] text-primary hover:underline mt-1"
            >
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>

      {/* Подсказка после выбора */}
      {selected && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-2 text-[11px] flex items-center gap-2">
          <Icon name="MousePointerClick" size={14} className="text-primary shrink-0" />
          <span className="text-foreground">
            Кликните в нужное место плана, чтобы поставить «{selected.type}»
          </span>
        </div>
      )}
    </div>
  );
}

/* ──────────────── Брендовая полка Шкафулькин ──────────────── */

function ShkafulkinShelf({
  onPick,
  selected,
}: {
  onPick: (item: RichCatalogItem) => void;
  selected: CatalogItem | null;
}) {
  const items = FURNITURE_LIBRARY.filter((i) => i.partnerSlug === "shkafulkin");
  if (items.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/30 rounded-lg p-2.5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-orange-500 flex items-center justify-center">
            <Icon name="Sparkles" size={10} className="text-white" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
            Шкафулькин
          </p>
        </div>
        <a
          href="https://shkafulkin.ru/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-0.5"
        >
          shkafulkin.ru <Icon name="ExternalLink" size={8} />
        </a>
      </div>
      <p className="text-[9px] text-muted-foreground mb-2 leading-snug">
        Шкафы и гардеробные на заказ по индивидуальным размерам. Производство в Москве, от 25 дней.
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {items.map((it) => {
          const isActive = selected?.type === it.type;
          return (
            <button
              key={it.id}
              onClick={() => onPick(it)}
              className={`relative bg-white rounded overflow-hidden aspect-square transition-all border-2 ${
                isActive
                  ? "border-orange-500 scale-[0.96]"
                  : "border-transparent hover:border-orange-300"
              }`}
              style={{
                backgroundImage: `url(${it.preview})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              title={`${it.type} · ${it.w}×${it.h} см`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-orange-500/40 flex items-center justify-center">
                  <Icon name="Check" size={14} className="text-white drop-shadow" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                <p className="text-[8px] font-bold text-white leading-none truncate">
                  {it.type}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
