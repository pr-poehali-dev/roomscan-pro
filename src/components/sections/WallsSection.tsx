import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import WallsFilters, { initialWallsFilters, type WallsFilterState } from "@/components/walls/WallsFilters";
import WallCard from "@/components/walls/WallCard";
import WallsCalcCard from "@/components/walls/WallsCalcCard";
import { WALL_ITEMS, type WallItem } from "@/components/walls/wallsData";
import {
  addProjectItem,
  getWallsGeometry,
  getActiveWallCoating,
  setActiveWallCoating,
  type ActiveWallCoating,
  type ProjectItem,
} from "@/lib/scanStore";

const FAV_KEY = "roomscan:wall-favorites";

/**
 * Раздел «Стены» — каталог покрытий с фильтрами и авторасчётом м².
 * Связан со сканом (расчёт по периметру) и с корзиной проекта.
 */
interface Props {
  onNavigate?: (section: string) => void;
}

export default function WallsSection({ onNavigate }: Props) {
  const [filters, setFilters] = useState<WallsFilterState>(initialWallsFilters);
  const [favs, setFavs] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const [geometry, setGeometry] = useState(getWallsGeometry());
  const [activeCoating, setActiveCoatingState] = useState<ActiveWallCoating | null>(getActiveWallCoating());

  useEffect(() => {
    const reload = () => setGeometry(getWallsGeometry());
    const reloadCoating = () => setActiveCoatingState(getActiveWallCoating());
    window.addEventListener("roomscan:lastScan:changed", reload);
    window.addEventListener("roomscan:wallCoating:changed", reloadCoating);
    return () => {
      window.removeEventListener("roomscan:lastScan:changed", reload);
      window.removeEventListener("roomscan:wallCoating:changed", reloadCoating);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    } catch {
      /* ignore */
    }
  }, [favs]);

  const toggleFav = (id: string) =>
    setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    let list = WALL_ITEMS.filter((it) => {
      if (filters.category !== "all" && it.category !== filters.category) return false;
      if (filters.styles.length && !filters.styles.some((s) => it.styles.includes(s))) return false;
      if (filters.rooms.length && !filters.rooms.some((r) => it.rooms.includes(r))) return false;
      if (filters.onlyMoisture && !it.moistureResistant) return false;
      if (filters.onlyPaintable && !it.paintable) return false;
      if (filters.onlyEco && !it.eco) return false;
      if (filters.onlyFav && !favs.includes(it.id)) return false;
      if (q) {
        const hay = `${it.title} ${it.brand} ${it.collection ?? ""} ${(it.tags ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (filters.sort === "asc") list = list.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
    else if (filters.sort === "desc") list = list.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
    else list = list.sort((a, b) => Number(Boolean(b.hit)) - Number(Boolean(a.hit)));

    return list;
  }, [filters, favs]);

  const handleAdd = (item: WallItem, qty: number) => {
    const projectItem: ProjectItem = {
      id: `walls:${item.id}`,
      source: "walls",
      title: item.title,
      subtitle: `${item.brand}${item.collection ? " · " + item.collection : ""}`,
      icon: "Wallpaper",
      unit: item.unit,
      qty,
      pricePerUnit: item.pricePerUnit,
      addedAt: Date.now(),
    };
    addProjectItem(projectItem);
    toast.success("Добавлено в проект", {
      description: `${item.title} · ${qty} ${item.unit} · ${(qty * item.pricePerUnit).toLocaleString("ru-RU")} ₽`,
    });
  };

  const handleApply = (item: WallItem) => {
    // если уже применено это же — снимаем
    if (activeCoating?.id === item.id) {
      setActiveWallCoating(null);
      toast("Покрытие снято со стен");
      return;
    }
    const coating: ActiveWallCoating = {
      id: item.id,
      title: item.title,
      brand: item.brand,
      color: item.color,
      texture: item.textures[0],
    };
    setActiveWallCoating(coating);
    toast.success("Применено в планировщике", {
      description: `${item.title} · откройте Планировщик в 3D-режиме`,
      action: {
        label: "Открыть",
        onClick: () => onNavigate?.("planner"),
      },
    });
  };

  const hits = WALL_ITEMS.filter((i) => i.hit).length;
  const minPrice = Math.min(...WALL_ITEMS.map((i) => i.pricePerUnit));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Заголовок */}
      <div>
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
          Каталог · отделка стен
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-foreground">Стены</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Обои, краска, штукатурка, панели, кирпич и молдинги. Расход и стоимость
          считаются автоматически по площади стен из последнего скана.
        </p>
      </div>

      {/* Сводка */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon="Wallpaper" label="Позиций в каталоге" value={String(WALL_ITEMS.length)} />
        <SummaryCard icon="Flame"     label="Хиты"               value={String(hits)} />
        <SummaryCard icon="Tag"       label="Цена от"            value={`${minPrice.toLocaleString("ru-RU")} ₽`} />
        <SummaryCard icon="Heart"     label="В избранном"        value={String(favs.length)} />
      </div>

      {/* Расчёт по комнате */}
      <WallsCalcCard
        geometry={geometry}
        onScan={() => onNavigate?.("scan")}
      />

      {/* Активное покрытие в планировщике */}
      {activeCoating && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <div
              className="w-10 h-10 rounded-md border border-border shrink-0"
              style={{ backgroundColor: activeCoating.color }}
              aria-label="Цвет покрытия"
            />
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-0.5">
                Применено к стенам в Планировщике
              </p>
              <p className="font-bold text-foreground leading-tight">{activeCoating.title}</p>
              <p className="text-xs text-muted-foreground">{activeCoating.brand}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={() => onNavigate?.("planner")}>
                <Icon name="LayoutGrid" size={14} className="mr-1.5" />
                Открыть Планировщик
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setActiveWallCoating(null);
                  toast("Покрытие снято со стен");
                }}
              >
                <Icon name="X" size={14} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Сетка фильтры + каталог */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <div className="lg:sticky lg:top-4 lg:self-start">
          <WallsFilters state={filters} setState={setFilters} favCount={favs.length} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Найдено: <span className="font-bold text-foreground">{filtered.length}</span>
            </p>
            {filters !== initialWallsFilters && (
              <Button
                variant="ghost" size="sm"
                onClick={() => setFilters(initialWallsFilters)}
              >
                <Icon name="X" size={14} className="mr-1.5" />
                Сбросить
              </Button>
            )}
          </div>

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                <Icon name="SearchX" size={32} className="mx-auto mb-3 opacity-50" />
                Ничего не найдено. Попробуйте сбросить фильтры.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((item) => (
                <WallCard
                  key={item.id}
                  item={item}
                  wallsAreaNet={geometry?.wallsAreaNet ?? null}
                  isFav={favs.includes(item.id)}
                  isApplied={activeCoating?.id === item.id}
                  onToggleFav={toggleFav}
                  onAdd={handleAdd}
                  onApply={handleApply}
                />
              ))}
            </div>
          )}

          {/* Связки с другими разделами */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
            <CrossLink icon="Grid2x2"     label="Каталог плитки"  onClick={() => onNavigate?.("tiles")} />
            <CrossLink icon="Calculator"  label="Смета ремонта"   onClick={() => onNavigate?.("calc")} />
            <CrossLink icon="LayoutGrid"  label="Планировщик"     onClick={() => onNavigate?.("planner")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon name={icon} size={18} />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
            {label}
          </div>
          <div className="text-lg font-black text-foreground">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function CrossLink({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border bg-card p-4 text-left hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center gap-3"
    >
      <Icon name={icon} size={18} className="text-primary" />
      <span className="font-medium text-foreground">{label}</span>
      <Icon name="ArrowRight" size={14} className="ml-auto text-muted-foreground" />
    </button>
  );
}