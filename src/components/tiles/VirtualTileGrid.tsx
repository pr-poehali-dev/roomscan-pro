import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import TileCard from "@/components/tiles/TileCard";
import type { TileItem } from "@/lib/tile-library";

interface Props {
  items: TileItem[];
  favorites: string[];
  onOpen: (tile: TileItem) => void;
  onToggleFav: (id: string) => void;
}

/** Высота строки сетки плитки (карточка ~ 320px + gap 12px) */
const ROW_HEIGHT = 332;
/** Сколько строк рендерим вне видимой области */
const OVERSCAN_ROWS = 2;
/** Минимум карточек для активации виртуализации */
const VIRTUALIZE_THRESHOLD = 24;

function getColumns(width: number): number {
  if (width >= 1280) return 4; // xl
  if (width >= 768) return 3;  // md
  return 2;                    // mobile
}

/**
 * Виртуализированная сетка карточек плитки.
 * При количестве товаров < VIRTUALIZE_THRESHOLD рендерит обычную grid.
 * Иначе — только видимые ряды + OVERSCAN_ROWS буфера сверху и снизу.
 */
export default function VirtualTileGrid({
  items,
  favorites,
  onOpen,
  onToggleFav,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState<number>(() =>
    typeof window === "undefined" ? 4 : getColumns(window.innerWidth),
  );
  const [range, setRange] = useState<{ start: number; end: number }>({ start: 0, end: 12 });

  const useVirtualization = items.length >= VIRTUALIZE_THRESHOLD;

  useEffect(() => {
    const onResize = () => setColumns(getColumns(window.innerWidth));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const totalRows = Math.ceil(items.length / columns);
  const totalHeight = totalRows * ROW_HEIGHT;

  const computeRange = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportH = window.innerHeight;

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

  const visibleItems = useMemo(() => {
    if (!useVirtualization) return items;
    const startIdx = range.start * columns;
    const endIdx = Math.min(items.length, range.end * columns);
    return items.slice(startIdx, endIdx);
  }, [items, range, columns, useVirtualization]);

  const offsetTop = useVirtualization ? range.start * ROW_HEIGHT : 0;

  if (!useVirtualization) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {items.map((tile) => (
          <TileCard
            key={tile.id}
            tile={tile}
            isFav={favorites.includes(tile.id)}
            onOpen={onOpen}
            onToggleFav={onToggleFav}
          />
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ height: totalHeight, position: "relative" }}>
      <div
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3"
        style={{
          position: "absolute",
          top: offsetTop,
          left: 0,
          right: 0,
        }}
      >
        {visibleItems.map((tile) => (
          <TileCard
            key={tile.id}
            tile={tile}
            isFav={favorites.includes(tile.id)}
            onOpen={onOpen}
            onToggleFav={onToggleFav}
          />
        ))}
      </div>
    </div>
  );
}
