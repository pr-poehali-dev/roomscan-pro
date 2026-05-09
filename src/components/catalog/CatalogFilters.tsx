import Icon from "@/components/ui/icon";
import type { SortBy } from "@/lib/furnitureCatalog";

const SORT_OPTIONS: { id: SortBy; label: string; icon: string }[] = [
  { id: "popular", label: "По популярности", icon: "TrendingUp" },
  { id: "price-asc", label: "Сначала дешевле", icon: "ArrowDown01" },
  { id: "price-desc", label: "Сначала дороже", icon: "ArrowDown10" },
  { id: "rating", label: "По рейтингу", icon: "Star" },
  { id: "new", label: "Сначала новинки", icon: "Sparkles" },
];

interface Props {
  search: string;
  setSearch: (v: string) => void;
  sortBy: SortBy;
  setSortBy: (v: SortBy) => void;

  showFilters: boolean;
  setShowFilters: (v: boolean | ((p: boolean) => boolean)) => void;
  activeFiltersCount: number;
  resetFilters: () => void;

  priceRange: { min: number; max: number };
  minPrice: number;
  setMinPrice: (v: number) => void;
  maxPrice: number;
  setMaxPrice: (v: number) => void;

  allBrands: string[];
  selectedBrands: string[];
  setSelectedBrands: (updater: (p: string[]) => string[]) => void;

  minRating: number;
  setMinRating: (v: number) => void;

  inStockOnly: boolean;
  setInStockOnly: (v: boolean) => void;
  hasDiscount: boolean;
  setHasDiscount: (v: boolean) => void;
}

/**
 * Поиск + сортировка + кнопка «Фильтры» + блок расширенных фильтров (цена, бренды, рейтинг, чекбоксы).
 * Логика 1:1 перенесена из CatalogSection.tsx без изменений.
 */
export default function CatalogFilters({
  search,
  setSearch,
  sortBy,
  setSortBy,
  showFilters,
  setShowFilters,
  activeFiltersCount,
  resetFilters,
  priceRange,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  allBrands,
  selectedBrands,
  setSelectedBrands,
  minRating,
  setMinRating,
  inStockOnly,
  setInStockOnly,
  hasDiscount,
  setHasDiscount,
}: Props) {
  return (
    <>
      {/* Поиск + сортировка */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Icon
            name="Search"
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            placeholder="Найти диван, кровать, бренд…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border focus:border-primary pl-10 pr-9 py-2.5 rounded-lg text-sm outline-none transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <Icon name="X" size={14} />
            </button>
          )}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="bg-card border border-border rounded-lg px-3 py-2.5 text-sm outline-none cursor-pointer hover:border-primary/40 transition-colors"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
            showFilters || activeFiltersCount > 0
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-card text-foreground border-border hover:border-primary/30"
          }`}
        >
          <Icon name="SlidersHorizontal" size={14} />
          Фильтры
          {activeFiltersCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-mono rounded-full w-5 h-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Расширенные фильтры */}
      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground">Расширенные фильтры</h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Сбросить ({activeFiltersCount})
              </button>
            )}
          </div>

          {/* Цена */}
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Цена: {minPrice.toLocaleString("ru-RU")} ₽ — {maxPrice.toLocaleString("ru-RU")} ₽
            </p>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min={priceRange.min}
                max={priceRange.max}
                value={minPrice}
                onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - 1000))}
                className="flex-1 accent-primary"
              />
              <input
                type="range"
                min={priceRange.min}
                max={priceRange.max}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + 1000))}
                className="flex-1 accent-primary"
              />
            </div>
          </div>

          {/* Бренды */}
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Бренды
            </p>
            <div className="flex flex-wrap gap-2">
              {allBrands.map((b) => {
                const active = selectedBrands.includes(b);
                return (
                  <button
                    key={b}
                    onClick={() =>
                      setSelectedBrands((p) =>
                        active ? p.filter((x) => x !== b) : [...p, b],
                      )
                    }
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      active
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-secondary text-muted-foreground border-border hover:border-primary/30"
                    }`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Рейтинг */}
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Минимальный рейтинг
            </p>
            <div className="flex gap-2">
              {[0, 4, 4.5, 4.8].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1 transition-colors ${
                    minRating === r
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-secondary text-muted-foreground border-border hover:border-primary/30"
                  }`}
                >
                  {r === 0 ? (
                    "Любой"
                  ) : (
                    <>
                      <Icon name="Star" size={11} className="fill-current text-yellow-500" />
                      от {r}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Чекбоксы */}
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-primary w-4 h-4"
              />
              <span className="text-sm">Только в наличии</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasDiscount}
                onChange={(e) => setHasDiscount(e.target.checked)}
                className="accent-primary w-4 h-4"
              />
              <span className="text-sm">Только со скидкой</span>
            </label>
          </div>
        </div>
      )}
    </>
  );
}
