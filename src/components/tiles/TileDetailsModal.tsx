import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  TILE_MATERIAL_LABELS,
  TILE_ROOM_LABELS,
  TILE_SURFACE_LABELS,
  formatTilePrice,
  type TileItem,
} from "@/lib/tile-library";

interface Props {
  tile: TileItem;
  isFav: boolean;
  onClose: () => void;
  onToggleFav: (id: string) => void;
  onAddToCatalogPlanner?: (tile: TileItem) => void;
}

const STYLE_LABELS: Record<string, string> = {
  scandi:     "Скандинавский",
  loft:       "Лофт",
  classic:    "Классика",
  minimal:    "Минимализм",
  modern:     "Модерн",
  japandi:    "Японди",
  glamour:    "Гламур",
  midcentury: "Mid-century",
};

/**
 * Модалка карточки плитки. Показывает полное превью, описание, характеристики,
 * калькулятор стоимости (м² × цена + 10% запас), бюджет на комнату.
 * Закрывается по Esc и клику на бэкдроп.
 */
export default function TileDetailsModal({
  tile,
  isFav,
  onClose,
  onToggleFav,
  onAddToCatalogPlanner,
}: Props) {
  const [area, setArea] = useState<string>("10");

  const m2 = Math.max(0, parseFloat(area.replace(",", ".")) || 0);
  // Запас 10% на подрезку — стандарт у плиточников
  const m2WithSpare = useMemo(() => Math.ceil(m2 * 1.1 * 10) / 10, [m2]);
  const totalCost = useMemo(
    () => Math.round(m2WithSpare * tile.pricePerM2),
    [m2WithSpare, tile.pricePerM2],
  );

  // Стабильный ref на onClose — listener вешается один раз.
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
        {/* Шапка с превью */}
        <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
          <img
            src={tile.preview}
            alt={`${tile.name} — крупное превью`}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-card border border-border rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
            aria-label="Закрыть"
          >
            <Icon name="X" size={18} />
          </button>
          <div className="absolute top-4 left-4 flex flex-col gap-1.5">
            {tile.popular && (
              <span className="bg-yellow-500 text-yellow-950 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                Хит продаж
              </span>
            )}
            <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
              {TILE_SURFACE_LABELS[tile.surface]}
            </span>
          </div>
        </div>

        <div className="p-6 lg:p-8">
          {/* Заголовок + избранное */}
          <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
                {tile.brand}
                {tile.collection && ` · коллекция ${tile.collection}`}
              </p>
              <h2 className="text-2xl lg:text-3xl font-black text-foreground mb-2">
                {tile.name}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-secondary text-xs font-bold px-2.5 py-1 rounded-full">
                  {TILE_MATERIAL_LABELS[tile.material]}
                </span>
                <span className="bg-secondary text-xs font-bold px-2.5 py-1 rounded-full">
                  {STYLE_LABELS[tile.style] ?? tile.style}
                </span>
                <span className="bg-secondary text-xs font-mono px-2.5 py-1 rounded-full">
                  {tile.size[0]}×{tile.size[1]} см
                </span>
              </div>
            </div>

            <button
              onClick={() => onToggleFav(tile.id)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isFav
                  ? "bg-red-500 text-white"
                  : "bg-secondary text-muted-foreground hover:text-red-500"
              }`}
              aria-label={isFav ? "Убрать из избранного" : "В избранное"}
              aria-pressed={isFav}
            >
              <Icon name="Heart" size={18} className={isFav ? "fill-current" : ""} />
            </button>
          </div>

          {/* Описание */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {tile.description}
          </p>

          {/* Характеристики */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-secondary rounded-xl p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                Размер
              </p>
              <p className="text-sm font-bold text-foreground">
                {tile.size[0]}×{tile.size[1]} см
              </p>
            </div>
            <div className="bg-secondary rounded-xl p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                Материал
              </p>
              <p className="text-sm font-bold text-foreground">
                {TILE_MATERIAL_LABELS[tile.material]}
              </p>
            </div>
            <div className="bg-secondary rounded-xl p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                Цена
              </p>
              <p className="text-sm font-bold text-primary">
                {formatTilePrice(tile.pricePerM2)}
              </p>
            </div>
          </div>

          {/* Применение по комнатам */}
          <div className="mb-6">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Подходит для помещений
            </p>
            <div className="flex flex-wrap gap-2">
              {tile.rooms.map((r) => (
                <span
                  key={r}
                  className="bg-secondary border border-border text-xs font-semibold px-2.5 py-1 rounded-lg"
                >
                  {TILE_ROOM_LABELS[r]}
                </span>
              ))}
            </div>
          </div>

          {/* Калькулятор */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-xl p-4 mb-6">
            <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3 flex items-center gap-1.5">
              <Icon name="Calculator" size={12} />
              Калькулятор стоимости
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="tile-area" className="text-[11px] text-muted-foreground block mb-1">
                  Площадь, м²
                </label>
                <input
                  id="tile-area"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.1}
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">С запасом 10%</p>
                <p className="text-sm font-bold text-foreground py-2">
                  {m2WithSpare} м²
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">Итог</p>
                <p className="text-xl font-black text-primary font-mono leading-none py-1">
                  {totalCost.toLocaleString("ru-RU")} ₽
                </p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Цена ориентировочная: уточняйте у поставщика — она зависит от партии и наличия.
            </p>
          </div>

          {/* Теги */}
          {tile.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {tile.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-mono text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="flex items-center justify-between gap-3 pt-6 border-t border-border flex-wrap">
            <p className="text-3xl font-black text-primary font-mono">
              {formatTilePrice(tile.pricePerM2)}
            </p>
            {onAddToCatalogPlanner ? (
              <button
                onClick={() => onAddToCatalogPlanner(tile)}
                className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Icon name="LayoutGrid" size={16} />
                Применить в планировщике
              </button>
            ) : (
              <a
                href="#planner"
                onClick={onClose}
                className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Icon name="LayoutGrid" size={16} />
                Открыть планировщик
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}