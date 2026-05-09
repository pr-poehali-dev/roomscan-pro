import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { saveCart, getCart, type CartItemRef } from "@/lib/scanStore";
import ARFurnitureView, { type ARFurniture } from "@/components/ar/ARFurnitureView";
import RoomTryOn from "@/components/catalog/RoomTryOn";
import {
  FURNITURE_CATALOG,
  CATEGORIES,
  getAllBrands,
  getPriceRange,
  filterCatalog,
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
import FurnitureDetailsModal from "@/components/catalog/FurnitureDetailsModal";
import CatalogHeader from "@/components/catalog/CatalogHeader";
import CatalogFilters from "@/components/catalog/CatalogFilters";
import CatalogTabs from "@/components/catalog/CatalogTabs";
import CatalogResults from "@/components/catalog/CatalogResults";

/**
 * Раздел «Каталог мебели». Хранит весь стейт (фильтры, корзина, избранное, модалки)
 * и оркеструет 4 child-компонента:
 *  - CatalogHeader      — шапка с заголовком и сводкой
 *  - CatalogFilters     — поиск, сортировка, расширенные фильтры
 *  - CatalogTabs        — табы стилей и категорий
 *  - CatalogResults     — результат поиска, сетка карточек, корзина
 *
 * Логика и поведение 1:1 совпадают с прежней монолитной версией.
 */
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
  const [tryOnItem, setTryOnItem] = useState<FurnitureItem | null>(null);
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

  const resetAll = () => {
    setSearch("");
    setFilter("Все");
    setShowOnlyFavs(false);
    resetFilters();
  };

  return (
    <div className="animate-fade-in">
      <CatalogHeader
        totalProducts={FURNITURE_CATALOG.length}
        favoritesCount={favorites.length}
        showOnlyFavs={showOnlyFavs}
        onToggleOnlyFavs={() => setShowOnlyFavs((v) => !v)}
        cartCount={cart.length}
        totalPrice={totalPrice}
      />

      <CatalogFilters
        search={search}
        setSearch={setSearch}
        sortBy={sortBy}
        setSortBy={setSortBy}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        activeFiltersCount={activeFiltersCount}
        resetFilters={resetFilters}
        priceRange={priceRange}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        allBrands={allBrands}
        selectedBrands={selectedBrands}
        setSelectedBrands={setSelectedBrands}
        minRating={minRating}
        setMinRating={setMinRating}
        inStockOnly={inStockOnly}
        setInStockOnly={setInStockOnly}
        hasDiscount={hasDiscount}
        setHasDiscount={setHasDiscount}
      />

      <CatalogTabs
        styleFilter={styleFilter}
        setStyleFilter={setStyleFilter}
        styleCounts={styleCounts}
        categories={categories}
        filter={filter}
        setFilter={setFilter}
      />

      <CatalogResults
        filtered={filtered}
        cart={cart}
        setCart={setCart}
        added={added}
        planAdded={planAdded}
        favorites={favorites}
        totalPrice={totalPrice}
        addToCart={addToCart}
        addToPlan3D={addToPlan3D}
        onToggleFav={onToggleFav}
        setDetails={setDetails}
        setArItem={setArItem}
        onTryOnRoom={setTryOnItem}
        onResetAll={resetAll}
      />

      {/* Модалки */}
      {arItem && <ARFurnitureView item={arItem} onClose={() => setArItem(null)} />}
      {tryOnItem && <RoomTryOn item={tryOnItem} onClose={() => setTryOnItem(null)} />}
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
          onTryOnRoom={(it) => {
            setDetails(null);
            setTryOnItem(it);
          }}
        />
      )}
    </div>
  );
}