import Icon from "@/components/ui/icon";

interface Props {
  totalProducts: number;
  favoritesCount: number;
  showOnlyFavs: boolean;
  onToggleOnlyFavs: () => void;
  cartCount: number;
  totalPrice: number;
}

/**
 * Шапка каталога: заголовок + счётчик товаров + кнопка избранного + сводка корзины.
 * Логика 1:1 перенесена из CatalogSection.tsx без изменений.
 */
export default function CatalogHeader({
  totalProducts,
  favoritesCount,
  showOnlyFavs,
  onToggleOnlyFavs,
  cartCount,
  totalPrice,
}: Props) {
  return (
    <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
      <div>
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">
          3D-библиотека · {totalProducts} товаров
        </p>
        <h2 className="text-3xl font-bold">Каталог мебели</h2>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleOnlyFavs}
          aria-pressed={showOnlyFavs}
          aria-label={`Избранное: ${favoritesCount}${showOnlyFavs ? ", показано — нажмите для возврата к каталогу" : " — показать только избранное"}`}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
            showOnlyFavs
              ? "bg-red-500/10 text-red-500 border-red-500/30"
              : "bg-card text-muted-foreground border-border hover:text-red-500 hover:border-red-500/30"
          }`}
          title="Показать избранное"
        >
          <Icon name="Heart" size={14} className={showOnlyFavs ? "fill-current" : ""} aria-hidden="true" />
          <span className="text-sm font-bold">{favoritesCount}</span>
        </button>
        {cartCount > 0 && (
          <div className="flex items-center gap-3 bg-card border border-primary/20 rounded-lg px-4 py-2">
            <Icon name="ShoppingCart" size={16} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">{cartCount} поз.</span>
            <span className="text-sm font-black text-primary font-mono">
              {totalPrice.toLocaleString("ru-RU")} ₽
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
