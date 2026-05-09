import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import FurnitureCard from "@/components/catalog/FurnitureCard";
import type { FurnitureItem } from "@/lib/furnitureCatalog";

interface Props {
  items: FurnitureItem[];
  cart: number[];
  added: number | null;
  planAdded: number | null;
  favorites: number[];

  addToCart: (id: number) => void;
  addToPlan3D: (id: number) => void;
  onToggleFav: (id: number) => void;
  onOpenDetails: (item: FurnitureItem) => void;
  onOpenAR: (item: FurnitureItem) => void;
  onTryOnRoom?: (item: FurnitureItem) => void;
}

/** Высота одной строки сетки (карточка ~ 360px + gap 16px). Используется для оценки. */
const ROW_HEIGHT = 376;
/** Сколько строк рендерим вне видимой области (буфер для плавного скролла) */
const OVERSCAN_ROWS = 2;
/** Минимум карточек для активации виртуализации */
const VIRTUALIZE_THRESHOLD = 24;

function getColumns(width: number): number {
  if (width >= 1024) return 3; // lg
  if (width >= 640) return 2;  // sm
  return 1;
}

/**
 * Виртуализированная сетка карточек мебели.
 * Рендерит только те ряды, что попадают в viewport (+OVERSCAN_ROWS сверху/снизу).
 * При количестве товаров < VIRTUALIZE_THRESHOLD рендерит обычную grid (накладные расходы
 * виртуализации не оправданы).
 */
export default function VirtualFurnitureGrid({
  items,
  cart,
  added,
  planAdded,
  favorites,
  addToCart,
  addToPlan3D,
  onToggleFav,
  onOpenDetails,
  onOpenAR,
  onTryOnRoom,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState<number>(() =>
    typeof window === "undefined" ? 3 : getColumns(window.innerWidth),
  );

  // Видимый диапазон строк
  const [range, setRange] = useState<{ start: number; end: number }>({ start: 0, end: 12 });

  // Если мало карточек — рендерим обычную grid без виртуализации.
  const useVirtualization = items.length >= VIRTUALIZE_THRESHOLD;

  /* ────── Подписка на ресайз для пересчёта количества колонок ────── */
  useEffect(() => {
    const onResize = () => setColumns(getColumns(window.innerWidth));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const totalRows = Math.ceil(items.length / columns);
  const totalHeight = totalRows * ROW_HEIGHT;

  /* ────── Пересчёт видимого диапазона ────── */
  const computeRange = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportH = window.innerHeight;

    // Сколько от верха контейнера уже скрыто за viewport (может быть отрицательным)
    const scrolledPast = -rect.top;
    const visibleStart = Math.max(0, Math.floor(scrolledPast / ROW_HEIGHT));
    const visibleEnd = Math.ceil((scrolledPast + viewportH) / ROW_HEIGHT);

    const start = Math.max(0, visibleStart - OVERSCAN_ROWS);
    const end = Math.min(totalRows, visibleEnd + OVERSCAN_ROWS);

    setRange((prev) =>
      prev.start === start && prev.end === end ? prev : { start, end },
    );
  };

  useLayoutEffect(() => {
    if (!useVirtualization) return;
    computeRange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, columns, useVirtualization]);

  useEffect(() => {
    if (!useVirtualization) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(computeRange);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useVirtualization, totalRows, columns]);

  /* ────── Подмножество карточек для рендера ────── */
  const visibleItems = useMemo(() => {
    if (!useVirtualization) return items;
    const startIdx = range.start * columns;
    const endIdx = Math.min(items.length, range.end * columns);
    return items.slice(startIdx, endIdx);
  }, [items, range, columns, useVirtualization]);

  const offsetTop = useVirtualization ? range.start * ROW_HEIGHT : 0;

  /* ────── РЕНДЕР ────── */

  if (!useVirtualization) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <FurnitureCard
            key={item.id}
            item={item}
            inCart={cart.includes(item.id)}
            justAdded={added === item.id}
            addedToPlan3D={planAdded === item.id}
            isFav={favorites.includes(item.id)}
            onAddToCart={addToCart}
            onAddToPlan3D={addToPlan3D}
            onToggleFav={onToggleFav}
            onOpenDetails={onOpenDetails}
            onOpenAR={onOpenAR}
            onTryOnRoom={onTryOnRoom}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ height: totalHeight, position: "relative" }}
    >
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        style={{
          position: "absolute",
          top: offsetTop,
          left: 0,
          right: 0,
        }}
      >
        {visibleItems.map((item) => (
          <FurnitureCard
            key={item.id}
            item={item}
            inCart={cart.includes(item.id)}
            justAdded={added === item.id}
            addedToPlan3D={planAdded === item.id}
            isFav={favorites.includes(item.id)}
            onAddToCart={addToCart}
            onAddToPlan3D={addToPlan3D}
            onToggleFav={onToggleFav}
            onOpenDetails={onOpenDetails}
            onOpenAR={onOpenAR}
            onTryOnRoom={onTryOnRoom}
          />
        ))}
      </div>
    </div>
  );
}
