import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import { saveCart, getCart, type CartItemRef } from "@/lib/scanStore";
import ARFurnitureView, { type ARFurniture } from "@/components/ar/ARFurnitureView";
import {
  FURNITURE_CATALOG,
  CATEGORIES,
  getAllBrands,
  getPriceRange,
  filterCatalog,
  STYLE_LABELS,
  STYLE_ORDER,
  type Category,
  type SortBy,
  type StyleTag,
  type FurnitureItem,
} from "@/lib/furnitureCatalog";
import { addCatalogItemToFloorPlan } from "@/lib/catalogToPlan";
import {
  getFavorites,
  toggleFavorite,
  FAVORITES_EVENT,
} from "@/lib/favoritesStore";
import FurnitureCard from "@/components/catalog/FurnitureCard";
import FurnitureDetailsModal from "@/components/catalog/FurnitureDetailsModal";

const SORT_OPTIONS: { id: SortBy; label: string; icon: string }[] = [
  { id: "popular", label: "По популярности", icon: "TrendingUp" },
  { id: "price-asc", label: "Сначала дешевле", icon: "ArrowDown01" },
  { id: "price-desc", label: "Сначала дороже", icon: "ArrowDown10" },
  { id: "rating", label: "По рейтингу", icon: "Star" },
  { id: "new", label: "Сначала новинки", icon: "Sparkles" },
];

export default function CatalogSection() {
  const [filter, setFilter] = useState<"Все" | Category>("Все");
  const [styleFilter, setStyleFilter] = useState<StyleTag | "all">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("popular");
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyFavs, setShowOnlyFavs] = useState(false);
  const [planAdded, setPlanAdded] = useState<number | null>(null);

  // Подсчёт SKU по стилям — для бейджей в табах
  const styleCounts = useMemo(() => {
    const map = new Map<StyleTag, number>();
    FURNITURE_CATALOG.forEach((f) => {
      f.styleTags?.forEach((t) => map.set(t, (map.get(t) ?? 0) + 1));
    });
    return map;
  }, []);

  const priceRange = useMemo(() => getPriceRange(), []);
  const allBrands = useMemo(() => getAllBrands(), []);

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(priceRange.min);
  const [maxPrice, setMaxPrice] = useState<number>(priceRange.max);
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [hasDiscount, setHasDiscount] = useState(false);

  const [cart, setCart] = useState<number[]>([]);
  const [added, setAdded] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<number[]>(() => getFavorites());
  const [arItem, setArItem] = useState<ARFurniture | null>(null);
  const [details, setDetails] = useState<FurnitureItem | null>(null);

  const categories: ("Все" | Category)[] = ["Все", ...CATEGORIES];

  const filtered = useMemo(() => {
    let list = filterCatalog({
      search,
      category: filter === "Все" ? "all" : filter,
      styleTags: styleFilter === "all" ? undefined : [styleFilter],
      brands: selectedBrands.length > 0 ? selectedBrands : undefined,
      minPrice: minPrice > priceRange.min ? minPrice : undefined,
      maxPrice: maxPrice < priceRange.max ? maxPrice : undefined,
      minRating: minRating > 0 ? minRating : undefined,
      inStockOnly,
      hasDiscount,
      sortBy,
    });
    if (showOnlyFavs) list = list.filter((f) => favorites.includes(f.id));
    return list;
  }, [
    search,
    filter,
    styleFilter,
    selectedBrands,
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    hasDiscount,
    sortBy,
    showOnlyFavs,
    favorites,
    priceRange,
  ]);

  // Корзина
  useEffect(() => {
    const stored = getCart();
    if (stored.length > 0) setCart(stored.map((c) => c.id));
  }, []);

  useEffect(() => {
    const items: CartItemRef[] = cart
      .map((id) => FURNITURE_CATALOG.find((f) => f.id === id))
      .filter((f): f is FurnitureItem => Boolean(f))
      .map((f) => ({
        id: f.id, name: f.name, icon: f.icon, w: f.w, d: f.d,
        priceNum: f.priceNum, category: f.category,
      }));
    saveCart(items);
  }, [cart]);

  // Избранное
  useEffect(() => {
    const sync = () => setFavorites(getFavorites());
    window.addEventListener(FAVORITES_EVENT, sync);
    return () => window.removeEventListener(FAVORITES_EVENT, sync);
  }, []);

  const addToCart = useCallback((id: number) => {
    const item = FURNITURE_CATALOG.find((f) => f.id === id);
    if (item?.inStock === false) return;
    setCart((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    setAdded(id);
    setTimeout(() => setAdded(null), 1200);
  }, []);

  const onToggleFav = useCallback((id: number) => {
    toggleFavorite(id);
  }, []);

  /** Добавить SKU прямо в 3D-планировщик (localStorage + событие). */
  const addToPlan3D = useCallback((id: number) => {
    const item = FURNITURE_CATALOG.find((f) => f.id === id);
    if (!item) return;
    addCatalogItemToFloorPlan(item);
    setPlanAdded(id);
    setTimeout(() => setPlanAdded(null), 1500);
    toast.success(`«${item.name}» — в 3D-сцене`, {
      description: "Откройте раздел Планировщик 3D, чтобы увидеть и переставить",
      duration: 3500,
    });
  }, []);

  const totalPrice = cart.reduce((sum, id) => {
    const item = FURNITURE_CATALOG.find((f) => f.id === id);
    return sum + (item?.priceNum ?? 0);
  }, 0);

  const activeFiltersCount =
    (selectedBrands.length > 0 ? 1 : 0) +
    (minPrice > priceRange.min || maxPrice < priceRange.max ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (hasDiscount ? 1 : 0);

  const resetFilters = () => {
    setSelectedBrands([]);
    setMinPrice(priceRange.min);
    setMaxPrice(priceRange.max);
    setMinRating(0);
    setInStockOnly(false);
    setHasDiscount(false);
  };

  return (
    <div className="animate-fade-in">
      {/* Заголовок + корзина */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">
            3D-библиотека · {FURNITURE_CATALOG.length} товаров
          </p>
          <h2 className="text-3xl font-bold">Каталог мебели</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOnlyFavs((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              showOnlyFavs
                ? "bg-red-500/10 text-red-500 border-red-500/30"
                : "bg-card text-muted-foreground border-border hover:text-red-500 hover:border-red-500/30"
            }`}
            title="Показать избранное"
          >
            <Icon name="Heart" size={14} className={showOnlyFavs ? "fill-current" : ""} />
            <span className="text-sm font-bold">{favorites.length}</span>
          </button>
          {cart.length > 0 && (
            <div className="flex items-center gap-3 bg-card border border-primary/20 rounded-lg px-4 py-2">
              <Icon name="ShoppingCart" size={16} className="text-primary" />
              <span className="text-sm font-semibold text-foreground">{cart.length} поз.</span>
              <span className="text-sm font-black text-primary font-mono">
                {totalPrice.toLocaleString("ru-RU")} ₽
              </span>
            </div>
          )}
        </div>
      </div>

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

      {/* Результат поиска */}
      <p className="text-xs text-muted-foreground mb-3">
        Найдено: <span className="font-bold text-foreground">{filtered.length}</span>{" "}
        {filtered.length === 1 ? "товар" : filtered.length < 5 ? "товара" : "товаров"}
      </p>

      {/* Сетка товаров */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Icon name="SearchX" size={40} className="text-muted-foreground mx-auto mb-3" />
          <p className="font-bold text-foreground mb-1">Ничего не найдено</p>
          <p className="text-sm text-muted-foreground mb-4">
            Попробуйте изменить фильтры или поисковой запрос
          </p>
          <button
            onClick={() => {
              setSearch("");
              setFilter("Все");
              setShowOnlyFavs(false);
              resetFilters();
            }}
            className="text-sm text-primary font-semibold hover:underline"
          >
            Сбросить все фильтры
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <FurnitureCard
              key={item.id}
              item={item}
              inCart={cart.includes(item.id)}
              justAdded={added === item.id}
              addedToPlan3D={planAdded === item.id}
              isFav={favorites.includes(item.id)}
              onAddToCart={addToCart}
              onAddToPlan3D={addToPlan3D}
              onToggleFav={onToggleFav}
              onOpenDetails={setDetails}
              onOpenAR={(it) =>
                setArItem({
                  id: it.id,
                  name: it.name,
                  width: it.w / 100,
                  depth: it.d / 100,
                  height: it.h / 100,
                })
              }
            />
          ))}
        </div>
      )}

      {/* Корзина внизу */}
      {cart.length > 0 && (
        <div className="mt-6 bg-card border border-border rounded-xl p-5 animate-fade-in">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
            Выбранная мебель
          </p>
          <div className="space-y-2 mb-4">
            {cart.map((id) => {
              const item = FURNITURE_CATALOG.find((f) => f.id === id)!;
              return (
                <div key={id} className="flex items-center gap-3 text-sm">
                  <Icon name={item.icon} size={15} className="text-primary shrink-0" />
                  <span className="flex-1 text-foreground truncate">{item.name}</span>
                  <span className="font-mono text-muted-foreground hidden sm:inline">
                    {item.size}
                  </span>
                  <span className="font-bold text-primary font-mono">{item.price}</span>
                  <button
                    onClick={() => setCart((p) => p.filter((x) => x !== id))}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Icon name="X" size={14} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Итого: {cart.length} позиций
            </span>
            <span className="text-xl font-black text-primary font-mono">
              {totalPrice.toLocaleString("ru-RU")} ₽
            </span>
          </div>
        </div>
      )}

      {/* Модалки */}
      {arItem && <ARFurnitureView item={arItem} onClose={() => setArItem(null)} />}
      {details && (
        <FurnitureDetailsModal
          item={details}
          inCart={cart.includes(details.id)}
          isFav={favorites.includes(details.id)}
          cartIds={cart}
          favIds={favorites}
          onClose={() => setDetails(null)}
          onAddToCart={addToCart}
          onToggleFav={onToggleFav}
          onSelectRelated={(it) => setDetails(it)}
          onOpenAR={(it) => {
            setDetails(null);
            setArItem({
              id: it.id,
              name: it.name,
              width: it.w / 100,
              depth: it.d / 100,
              height: it.h / 100,
            });
          }}
        />
      )}
    </div>
  );
}