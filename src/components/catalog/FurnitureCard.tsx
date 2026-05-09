import type { FurnitureItem } from "@/lib/furnitureCatalog";
import FurnitureCardPreview from "./FurnitureCardPreview";
import FurnitureCardInfo from "./FurnitureCardInfo";
import FurnitureCardActions from "./FurnitureCardActions";

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

/**
 * Карточка товара в каталоге. Композиция трёх child-компонентов:
 *  - FurnitureCardPreview — изображение/иконка + бейджи + избранное + stock
 *  - FurnitureCardInfo    — бренд, рейтинг, имя, размер, цвета
 *  - FurnitureCardActions — цена + кнопки 3D / AR / В план
 *
 * Логика и поведение 1:1 совпадают с прежней монолитной версией.
 */
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
  return (
    <article
      aria-label={`${item.name}, ${item.brand}, ${item.price}`}
      className={`bg-card border rounded-2xl overflow-hidden transition-all group flex flex-col ${
        inCart ? "border-primary/40 shadow-lg shadow-primary/5" : "border-border hover:border-primary/30 hover:shadow-md"
      }`}
    >
      <FurnitureCardPreview
        item={item}
        inCart={inCart}
        isFav={isFav}
        onOpenDetails={onOpenDetails}
        onToggleFav={onToggleFav}
      />

      <div className="p-4 flex-1 flex flex-col">
        <FurnitureCardInfo item={item} onOpenDetails={onOpenDetails} />

        <FurnitureCardActions
          item={item}
          inCart={inCart}
          justAdded={justAdded}
          addedToPlan3D={addedToPlan3D}
          onAddToCart={onAddToCart}
          onAddToPlan3D={onAddToPlan3D}
          onOpenAR={onOpenAR}
        />
      </div>
    </article>
  );
}
