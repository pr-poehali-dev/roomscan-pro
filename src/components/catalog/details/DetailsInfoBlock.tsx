import Icon from "@/components/ui/icon";
import type { FurnitureItem } from "@/lib/furnitureCatalog";

interface Props {
  item: FurnitureItem;
  isFav: boolean;
  onToggleFav: (id: number) => void;
}

/**
 * Информационный блок: бренд+категория, заголовок, рейтинг,
 * кнопка избранного, описание, цвета, сетка характеристик.
 * Логика 1:1 перенесена из FurnitureDetailsModal.tsx без изменений.
 */
export default function DetailsInfoBlock({ item, isFav, onToggleFav }: Props) {
  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
            {item.brand} · {item.category}
          </p>
          <h2 className="text-2xl lg:text-3xl font-black text-foreground mb-2">
            {item.name}
          </h2>
          {item.rating && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Icon
                    key={n}
                    name="Star"
                    size={14}
                    className={
                      n <= Math.round(item.rating!)
                        ? "text-yellow-500 fill-current"
                        : "text-border"
                    }
                  />
                ))}
              </div>
              <span className="text-sm font-bold">{item.rating}</span>
              {item.reviews && (
                <span className="text-sm text-muted-foreground">
                  · {item.reviews} отзывов
                </span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => onToggleFav(item.id)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            isFav
              ? "bg-red-500 text-white"
              : "bg-secondary text-muted-foreground hover:text-red-500"
          }`}
        >
          <Icon name="Heart" size={18} className={isFav ? "fill-current" : ""} />
        </button>
      </div>

      {/* Описание */}
      {item.description && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          {item.description}
        </p>
      )}

      {/* Цвета */}
      {item.colorPalette && item.colorPalette.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Доступные цвета
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {item.colorPalette.map((hex, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5"
              >
                <span
                  className="w-4 h-4 rounded-full border border-border"
                  style={{ backgroundColor: hex }}
                />
                <span className="text-xs font-semibold text-foreground">
                  {item.colors?.[i] ?? "Цвет"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Характеристики */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-secondary rounded-xl p-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
            Размеры
          </p>
          <p className="text-sm font-bold text-foreground">
            {item.w}×{item.d}×{item.h} см
          </p>
        </div>
        {item.material && (
          <div className="bg-secondary rounded-xl p-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
              Материал
            </p>
            <p className="text-sm font-bold text-foreground">{item.material}</p>
          </div>
        )}
        {item.deliveryDays !== undefined && (
          <div className="bg-secondary rounded-xl p-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
              Доставка
            </p>
            <p className="text-sm font-bold text-foreground">
              {item.deliveryDays === 0
                ? "Сегодня"
                : `${item.deliveryDays} ${item.deliveryDays === 1 ? "день" : item.deliveryDays < 5 ? "дня" : "дней"}`}
            </p>
          </div>
        )}
        {item.warrantyMonths !== undefined && item.warrantyMonths > 0 && (
          <div className="bg-secondary rounded-xl p-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
              Гарантия
            </p>
            <p className="text-sm font-bold text-foreground">
              {item.warrantyMonths} мес.
            </p>
          </div>
        )}
        <div className="bg-secondary rounded-xl p-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
            Наличие
          </p>
          <p
            className={`text-sm font-bold ${
              item.inStock === false ? "text-red-500" : "text-primary"
            }`}
          >
            {item.inStock === false ? "Нет на складе" : "В наличии"}
          </p>
        </div>
      </div>
    </>
  );
}
