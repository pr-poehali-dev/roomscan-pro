import { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  TILE_LIBRARY,
  filterTilesByRoom,
  filterTilesByStyle,
  filterTilesBySurface,
  searchTiles,
  type TileItem,
  type TileMaterial,
  type TileStyle,
  type TileSurface,
} from "@/lib/tile-library";
import TileFilters from "@/components/tiles/TileFilters";
import TileDetailsModal from "@/components/tiles/TileDetailsModal";
import VirtualTileGrid from "@/components/tiles/VirtualTileGrid";
import ErrorBoundary from "@/components/ErrorBoundary";

const FAV_KEY = "roomscan:tile-favorites";

type Room = TileItem["rooms"][number] | "all";

function loadFavorites(): string[] {
  try {
    const raw = window.localStorage.getItem(FAV_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveFavorites(ids: string[]) {
  try {
    window.localStorage.setItem(FAV_KEY, JSON.stringify(ids));
  } catch {
    /* noop */
  }
}

/**
 * Раздел «Каталог плитки и напольных покрытий».
 *
 * Возможности:
 *  - 12 моделей плитки от ведущих брендов (Kerama Marazzi, Italon, Equipe и др.)
 *  - Фильтры: поверхность (пол / стены / универсальная), материал, стиль, помещение
 *  - Полнотекстовый поиск по названию, бренду, тегам, описанию
 *  - Сортировка: популярные → дешевле / дороже
 *  - Избранное (LocalStorage)
 *  - Модалка детали с калькулятором стоимости (м² × цена + 10% запас)
 *  - Связь с планировщиком (по кнопке открывается раздел «Планировщик»)
 */
export default function TileCatalogSection() {
  const [search, setSearch] = useState("");
  const [surface, setSurface] = useState<TileSurface | "all">("all");
  const [material, setMaterial] = useState<TileMaterial | "all">("all");
  const [style, setStyle] = useState<TileStyle | "all">("all");
  const [room, setRoom] = useState<Room>("all");
  const [sortBy, setSortBy] = useState<"popular" | "asc" | "desc">("popular");
  const [onlyFav, setOnlyFav] = useState(false);
  const [details, setDetails] = useState<TileItem | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return loadFavorites();
  });

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const toggleFav = useCallback((id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const openDetails = useCallback((tile: TileItem) => setDetails(tile), []);
  const closeDetails = useCallback(() => setDetails(null), []);

  const filtered = useMemo(() => {
    let list: TileItem[] = TILE_LIBRARY;

    if (material !== "all") {
      list = list.filter((t) => t.material === material);
    }
    list = filterTilesBySurface(list, surface);
    list = filterTilesByStyle(list, style);
    list = filterTilesByRoom(list, room);
    list = searchTiles(list, search);

    if (onlyFav) {
      list = list.filter((t) => favorites.includes(t.id));
    }

    const arr = [...list];
    if (sortBy === "asc") {
      arr.sort((a, b) => a.pricePerM2 - b.pricePerM2);
    } else if (sortBy === "desc") {
      arr.sort((a, b) => b.pricePerM2 - a.pricePerM2);
    } else {
      arr.sort((a, b) => Number(b.popular ?? false) - Number(a.popular ?? false));
    }
    return arr;
  }, [material, surface, style, room, search, onlyFav, favorites, sortBy]);

  const resetFilters = () => {
    setSearch("");
    setSurface("all");
    setMaterial("all");
    setStyle("all");
    setRoom("all");
    setOnlyFav(false);
    setSortBy("popular");
  };

  const stats = useMemo(() => {
    const total = TILE_LIBRARY.length;
    const onSale = TILE_LIBRARY.filter((t) => t.popular).length;
    const minPrice = Math.min(...TILE_LIBRARY.map((t) => t.pricePerM2));
    return { total, onSale, minPrice };
  }, []);

  return (
    <div id="tiles" className="container mx-auto px-4 py-10 max-w-[1400px]">
      {/* Заголовок */}
      <div className="mb-6">
        <p className="t-meta text-primary mb-1">
          Модуль · Отделочные материалы
        </p>
        <h1 className="h-section text-foreground mb-2 flex items-center gap-3 flex-wrap">
          <span className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center">
            <Icon name="Grid2x2" size={22} className="text-primary" />
          </span>
          Каталог плитки и напольных покрытий
        </h1>
        <p className="t-lead max-w-3xl">
          {stats.total} реальных моделей от ведущих брендов (Italon, Atlas Concorde, Marazzi,
          Estima, Equipe, Cersanit, Porcelanosa и др.): керамогранит, мрамор, имитация дерева,
          бетон, terrazzo, шестигранники, zellige, слэбы 120×240. Расчёт стоимости с запасом
          10% и связка с планировщиком — выберите отделку прямо для своей комнаты.
        </p>
      </div>

      {/* Сводные плашки */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card-base p-3">
          <p className="text-[10px] font-mono uppercase text-muted-foreground">Всего моделей</p>
          <p className="t-num text-xl font-black text-foreground mt-1">{stats.total}</p>
        </div>
        <div className="card-base p-3">
          <p className="text-[10px] font-mono uppercase text-muted-foreground">Хитов продаж</p>
          <p className="t-num text-xl font-black text-yellow-500 mt-1">{stats.onSale}</p>
        </div>
        <div className="card-base p-3">
          <p className="text-[10px] font-mono uppercase text-muted-foreground">Цена от</p>
          <p className="t-num text-xl font-black text-primary mt-1">
            {stats.minPrice.toLocaleString("ru-RU")} ₽/м²
          </p>
        </div>
        <div className="card-base p-3">
          <p className="text-[10px] font-mono uppercase text-muted-foreground">В избранном</p>
          <p className="t-num text-xl font-black text-red-500 mt-1">{favorites.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
        {/* Левая колонка — фильтры */}
        <aside className="space-y-3 lg:sticky lg:top-4 self-start">
          <TileFilters
            search={search}
            setSearch={setSearch}
            surface={surface}
            setSurface={setSurface}
            material={material}
            setMaterial={setMaterial}
            style={style}
            setStyle={setStyle}
            room={room}
            setRoom={setRoom}
            onlyFav={onlyFav}
            setOnlyFav={setOnlyFav}
            resultsCount={filtered.length}
            totalCount={TILE_LIBRARY.length}
            onReset={resetFilters}
          />

          {/* Связь с мебельным каталогом и планировщиком */}
          <div className="bg-gradient-to-br from-primary/10 to-emerald-500/5 border border-primary/30 rounded-xl p-4">
            <p className="text-xs font-bold text-foreground flex items-center gap-2 mb-1.5">
              <Icon name="Sparkles" size={14} className="text-primary" />
              Подберите мебель и план
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
              После выбора плитки откройте каталог мебели или планировщик —
              расставьте мебель прямо на этой отделке.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <a
                href="#catalog"
                className="bg-card border border-border rounded-lg px-2 py-2 text-xs font-bold text-foreground flex items-center justify-center gap-1.5 hover:border-primary transition-colors"
              >
                <Icon name="Sofa" size={12} />
                Мебель
              </a>
              <a
                href="#planner"
                className="bg-primary text-primary-foreground rounded-lg px-2 py-2 text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
              >
                <Icon name="LayoutGrid" size={12} />
                Планировщик
              </a>
            </div>
          </div>
        </aside>

        {/* Правая колонка — результаты */}
        <div className="space-y-3">
          {/* Тулбар сортировки */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">
              Показано <span className="font-bold text-foreground">{filtered.length}</span>
              {" "}моделей
            </p>
            <div className="inline-flex bg-secondary rounded-lg p-1">
              {[
                { id: "popular" as const, label: "Популярные", icon: "Star" },
                { id: "asc"     as const, label: "Дешевле",    icon: "ArrowUp" },
                { id: "desc"    as const, label: "Дороже",     icon: "ArrowDown" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                    sortBy === s.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon name={s.icon} size={11} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Сетка карточек */}
          {filtered.length > 0 ? (
            <VirtualTileGrid
              items={filtered}
              favorites={favorites}
              onOpen={openDetails}
              onToggleFav={toggleFav}
            />
          ) : (
            <div className="card-base border-2 border-dashed p-12 text-center">
              <Icon name="SearchX" size={32} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">Ничего не найдено</p>
              <p className="text-xs text-muted-foreground mt-1">
                Сбросьте фильтры или измените поисковый запрос.
              </p>
              <button
                onClick={resetFilters}
                className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-xs"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Модалка деталей */}
      {details && (
        <ErrorBoundary inline onReset={closeDetails}>
          <TileDetailsModal
            tile={details}
            isFav={favorites.includes(details.id)}
            onClose={closeDetails}
            onToggleFav={toggleFav}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}