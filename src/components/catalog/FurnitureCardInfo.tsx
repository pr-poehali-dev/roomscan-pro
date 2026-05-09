import Icon from "@/components/ui/icon";
import type { FurnitureItem } from "@/lib/furnitureCatalog";

interface Props {
  item: FurnitureItem;
  onOpenDetails: (item: FurnitureItem) => void;
}

/**
 * Текстовый блок карточки: бренд+категория, рейтинг, название (кнопка),
 * размер/материал, цветовая палитра.
 * Логика 1:1 перенесена из FurnitureCard.tsx без изменений.
 */
export default function FurnitureCardInfo({ item, onOpenDetails }: Props) {
  const palette = item.colorPalette ?? [];

  return (
    <>
      <div className="flex items-center gap-2 mb-1">
        <p className="text-xs text-muted-foreground font-mono">
          {item.brand} · {item.category}
        </p>
        {item.rating && (
          <span className="ml-auto inline-flex items-center gap-0.5 text-xs text-foreground">
            <Icon name="Star" size={11} className="text-yellow-500 fill-current" />
            <span className="font-bold">{item.rating}</span>
            {item.reviews && (
              <span className="text-muted-foreground">({item.reviews})</span>
            )}
          </span>
        )}
      </div>

      <h3 className="font-bold text-foreground mb-1 line-clamp-1 m-0">
        <button
          type="button"
          onClick={() => onOpenDetails(item)}
          className="text-left w-full hover:text-primary transition-colors focus-visible:outline-none focus-visible:text-primary"
        >
          {item.name}
        </button>
      </h3>
      <p className="text-xs text-muted-foreground mb-2">
        {item.size}
        {item.material && <span> · {item.material}</span>}
      </p>

      {/* Цветовая палитра */}
      {palette.length > 0 && (
        <div className="flex items-center gap-1 mb-3">
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
    </>
  );
}
