import { useEffect, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { getRelatedItems, type FurnitureItem } from "@/lib/furnitureCatalog";

interface Props {
  item: FurnitureItem;
  inCart: boolean;
  isFav: boolean;
  cartIds?: number[];
  favIds?: number[];
  onClose: () => void;
  onAddToCart: (id: number) => void;
  onToggleFav: (id: number) => void;
  onOpenAR: (item: FurnitureItem) => void;
  onSelectRelated?: (item: FurnitureItem) => void;
}

export default function FurnitureDetailsModal({
  item,
  inCart,
  isFav,
  cartIds = [],
  favIds = [],
  onClose,
  onAddToCart,
  onToggleFav,
  onOpenAR,
  onSelectRelated,
}: Props) {
  const related = useMemo(() => getRelatedItems(item, 4), [item]);

  // Цена комплекта (текущий + рекомендованные)
  const bundlePrice = useMemo(
    () => item.priceNum + related.reduce((s, r) => s + r.priceNum, 0),
    [item, related],
  );
  const bundleDiscount = Math.round(bundlePrice * 0.07); // условно 7% за комплект
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка с превью */}
        <div className="relative bg-gradient-to-br from-secondary to-primary/5 aspect-[16/9] flex items-center justify-center">
          <Icon name={item.icon} size={120} className="text-primary/40" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-card border border-border rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <Icon name="X" size={18} />
          </button>

          <div className="absolute top-4 left-4 flex flex-col gap-1.5">
            {item.isNew && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                Новинка
              </span>
            )}
            {item.popular && (
              <span className="bg-yellow-500 text-yellow-950 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                Хит продаж
              </span>
            )}
            {item.discount && (
              <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                Скидка {item.discount}%
              </span>
            )}
          </div>
        </div>

        {/* Контент */}
        <div className="p-6 lg:p-8">
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

          {/* С ЭТИМ ПОКУПАЮТ */}
          {related.length > 0 && (
            <div className="mb-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">
                    AI-подбор · автоматический
                  </p>
                  <h3 className="text-lg font-black text-foreground">С этим покупают</h3>
                </div>
                <button
                  onClick={() => {
                    if (!cartIds.includes(item.id)) onAddToCart(item.id);
                    related.forEach((r) => {
                      if (!cartIds.includes(r.id) && r.inStock !== false) onAddToCart(r.id);
                    });
                  }}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                >
                  <Icon name="PackagePlus" size={14} />
                  Взять комплект
                  <span className="font-mono opacity-80">
                    −{bundleDiscount.toLocaleString("ru-RU")} ₽
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {related.map((r) => {
                  const inC = cartIds.includes(r.id);
                  const inF = favIds.includes(r.id);
                  return (
                    <div
                      key={r.id}
                      className="group bg-secondary border border-transparent hover:border-primary/30 rounded-xl overflow-hidden transition-all flex flex-col"
                    >
                      <button
                        onClick={() => onSelectRelated?.(r)}
                        className="aspect-square flex items-center justify-center bg-card relative cursor-pointer hover:bg-primary/5 transition-colors"
                      >
                        <Icon
                          name={r.icon}
                          size={32}
                          className="text-primary/50 group-hover:text-primary transition-colors group-hover:scale-110"
                        />
                        {r.popular && (
                          <span className="absolute top-1.5 left-1.5 bg-yellow-500 text-yellow-950 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                            HIT
                          </span>
                        )}
                        {r.discount && (
                          <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                            −{r.discount}%
                          </span>
                        )}
                        {inF && (
                          <Icon
                            name="Heart"
                            size={11}
                            className="absolute top-1.5 right-1.5 text-red-500 fill-current"
                          />
                        )}
                      </button>
                      <div className="p-2.5 flex-1 flex flex-col">
                        <p className="text-[10px] font-mono text-muted-foreground mb-0.5 truncate">
                          {r.brand}
                        </p>
                        <button
                          onClick={() => onSelectRelated?.(r)}
                          className="text-xs font-bold text-foreground mb-1 line-clamp-2 text-left hover:text-primary transition-colors min-h-[2.5em]"
                        >
                          {r.name}
                        </button>
                        {r.rating && (
                          <div className="flex items-center gap-0.5 mb-1.5">
                            <Icon
                              name="Star"
                              size={10}
                              className="text-yellow-500 fill-current"
                            />
                            <span className="text-[10px] font-bold">{r.rating}</span>
                          </div>
                        )}
                        <div className="mt-auto flex items-center justify-between gap-1">
                          <span className="text-xs font-black text-primary font-mono truncate">
                            {r.price}
                          </span>
                          <button
                            onClick={() => onAddToCart(r.id)}
                            disabled={r.inStock === false}
                            className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 ${
                              inC
                                ? "bg-primary/20 text-primary"
                                : "bg-card text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                            }`}
                            title={inC ? "В плане" : "Добавить в план"}
                          >
                            <Icon name={inC ? "Check" : "Plus"} size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
                <Icon name="Sparkles" size={11} className="text-primary" />
                Подобрано автоматически по стилю, цене и совместимости
              </p>
            </div>
          )}

          {/* CTA */}
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
            <div className="flex gap-2">
              <button
                onClick={() => onOpenAR(item)}
                className="px-4 py-3 rounded-xl bg-secondary text-foreground font-bold flex items-center gap-2 hover:bg-primary/10 transition-colors"
              >
                <Icon name="View" size={16} />
                Примерить в AR
              </button>
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
        </div>
      </div>
    </div>
  );
}