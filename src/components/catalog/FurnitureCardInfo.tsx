import Icon from "@/components/ui/icon";
import { STYLE_LABELS, type FurnitureItem } from "@/lib/furnitureCatalog";

interface Props {
  item: FurnitureItem;
  onOpenDetails: (item: FurnitureItem) => void;
}

/**
 * Текстовый блок карточки мебели:
 *  - Бренд + категория (мета)
 *  - Рейтинг (звезда + значение)
 *  - Название (h3, hover→primary)
 *  - Бейджи: материал + первый стиль
 *  - Цветовая палитра (до 4 кружков)
 *  - Доставка (если задана)
 */
export default function FurnitureCardInfo({ item, onOpenDetails }: Props) {
  const palette = item.colorPalette ?? [];
  const primaryStyle = item.styleTags?.[0];
  const styleLabel = primaryStyle ? STYLE_LABELS[primaryStyle] : null;

  return (
    <>
      {/* Бренд + категория + рейтинг */}
      <div className="flex items-center gap-2 mb-1">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground truncate">
          {item.brand} · {item.category}
        </p>
        {item.rating && (
          <span className="ml-auto inline-flex items-center gap-0.5 text-xs text-foreground shrink-0">
            <Icon name="Star" size={11} className="text-yellow-500 fill-current" />
            <span className="font-bold">{item.rating}</span>
            {item.reviews && (
              <span className="text-muted-foreground">({item.reviews})</span>
            )}
          </span>
        )}
      </div>

      {/* Название */}
      <h3 className="font-bold text-foreground mb-2 line-clamp-1 m-0">
        <button
          type="button"
          onClick={() => onOpenDetails(item)}
          className="text-left w-full hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary"
        >
          {item.name}
        </button>
      </h3>

      {/* Бейджи: материал + стиль */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        {item.material && (
          <span className="text-[10px] font-bold bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
            {item.material}
          </span>
        )}
        {styleLabel && (
          <span className="text-[10px] font-semibold text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded">
            {styleLabel}
          </span>
        )}
      </div>

      {/* Цветовая палитра + доставка */}
      <div className="flex items-center gap-2 mb-3">
        {palette.length > 0 && (
          <div className="flex items-center gap-1">
            {palette.slice(0, 4).map((c, i) => (
              <span
                key={i}
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: c }}
                title={item.colors?.[i] ?? ""}
              />
            ))}
            {palette.length > 4 && (
              <span className="text-[10px] text-muted-foreground font-mono">
                +{palette.length - 4}
              </span>
            )}
          </div>
        )}
        {item.deliveryDays !== undefined && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Icon name="Truck" size={10} />
            {item.deliveryDays === 0
              ? "Сегодня"
              : `${item.deliveryDays} дн.`}
          </span>
        )}
      </div>
    </>
  );
}
