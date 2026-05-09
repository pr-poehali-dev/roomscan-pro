import { useCallback } from "react";
import Icon from "@/components/ui/icon";
import FurnitureCard from "@/components/catalog/FurnitureCard";
import {
  FURNITURE_CATALOG,
  type FurnitureItem,
} from "@/lib/furnitureCatalog";
import type { ARFurniture } from "@/components/ar/ARFurnitureView";

interface Props {
  filtered: FurnitureItem[];
  cart: number[];
  setCart: (updater: (p: number[]) => number[]) => void;
  added: number | null;
  planAdded: number | null;
  favorites: number[];
  totalPrice: number;

  addToCart: (id: number) => void;
  addToPlan3D: (id: number) => void;
  onToggleFav: (id: number) => void;
  setDetails: (item: FurnitureItem | null) => void;
  setArItem: (item: ARFurniture | null) => void;
  onTryOnRoom?: (item: FurnitureItem) => void;

  /** Полный сброс всех фильтров (вызывается из пустого состояния) */
  onResetAll: () => void;
}

/**
 * Результат поиска (счётчик), сетка карточек, корзина внизу.
 * Логика 1:1 перенесена из CatalogSection.tsx без изменений.
 */
export default function CatalogResults({
  filtered,
  cart,
  setCart,
  added,
  planAdded,
  favorites,
  totalPrice,
  addToCart,
  addToPlan3D,
  onToggleFav,
  setDetails,
  setArItem,
  onTryOnRoom,
  onResetAll,
}: Props) {
  const openAr = useCallback(
    (it: FurnitureItem) => {
      setArItem({
        id: it.id,
        name: it.name,
        width: it.w / 100,
        depth: it.d / 100,
        height: it.h / 100,
      });
    },
    [setArItem],
  );

  return (
    <>
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
            onClick={onResetAll}
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
              onOpenAR={openAr}
              onTryOnRoom={onTryOnRoom}
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
    </>
  );
}