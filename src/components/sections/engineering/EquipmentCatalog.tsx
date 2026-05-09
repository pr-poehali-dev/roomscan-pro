import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  EQUIPMENT,
  EquipmentItem,
  EquipmentCategory,
  CATEGORY_LABELS,
  formatRub,
} from "@/lib/engineering";

interface Props {
  /** Колбэк добавления оборудования в композицию */
  onAdd?: (item: EquipmentItem) => void;
  /** Поддержка drag-and-drop в рабочую область */
  onDragStart?: (item: EquipmentItem, e: React.DragEvent) => void;
  /** Включает компактный режим (для боковой панели конструктора) */
  compact?: boolean;
}

const CATEGORY_ICONS: Record<EquipmentCategory, string> = {
  boiler: "Flame",
  pump: "Activity",
  expansion_tank: "Disc",
  boiler_tank: "Cylinder",
  manifold: "GitBranch",
  valve: "Gauge",
  filter: "Filter",
  safety_group: "ShieldCheck",
  controller: "Cpu",
  chimney: "Wind",
  pipe: "Slash",
  gas_tank: "Fuel",
  gas_cylinder: "Cylinder",
  gas_regulator: "Settings2",
  gas_meter: "Activity",
  gas_detector: "AlertTriangle",
  evaporator: "Thermometer",
  service: "Wrench",
};

/**
 * Каталог инженерного оборудования с фильтрами, поиском, фото и drag-and-drop.
 * Эталонная подача: фотореалистичные карточки, бренды, цены, теги.
 */
export default function EquipmentCatalog({ onAdd, onDragStart, compact }: Props) {
  const [activeCategory, setActiveCategory] = useState<EquipmentCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [activeItem, setActiveItem] = useState<EquipmentItem | null>(null);

  const categoriesInUse = useMemo(() => {
    const set = new Set<EquipmentCategory>();
    for (const e of EQUIPMENT) set.add(e.category);
    return Array.from(set);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return EQUIPMENT.filter((item) => {
      if (activeCategory !== "all" && item.category !== activeCategory) return false;
      if (!q) return true;
      const hay = [
        item.name,
        item.brand ?? "",
        item.specs,
        item.description,
        ...(item.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [activeCategory, search]);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
      {/* Header с поиском */}
      <div className="px-3 py-2.5 bg-secondary/40 border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <Icon name="Package" size={14} className="text-primary" />
          <p className="text-xs font-bold uppercase tracking-wider">Каталог оборудования</p>
          <span className="text-[10px] font-mono text-muted-foreground ml-auto">
            {filtered.length} из {EQUIPMENT.length}
          </span>
        </div>
        <div className="relative">
          <Icon
            name="Search"
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Найти: модель, бренд, параметр..."
            className="w-full pl-7 pr-2 py-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Фильтр по категориям */}
      <div className="flex overflow-x-auto gap-1 p-2 border-b border-border bg-background">
        <CategoryChip
          label="Все"
          icon="LayoutGrid"
          active={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
        />
        {categoriesInUse.map((cat) => (
          <CategoryChip
            key={cat}
            label={CATEGORY_LABELS[cat]}
            icon={CATEGORY_ICONS[cat]}
            active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
          />
        ))}
      </div>

      {/* Список карточек */}
      <div
        className={`grid gap-2 p-2 overflow-y-auto ${
          compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
        }`}
        style={{ maxHeight: compact ? 540 : 720 }}
      >
        {filtered.map((item) => (
          <EquipmentCard
            key={item.id}
            item={item}
            compact={compact}
            onAdd={onAdd}
            onDragStart={onDragStart}
            onOpen={() => setActiveItem(item)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Icon name="SearchX" size={24} className="mb-2" />
            <p className="text-xs">Ничего не найдено</p>
          </div>
        )}
      </div>

      {/* Модалка с подробностями */}
      {activeItem && (
        <EquipmentDetailModal
          item={activeItem}
          onClose={() => setActiveItem(null)}
          onAdd={
            onAdd
              ? () => {
                  onAdd(activeItem);
                  setActiveItem(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

/* ────────────── ЧИП КАТЕГОРИИ ────────────── */

function CategoryChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-all border ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
      }`}
    >
      <Icon name={icon} size={11} />
      {label}
    </button>
  );
}

/* ────────────── КАРТОЧКА ────────────── */

function EquipmentCard({
  item,
  compact,
  onAdd,
  onDragStart,
  onOpen,
}: {
  item: EquipmentItem;
  compact?: boolean;
  onAdd?: (item: EquipmentItem) => void;
  onDragStart?: (item: EquipmentItem, e: React.DragEvent) => void;
  onOpen: () => void;
}) {
  return (
    <div
      draggable={!!onDragStart}
      onDragStart={(e) => {
        if (onDragStart) {
          e.dataTransfer.effectAllowed = "copy";
          e.dataTransfer.setData("text/plain", item.id);
          onDragStart(item, e);
        }
      }}
      className={`group relative bg-background border border-border rounded-lg overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all ${
        onDragStart ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      {/* Фото оборудования */}
      <div
        onClick={onOpen}
        className="relative aspect-square bg-gradient-to-br from-secondary/40 to-secondary/10 cursor-pointer overflow-hidden"
        style={{
          background: item.image
            ? undefined
            : `linear-gradient(135deg, ${item.color}22, ${item.color}08)`,
        }}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ color: item.color }}
          >
            <Icon name={CATEGORY_ICONS[item.category]} size={48} />
          </div>
        )}

        {/* Бейдж бренда */}
        {item.brand && (
          <div className="absolute top-1.5 left-1.5 bg-card/90 backdrop-blur-sm border border-border px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
            {item.brand}
          </div>
        )}

        {/* Бейдж категории */}
        <div className="absolute top-1.5 right-1.5 bg-primary/90 text-primary-foreground px-1.5 py-0.5 rounded text-[9px] font-mono">
          {CATEGORY_LABELS[item.category]}
        </div>

        {/* Drag-индикатор */}
        {onDragStart && (
          <div className="absolute bottom-1.5 right-1.5 bg-card/90 backdrop-blur-sm border border-border w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Icon name="Move" size={12} className="text-primary" />
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="p-2.5 space-y-1.5">
        <p className="text-xs font-bold leading-tight line-clamp-2" title={item.name}>
          {item.name}
        </p>
        <p className="text-[10px] font-mono text-muted-foreground line-clamp-1" title={item.specs}>
          {item.specs}
        </p>

        {!compact && item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {item.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-end justify-between pt-1">
          <p className="text-sm font-bold font-mono text-primary">{formatRub(item.price)}</p>
          {onAdd && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd(item);
              }}
              className="bg-primary text-primary-foreground px-2 py-1 rounded text-[10px] font-bold hover:bg-primary/90 transition-colors flex items-center gap-1"
            >
              <Icon name="Plus" size={10} />
              Добавить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────── МОДАЛКА ────────────── */

function EquipmentDetailModal({
  item,
  onClose,
  onAdd,
}: {
  item: EquipmentItem;
  onClose: () => void;
  onAdd?: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid sm:grid-cols-2 gap-0">
          <div
            className="aspect-square bg-gradient-to-br from-secondary/40 to-secondary/10 relative"
            style={{
              background: item.image
                ? undefined
                : `linear-gradient(135deg, ${item.color}33, ${item.color}11)`,
            }}
          >
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ color: item.color }}>
                <Icon name={CATEGORY_ICONS[item.category]} size={96} />
              </div>
            )}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 sm:hidden w-8 h-8 rounded-full bg-card/90 border border-border flex items-center justify-center"
            >
              <Icon name="X" size={16} />
            </button>
          </div>

          <div className="p-5 relative">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-secondary hover:bg-secondary/70 flex items-center justify-center hidden sm:flex"
            >
              <Icon name="X" size={14} />
            </button>

            {item.brand && (
              <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-1">
                {item.brand}
              </p>
            )}
            <h3 className="text-base font-bold mb-2 leading-tight pr-8">{item.name}</h3>
            <p className="text-xs font-mono text-muted-foreground mb-3">{item.specs}</p>

            <p className="text-xs leading-relaxed text-foreground mb-3">{item.description}</p>

            <div className="grid grid-cols-2 gap-2 mb-3 text-[11px]">
              <SpecRow label="Категория" value={CATEGORY_LABELS[item.category]} />
              <SpecRow
                label="Габариты"
                value={`${item.size[0]}×${item.size[1]}×${item.size[2]} м`}
              />
              {item.power && (
                <SpecRow label="Мощность" value={`${item.power} ${item.powerUnit ?? ""}`} />
              )}
              {item.forArea && (
                <SpecRow label="Для площади" value={`${item.forArea[0]}-${item.forArea[1]} м²`} />
              )}
              {item.sku && <SpecRow label="Артикул" value={item.sku} />}
              <SpecRow label="Ед. изм." value={item.unit} />
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {item.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-end justify-between gap-3 pt-2 border-t border-border">
              <div>
                <p className="text-[10px] font-mono uppercase text-muted-foreground">Цена</p>
                <p className="text-xl font-bold font-mono text-primary">{formatRub(item.price)}</p>
              </div>
              {onAdd && (
                <button
                  onClick={onAdd}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                >
                  <Icon name="Plus" size={13} />
                  В компоновку
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/40 rounded p-1.5">
      <p className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider">{label}</p>
      <p className="font-medium truncate">{value}</p>
    </div>
  );
}
