import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  FURNITURE_CATALOG,
  type FurnitureItem as CatalogFurniture,
} from "@/lib/furnitureCatalog";
import { loadFloorPlan } from "@/lib/floorPlanStorage";
import type { FurnitureItem as PlanFurniture } from "@/lib/floorPlanTypes";

interface Props {
  /** Сколько мебели стоит в текущей сцене */
  furnitureCount: number;
  /** Переход в раздел каталога (если родитель умеет навигировать) */
  onNavigateCatalog?: () => void;
}

/**
 * Баннер связи с каталогом: показывает топ-3 предмета в сцене (превью + название)
 * и кнопку «Добавить ещё из каталога».
 *
 * Сопоставляет PlanFurniture.type с FurnitureItem.name из каталога,
 * чтобы достать превью-картинку и красиво показать.
 */
export default function CatalogLinkBanner({ furnitureCount, onNavigateCatalog }: Props) {
  const [recent, setRecent] = useState<PlanFurniture[]>([]);

  const refresh = () => {
    const plan = loadFloorPlan();
    if (!plan) return setRecent([]);
    setRecent(plan.furniture.slice(-4).reverse());
  };

  useEffect(() => {
    refresh();
    window.addEventListener("roomscan:floorPlan:changed", refresh);
    return () => window.removeEventListener("roomscan:floorPlan:changed", refresh);
  }, []);

  // Привязка планировщика → каталога по имени
  const catalogByName = useMemo(() => {
    const m = new Map<string, CatalogFurniture>();
    FURNITURE_CATALOG.forEach((f) => m.set(f.name, f));
    return m;
  }, []);

  const handleNavigate = () => {
    if (onNavigateCatalog) {
      onNavigateCatalog();
    } else if (typeof window !== "undefined") {
      window.location.hash = "catalog";
    }
  };

  if (furnitureCount === 0) {
    return (
      <div className="bg-gradient-to-br from-primary/5 via-card to-card border border-primary/20 rounded-xl p-4 flex flex-wrap items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon name="Sofa" size={22} className="text-primary" />
        </div>
        <div className="flex-1 min-w-[220px]">
          <p className="font-bold text-foreground">В сцене пока нет мебели</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Откройте каталог — кнопка «3D» на любой карточке добавит предмет прямо сюда
          </p>
        </div>
        <button
          onClick={handleNavigate}
          className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Icon name="LayoutGrid" size={14} />
          Открыть каталог
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/5 via-card to-card border border-primary/20 rounded-xl p-4">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon name="Boxes" size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-[180px]">
          <p className="font-bold text-foreground text-sm">
            В сцене {furnitureCount}{" "}
            {furnitureCount === 1 ? "предмет" : furnitureCount < 5 ? "предмета" : "предметов"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Перетаскивайте мышью в 2D или открывайте 3D-вид справа
          </p>
        </div>
        <button
          onClick={handleNavigate}
          className="bg-card border border-primary/30 text-primary px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-primary/5 transition-colors"
        >
          <Icon name="Plus" size={12} />
          Добавить из каталога
        </button>
      </div>

      {/* Мини-превью последних добавленных */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {recent.map((f) => {
          const sku = catalogByName.get(f.type);
          return (
            <div
              key={f.id}
              className="flex items-center gap-2 bg-card border border-border rounded-lg px-2 py-1.5 shrink-0"
              title={f.type}
            >
              <div className="w-9 h-9 rounded-md overflow-hidden bg-secondary flex items-center justify-center shrink-0">
                {sku?.imageUrl ? (
                  <img
                    src={sku.imageUrl}
                    alt=""
                    width={36}
                    height={36}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Icon name={f.icon} size={14} className="text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                  {f.type}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground">
                  {f.w}×{f.h} см
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}