import Icon from "@/components/ui/icon";
import {
  TILE_MATERIAL_LABELS,
  TILE_SURFACE_LABELS,
  formatTilePrice,
  type TileItem,
} from "@/lib/tile-library";

interface Props {
  tile: TileItem;
  isFav: boolean;
  onOpen: (tile: TileItem) => void;
  onToggleFav: (id: string) => void;
}

/**
 * Карточка плитки в каталоге: превью образца, бейдж популярности,
 * краткие характеристики (бренд, размер, материал) и цена за м².
 * По клику открывается модалка с деталями.
 */
export default function TileCard({ tile, isFav, onOpen, onToggleFav }: Props) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(tile)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(tile);
        }
      }}
      className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`Открыть карточку плитки «${tile.name}»`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={tile.preview}
          alt={`${tile.name} — образец плитки ${tile.brand}`}
          loading="lazy"
          decoding="async"
          width={600}
          height={450}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Бейджи слева сверху */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {tile.popular && (
            <span className="bg-yellow-500 text-yellow-950 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              Хит
            </span>
          )}
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white"
            style={{ background: "rgba(0,0,0,0.55)" }}
          >
            {TILE_SURFACE_LABELS[tile.surface]}
          </span>
        </div>

        {/* Избранное справа сверху */}
        <button
          type="button"
          aria-label={isFav ? `Убрать «${tile.name}» из избранного` : `В избранное «${tile.name}»`}
          aria-pressed={isFav}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav(tile.id);
          }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${
            isFav
              ? "bg-red-500 text-white"
              : "bg-white/80 text-muted-foreground hover:text-red-500 hover:scale-110"
          }`}
        >
          <Icon name="Heart" size={14} className={isFav ? "fill-current" : ""} />
        </button>
      </div>

      <div className="p-3">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground truncate">
          {tile.brand}
          {tile.collection && ` · ${tile.collection}`}
        </p>
        <h3 className="text-sm font-bold text-foreground truncate mt-0.5">{tile.name}</h3>

        <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
          <span className="font-mono">
            {tile.size[0]}×{tile.size[1]} см
          </span>
          <span className="opacity-50">·</span>
          <span className="truncate">{TILE_MATERIAL_LABELS[tile.material]}</span>
        </div>

        <div className="flex items-end justify-between mt-3 gap-2">
          <p className="text-base font-black text-primary font-mono leading-none">
            {formatTilePrice(tile.pricePerM2)}
          </p>
          <span
            className="w-5 h-5 rounded-full border border-border shrink-0"
            style={{ background: tile.accent }}
            aria-hidden="true"
            title="Акцентный цвет"
          />
        </div>
      </div>
    </article>
  );
}
