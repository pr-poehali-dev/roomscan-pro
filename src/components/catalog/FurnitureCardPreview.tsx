import Icon from "@/components/ui/icon";
import type { FurnitureItem } from "@/lib/furnitureCatalog";

interface Props {
  item: FurnitureItem;
  inCart: boolean;
  isFav: boolean;
  onOpenDetails: (item: FurnitureItem) => void;
  onToggleFav: (id: number) => void;
}

/**
 * Превью карточки мебели в стиле TileCard:
 *  - Изображение/иконка
 *  - Бейджи NEW/HIT/Скидка (слева сверху)
 *  - Кнопка избранного (справа сверху)
 *  - Размер крупно (слева снизу)
 *  - Hover-плашка «Подробнее →» (справа снизу)
 *  - Stock индикатор поверх (если нет в наличии)
 */
export default function FurnitureCardPreview({
  item,
  inCart,
  isFav,
  onOpenDetails,
  onToggleFav,
}: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Открыть карточку «${item.name}»`}
      className={`relative aspect-video w-full flex items-center justify-center transition-colors overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        inCart ? "bg-primary/10" : item.imageUrl ? "bg-white" : "bg-secondary group-hover:bg-primary/5"
      }`}
      onClick={() => onOpenDetails(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetails(item);
        }
      }}
    >
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          loading="lazy"
          decoding="async"
          width={600}
          height={337}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <Icon
          name={item.icon}
          size={48}
          className={`transition-all group-hover:scale-110 ${
            inCart ? "text-primary" : "text-border group-hover:text-primary/40"
          }`}
        />
      )}

      {/* Затемнение при hover для лучшей видимости плашки «Подробнее» */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Бейджи слева сверху */}
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        {item.isNew && (
          <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
            NEW
          </span>
        )}
        {item.popular && !item.isNew && (
          <span className="bg-yellow-500 text-yellow-950 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
            HIT
          </span>
        )}
        {item.discount && (
          <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
            −{item.discount}%
          </span>
        )}
      </div>

      {/* Избранное справа сверху */}
      <button
        type="button"
        aria-label={isFav ? `Убрать «${item.name}» из избранного` : `Добавить «${item.name}» в избранное`}
        aria-pressed={isFav}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFav(item.id);
        }}
        className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
          isFav
            ? "bg-red-500 text-white shadow"
            : "bg-white/85 text-muted-foreground hover:text-red-500 hover:scale-110"
        }`}
        title={isFav ? "Убрать из избранного" : "В избранное"}
      >
        <Icon name="Heart" size={14} className={isFav ? "fill-current" : ""} />
      </button>

      {/* Размер — крупно слева снизу */}
      <span className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-foreground text-[10px] font-bold font-mono px-2 py-0.5 rounded shadow-sm">
        {item.size}
      </span>

      {/* Hover-плашка «Подробнее» */}
      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-md opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all">
        Подробнее
        <Icon name="ArrowRight" size={11} />
      </span>

      {/* Stock индикатор */}
      {item.inStock === false && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Нет в наличии
          </span>
        </div>
      )}
    </div>
  );
}
