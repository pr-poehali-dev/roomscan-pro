import { useState, useMemo } from "react";
import Icon from "@/components/ui/icon";
import {
  HOUSE_PROJECTS,
  ConstructionType,
  CONSTRUCTION_LABELS,
  CONSTRUCTION_ICONS,
} from "@/lib/modular-houses";
import { formatRub } from "@/lib/engineering";

interface Props {
  projectIdx: number;
  setProjectIdx: (i: number) => void;
  setSelectedModuleIndex: (i: number | null) => void;
  setLoadedId: (id: number | null) => void;
}

type Filter = "all" | ConstructionType;

const FILTERS: Filter[] = ["all", "modular", "futuristic", "frame"];

const FILTER_LABELS: Record<Filter, string> = {
  all: "Все",
  modular: CONSTRUCTION_LABELS.modular,
  frame: CONSTRUCTION_LABELS.frame,
  futuristic: CONSTRUCTION_LABELS.futuristic,
};

const FILTER_ICONS: Record<Filter, string> = {
  all: "LayoutGrid",
  modular: CONSTRUCTION_ICONS.modular,
  frame: CONSTRUCTION_ICONS.frame,
  futuristic: CONSTRUCTION_ICONS.futuristic,
};

/**
 * Сетка карточек с фото-превью и фильтром по типу конструкции.
 */
export default function HousesCatalogGrid({
  projectIdx,
  setProjectIdx,
  setSelectedModuleIndex,
  setLoadedId,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const filteredProjects = useMemo(() => {
    if (filter === "all") return HOUSE_PROJECTS.map((p, i) => ({ p, i }));
    return HOUSE_PROJECTS.map((p, i) => ({ p, i })).filter(
      ({ p }) => p.construction === filter,
    );
  }, [filter]);

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="t-meta mr-1">Тип:</span>
        {FILTERS.map((f) => {
          const count =
            f === "all"
              ? HOUSE_PROJECTS.length
              : HOUSE_PROJECTS.filter((p) => p.construction === f).length;
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`chip ${active ? "chip-active" : "chip-idle"}`}
              aria-pressed={active}
            >
              <Icon name={FILTER_ICONS[f]} size={12} />
              {FILTER_LABELS[f]}
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full t-num ${
                  active ? "bg-background/20 text-background" : "bg-background text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProjects.map(({ p, i }) => (
          <button
            key={p.id}
            onClick={() => {
              setProjectIdx(i);
              setSelectedModuleIndex(null);
              setLoadedId(null);
            }}
            aria-pressed={i === projectIdx}
            className={`group text-left card-base overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              i === projectIdx
                ? "card-active shadow-lg shadow-primary/15"
                : "card-hover"
            }`}
          >
            <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
              {p.previewImage ? (
                <img
                  src={p.previewImage}
                  alt={p.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon name={p.icon} size={48} className="text-muted-foreground/40" />
                </div>
              )}

              <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-[9px] font-mono uppercase tracking-wider flex items-center gap-1">
                <Icon name={CONSTRUCTION_ICONS[p.construction]} size={10} />
                {CONSTRUCTION_LABELS[p.construction]}
              </div>

              {p.variants && p.variants.length > 1 && (
                <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-primary text-primary-foreground text-[9px] font-mono uppercase tracking-wider flex items-center gap-1">
                  <Icon name="Layers" size={10} />
                  {p.variants.length} планировки
                </div>
              )}

              {i === projectIdx && (
                <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                  <Icon name="Check" size={15} />
                </div>
              )}
            </div>

            <div className="p-4">
              <p className="t-meta mb-1.5">
                <span className="t-num">{p.area}</span> м² · <span className="t-num">{p.bedrooms || 0}</span> спален · <span className="t-num">{p.daysToBuild}</span> дней
              </p>
              <p className="h-card mb-1">{p.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                {p.tagline}
              </p>
              <p className="text-sm font-bold text-primary t-num">
                от {formatRub(p.basePrice)}
              </p>
            </div>
          </button>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Нет проектов в этой категории.
        </div>
      )}
    </div>
  );
}