import Icon from "@/components/ui/icon";
import type { FurnitureItem } from "@/lib/furnitureCatalog";

interface Props {
  item: FurnitureItem;
  related: FurnitureItem[];
  cartIds: number[];
  favIds: number[];
  bundleDiscount: number;
  onAddToCart: (id: number) => void;
  onSelectRelated?: (item: FurnitureItem) => void;
}

/**
 * Блок «С этим покупают»: AI-подбор + кнопка «Взять комплект» +
 * сетка карточек похожих товаров.
 * Логика 1:1 перенесена из FurnitureDetailsModal.tsx без изменений.
 */
export default function DetailsRelated({
  item,
  related,
  cartIds,
  favIds,
  bundleDiscount,
  onAddToCart,
  onSelectRelated,
}: Props) {
  if (related.length === 0) return null;

  return (
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
  );
}
