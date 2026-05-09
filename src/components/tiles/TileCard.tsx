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
  onOpen: (tile: TileItem) => void;
  onToggleFav: (id: string) => void;
}

const STYLE_LABELS: Record<string, string> = {
  scandi:     "Сканди",
  loft:       "Лофт",
  classic:    "Классика",
  minimal:    "Минимализм",
  modern:     "Модерн",
  japandi:    "Японди",
  glamour:    "Гламур",
  midcentury: "Mid-century",
};

const ROOM_ICONS: Record<TileItem["rooms"][number], string> = {
  kitchen: "ChefHat",
  bath:    "Bath",
  living:  "Sofa",
  bed:     "Bed",
  hall:    "DoorOpen",
  outdoor: "Trees",
};

/**
 * Карточка плитки в каталоге: превью образца, бейджи (хит, поверхность),
 * бренд + коллекция, размер, материал, стиль, иконки помещений и цена за м².
 * По клику или Enter/Space открывается модалка с деталями.
 */
export default function TileCard({ tile, isFav, onOpen, onToggleFav }: Props) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("button, a, input")) return;
        onOpen(tile);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          const target = e.target as HTMLElement;
          if (target.closest("button, a, input")) return;
          e.preventDefault();
          onOpen(tile);
        }
      }}
      className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 flex flex-col"
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

        {/* Затемнение при hover для лучшей видимости стрелки */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {/* Бейджи слева сверху */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {tile.popular && (
            <span className="bg-yellow-500 text-yellow-950 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
              Хит
            </span>
          )}
          <span className="bg-black/60 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded backdrop-blur-sm">
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
              ? "bg-red-500 text-white shadow"
              : "bg-white/85 text-muted-foreground hover:text-red-500 hover:scale-110"
          }`}
        >
          <Icon name="Heart" size={14} className={isFav ? "fill-current" : ""} />
        </button>

        {/* Стрелка «Подробнее» — появляется при hover */}
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-md opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all">
          Подробнее
          <Icon name="ArrowRight" size={11} />
        </span>

        {/* Размер — крупно в нижнем-левом углу превью */}
        <span className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-foreground text-[10px] font-bold font-mono px-2 py-0.5 rounded shadow-sm">
          {tile.size[0]}×{tile.size[1]} см
        </span>
      </div>

      <div className="p-3 flex flex-col flex-1">
        {/* Бренд + коллекция */}
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground truncate">
          {tile.brand}
          {tile.collection && ` · ${tile.collection}`}
        </p>

        {/* Название */}
        <h3 className="text-sm font-bold text-foreground truncate mt-0.5 group-hover:text-primary transition-colors">
          {tile.name}
        </h3>

        {/* Материал + Стиль */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <span className="text-[10px] font-bold bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
            {TILE_MATERIAL_LABELS[tile.material]}
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded">
            {STYLE_LABELS[tile.style] ?? tile.style}
          </span>
        </div>

        {/* Помещения — мини-иконки */}
        {tile.rooms.length > 0 && (
          <div className="flex items-center gap-1 mt-2">
            {tile.rooms.slice(0, 5).map((r) => (
              <span
                key={r}
                title={TILE_ROOM_LABELS[r]}
                className="w-5 h-5 rounded bg-secondary/70 text-muted-foreground flex items-center justify-center"
              >
                <Icon name={ROOM_ICONS[r]} size={10} />
              </span>
            ))}
            {tile.rooms.length > 5 && (
              <span className="text-[10px] font-mono text-muted-foreground">
                +{tile.rooms.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Цена и акцентный цвет */}
        <div className="flex items-end justify-between mt-3 pt-2 border-t border-border/60 gap-2 mt-auto">
          <div>
            <p className="text-[9px] font-mono uppercase text-muted-foreground tracking-wider leading-none mb-0.5">
              Цена за м²
            </p>
            <p className="text-base font-black text-primary font-mono leading-none">
              {formatTilePrice(tile.pricePerM2)}
            </p>
          </div>
          <span
            className="w-6 h-6 rounded-full border-2 border-border shrink-0 shadow-inner"
            style={{ background: tile.accent }}
            aria-hidden="true"
            title="Акцентный цвет"
          />
        </div>
      </div>
    </article>
  );
}