import { useState } from "react";
import Icon from "@/components/ui/icon";
import { FURNITURE_CATALOG, type CatalogItem, type FurnitureCategory } from "@/lib/floorPlan";

interface Props {
  selected: CatalogItem | null;
  onSelect: (item: CatalogItem | null) => void;
}

const CATEGORIES: { id: FurnitureCategory | "all"; label: string; icon: string }[] = [
  { id: "all",       label: "Всё",      icon: "Grid3x3" },
  { id: "sofa",      label: "Гостиная", icon: "Sofa" },
  { id: "bed",       label: "Спальня",  icon: "BedDouble" },
  { id: "table",     label: "Столы",    icon: "Square" },
  { id: "chair",     label: "Стулья",   icon: "Armchair" },
  { id: "kitchen",   label: "Кухня",    icon: "ChefHat" },
  { id: "bath",      label: "Ванная",   icon: "Bath" },
  { id: "storage",   label: "Хранение", icon: "Archive" },
  { id: "appliance", label: "Техника",  icon: "Refrigerator" },
  { id: "decor",     label: "Декор",    icon: "Leaf" },
];

/**
 * Каталог мебели с фильтром по категориям.
 * Клик по предмету — выбираем для размещения, повторный клик — снимаем выбор.
 */
export default function FurnitureCatalog({ selected, onSelect }: Props) {
  const [cat, setCat] = useState<FurnitureCategory | "all">("all");
  const items = cat === "all" ? FURNITURE_CATALOG : FURNITURE_CATALOG.filter((i) => i.category === cat);

  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Каталог мебели
        </p>
        <span className="text-[10px] font-mono text-muted-foreground">
          {items.length} шт
        </span>
      </div>

      {/* Категории */}
      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-colors ${
              cat === c.id
                ? "bg-primary text-primary-foreground"
                : "text-foreground bg-secondary hover:bg-secondary/70"
            }`}
          >
            <Icon name={c.icon} size={11} />
            {c.label}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="grid grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
        {items.map((item) => {
          const isActive = selected?.type === item.type;
          return (
            <button
              key={item.type}
              onClick={() => onSelect(isActive ? null : item)}
              className={`text-left bg-secondary hover:bg-secondary/70 rounded-lg p-2 transition-all border-2 ${
                isActive ? "border-primary scale-[0.98]" : "border-transparent"
              }`}
              title={`${item.type} · ${item.w}×${item.h} см`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="w-7 h-7 rounded flex items-center justify-center"
                  style={{ background: item.color || "#cbd5e1" }}
                >
                  <Icon name={item.icon} size={14} className="text-foreground" />
                </div>
                {isActive && (
                  <Icon name="Check" size={12} className="text-primary ml-auto" />
                )}
              </div>
              <p className="text-[11px] font-bold text-foreground leading-tight truncate">
                {item.type}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">
                {item.w}×{item.h}
              </p>
            </button>
          );
        })}
      </div>

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
