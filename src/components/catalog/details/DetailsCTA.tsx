import Icon from "@/components/ui/icon";
import type { FurnitureItem } from "@/lib/furnitureCatalog";
import { useARSupport } from "@/hooks/use-ar-support";

interface Props {
  item: FurnitureItem;
  inCart: boolean;
  onAddToCart: (id: number) => void;
  onOpenAR: (item: FurnitureItem) => void;
  onTryOnRoom?: (item: FurnitureItem) => void;
}

/**
 * Нижний CTA-блок модалки: цена (со скидкой) + кнопки
 * «Примерить в комнате» / «Примерить в AR» / «Добавить в план».
 */
export default function DetailsCTA({ item, inCart, onAddToCart, onOpenAR, onTryOnRoom }: Props) {
  const arSupport = useARSupport();

  return (
    <div className="flex items-center justify-between gap-3 pt-6 border-t border-border flex-wrap">
      <div>
        {item.discount && item.oldPrice ? (
          <>
            <p className="text-xs text-muted-foreground line-through font-mono">
              {item.oldPrice.toLocaleString("ru-RU")} ₽
            </p>
            <p className="text-3xl font-black text-primary font-mono">
              {item.price}
            </p>
          </>
        ) : (
          <p className="text-3xl font-black text-primary font-mono">
            {item.price}
          </p>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        {onTryOnRoom && (
          <button
            onClick={() => onTryOnRoom(item)}
            className="px-4 py-3 rounded-xl bg-secondary text-foreground font-bold flex items-center gap-2 hover:bg-primary/10 transition-colors"
            title="Загрузить фото комнаты и наложить мебель"
          >
            <Icon name="Camera" size={16} />
            Примерить в комнате
          </button>
        )}
        {arSupport === "supported" && (
          <button
            onClick={() => onOpenAR(item)}
            className="px-4 py-3 rounded-xl bg-secondary text-foreground font-bold flex items-center gap-2 hover:bg-primary/10 transition-colors"
          >
            <Icon name="View" size={16} />
            Примерить в AR
          </button>
        )}
        <button
          onClick={() => onAddToCart(item.id)}
          disabled={item.inStock === false}
          className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            inCart
              ? "bg-destructive/10 text-destructive border border-destructive/30"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          <Icon name={inCart ? "Check" : "Plus"} size={16} />
          {inCart ? "В плане" : "Добавить в план"}
        </button>
      </div>
    </div>
  );
}