import { useEffect, useMemo, useRef } from "react";
import { getRelatedItems, type FurnitureItem } from "@/lib/furnitureCatalog";
import DetailsHero from "./details/DetailsHero";
import DetailsInfoBlock from "./details/DetailsInfoBlock";
import DetailsRelated from "./details/DetailsRelated";
import DetailsCTA from "./details/DetailsCTA";

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
  onTryOnRoom?: (item: FurnitureItem) => void;
  onSelectRelated?: (item: FurnitureItem) => void;
}

/**
 * Модалка карточки товара. Композиция четырёх child-компонентов:
 *  - DetailsHero       — превью + бейджи + закрытие
 *  - DetailsInfoBlock  — заголовок, рейтинг, описание, цвета, характеристики
 *  - DetailsRelated    — «С этим покупают» (AI-подбор + комплект)
 *  - DetailsCTA        — цена + кнопки AR / В план
 *
 * Логика и поведение 1:1 совпадают с прежней монолитной версией.
 */
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
  onTryOnRoom,
  onSelectRelated,
}: Props) {
  const related = useMemo(() => {
    try {
      return getRelatedItems(item, 4);
    } catch {
      return [];
    }
  }, [item]);

  // Цена комплекта (текущий + рекомендованные) — с защитой от undefined
  const bundlePrice = useMemo(
    () =>
      (item.priceNum ?? 0) +
      related.reduce((s, r) => s + (r.priceNum ?? 0), 0),
    [item, related],
  );
  const bundleDiscount = Math.round(bundlePrice * 0.07); // условно 7% за комплект

  // Стабильный ref на onClose — чтобы не пересоздавать listener при каждом
  // ререндере родителя (иначе body.overflow дёргается и экран мерцает).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <DetailsHero item={item} onClose={onClose} />

        <div className="p-6 lg:p-8">
          <DetailsInfoBlock
            item={item}
            isFav={isFav}
            onToggleFav={onToggleFav}
          />

          <DetailsRelated
            item={item}
            related={related}
            cartIds={cartIds}
            favIds={favIds}
            bundleDiscount={bundleDiscount}
            onAddToCart={onAddToCart}
            onSelectRelated={onSelectRelated}
          />

          <DetailsCTA
            item={item}
            inCart={inCart}
            onAddToCart={onAddToCart}
            onOpenAR={onOpenAR}
            onTryOnRoom={onTryOnRoom}
          />
        </div>
      </div>
    </div>
  );
}