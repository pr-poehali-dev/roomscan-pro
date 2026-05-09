import Icon from "@/components/ui/icon";
import type { FurnitureItem } from "@/lib/furnitureCatalog";

interface Props {
  item: FurnitureItem;
  onClose: () => void;
}

/**
 * Шапка модалки: превью (картинка/иконка), кнопка закрытия, бейджи NEW/HIT/Скидка.
 * Логика 1:1 перенесена из FurnitureDetailsModal.tsx без изменений.
 */
export default function DetailsHero({ item, onClose }: Props) {
  return (
    <div className={`relative aspect-[16/9] flex items-center justify-center overflow-hidden ${
      item.imageUrl ? "bg-white" : "bg-gradient-to-br from-secondary to-primary/5"
    }`}>
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <Icon name={item.icon} size={120} className="text-primary/40" />
      )}

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
  );
}
