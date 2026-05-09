import type { MouseEvent, KeyboardEvent } from "react";
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
  onTryOnRoom?: (item: FurnitureItem) => void;
}

/**
 * Карточка товара в каталоге.
 *
 * Вся карточка кликабельна — клик в любое место (кроме интерактивных кнопок)
 * открывает модалку деталей. Это гарантирует, что пользователь не упустит
 * возможность открыть деталку из-за неудачного попадания.
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
  onTryOnRoom,
}: Props) {
  // Клик по карточке открывает модалку, кроме случаев когда клик прошёл
  // по дочерней кнопке/ссылке (избранное, корзина, AR и т.п.).
  const handleCardClick = (e: MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, [data-no-open]")) return;
    onOpenDetails(item);
  };

  const handleCardKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      const target = e.target as HTMLElement;
      if (target.closest("button, a, input")) return;
      e.preventDefault();
      onOpenDetails(item);
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Открыть карточку «${item.name}», ${item.brand}, ${item.price}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKey}
      className={`bg-card border rounded-2xl overflow-hidden transition-all group flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        inCart
          ? "border-primary/50 shadow-lg shadow-primary/10"
          : "border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5"
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
          onTryOnRoom={onTryOnRoom}
        />
      </div>
    </article>
  );
}
