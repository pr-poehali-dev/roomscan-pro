import Icon from "@/components/ui/icon";
import type { FurnitureItem } from "@/lib/furnitureCatalog";

interface Props {
  item: FurnitureItem;
  inCart: boolean;
  justAdded: boolean;
  addedToPlan3D?: boolean;
  isFav: boolean;
  onAddToCart: (id: number) => void;
  onAddToPlan3D?: (id: number) => void;
  onToggleFav: (id: number) => void;
  onOpenDetails: (item: FurnitureItem) => void;
  onOpenAR: (item: FurnitureItem) => void;
}

export default function FurnitureCard({
  item,
  inCart,
  justAdded,
  addedToPlan3D,
  isFav,
  onAddToCart,
  onAddToPlan3D,
  onToggleFav,
  onOpenDetails,
  onOpenAR,
}: Props) {
  const palette = item.colorPalette ?? [];

  return (
    <article
      aria-label={`${item.name}, ${item.brand}, ${item.price}`}
      className={`bg-card border rounded-2xl overflow-hidden transition-all group flex flex-col ${
        inCart ? "border-primary/40 shadow-lg shadow-primary/5" : "border-border hover:border-primary/30 hover:shadow-md"
      }`}
    >
      {/* Превью */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Открыть карточку «${item.name}»`}
        className={`relative aspect-video w-full flex items-center justify-center transition-colors overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
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

        {/* Бейджи */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.isNew && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              NEW
            </span>
          )}
          {item.popular && !item.isNew && (
            <span className="bg-yellow-500 text-yellow-950 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              HIT
            </span>
          )}
          {item.discount && (
            <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              −{item.discount}%
            </span>
          )}
        </div>

        {/* Избранное */}
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
              ? "bg-red-500 text-white scale-100"
              : "bg-white/80 text-muted-foreground hover:text-red-500 hover:scale-110"
          }`}
          title={isFav ? "Убрать из избранного" : "В избранное"}
        >
          <Icon name="Heart" size={14} className={isFav ? "fill-current" : ""} />
        </button>

        {/* Stock индикатор */}
        {item.inStock === false && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Нет в наличии
            </span>
          </div>
        )}
      </div>

      {/* Информация */}
      <div className="p-4 flex-1 flex flex-col">
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

        <h3
          className="font-bold text-foreground mb-1 line-clamp-1 m-0"
        >
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

        {/* Цена */}
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
      </div>
    </article>
  );
}