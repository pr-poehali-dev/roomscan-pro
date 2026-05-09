import Icon from "@/components/ui/icon";
import type { FurnitureItem } from "@/lib/furnitureCatalog";

interface Props {
  item: FurnitureItem;
  inCart: boolean;
  justAdded: boolean;
  addedToPlan3D?: boolean;
  onAddToCart: (id: number) => void;
  onAddToPlan3D?: (id: number) => void;
  onOpenAR: (item: FurnitureItem) => void;
}

/**
 * Нижний блок карточки: цена (со скидкой) + кнопки действий
 * (3D-планировщик, AR-просмотр, добавить в план).
 * Логика 1:1 перенесена из FurnitureCard.tsx без изменений.
 */
export default function FurnitureCardActions({
  item,
  inCart,
  justAdded,
  addedToPlan3D,
  onAddToCart,
  onAddToPlan3D,
  onOpenAR,
}: Props) {
  return (
    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
      <div className="flex flex-col">
        {item.discount && item.oldPrice ? (
          <>
            <span className="text-xs text-muted-foreground line-through font-mono">
              {item.oldPrice.toLocaleString("ru-RU")} ₽
            </span>
            <span className="text-primary font-black">{item.price}</span>
          </>
        ) : (
          <span className="text-primary font-black">{item.price}</span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {onAddToPlan3D && (
          <button
            type="button"
            onClick={() => onAddToPlan3D(item.id)}
            disabled={item.inStock === false}
            aria-label={`Добавить «${item.name}» в 3D-сцену планировщика`}
            title="Добавить в 3D-планировщик"
            className={`text-xs px-2 py-1.5 rounded-lg flex items-center gap-1 font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              addedToPlan3D
                ? "bg-emerald-500 text-white border-emerald-500 scale-95"
                : "border-border text-muted-foreground hover:text-emerald-600 hover:border-emerald-500/40"
            }`}
          >
            <Icon name={addedToPlan3D ? "Check" : "Box"} size={12} aria-hidden="true" />
            {addedToPlan3D ? "В сцене" : "3D"}
          </button>
        )}
        <button
          type="button"
          onClick={() => onOpenAR(item)}
          aria-label={`Посмотреть «${item.name}» в дополненной реальности`}
          title="AR-просмотр (Android Chrome)"
          className="text-xs px-2 py-1.5 rounded-lg flex items-center gap-1 font-semibold border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Icon name="View" size={12} aria-hidden="true" />
          AR
        </button>
        <button
          type="button"
          onClick={() => onAddToCart(item.id)}
          disabled={item.inStock === false}
          aria-label={inCart ? `Убрать «${item.name}» из плана` : `Добавить «${item.name}» в план покупок`}
          className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            justAdded
              ? "bg-primary text-primary-foreground scale-95"
              : inCart
              ? "bg-primary/10 text-primary border border-primary/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
          }`}
        >
          <Icon name={inCart ? "Check" : "Plus"} size={12} aria-hidden="true" />
          {justAdded ? "Добавлено!" : inCart ? "В плане" : "В план"}
        </button>
      </div>
    </div>
  );
}
