import Icon from "@/components/ui/icon";
import {
  TILE_MATERIAL_LABELS,
  TILE_ROOM_LABELS,
  TILE_SURFACE_LABELS,
  type TileMaterial,
  type TileStyle,
  type TileSurface,
  type TileItem,
} from "@/lib/tile-library";

type Room = TileItem["rooms"][number] | "all";

interface Props {
  search: string;
  setSearch: (s: string) => void;
  surface: TileSurface | "all";
  setSurface: (s: TileSurface | "all") => void;
  material: TileMaterial | "all";
  setMaterial: (m: TileMaterial | "all") => void;
  style: TileStyle | "all";
  setStyle: (s: TileStyle | "all") => void;
  room: Room;
  setRoom: (r: Room) => void;
  onlyFav: boolean;
  setOnlyFav: (v: boolean) => void;
  resultsCount: number;
  totalCount: number;
  onReset: () => void;
}

const STYLES: { id: TileStyle | "all"; label: string }[] = [
  { id: "all",        label: "Все стили" },
  { id: "scandi",     label: "Скандинавский" },
  { id: "loft",       label: "Лофт" },
  { id: "classic",    label: "Классика" },
  { id: "minimal",    label: "Минимализм" },
  { id: "modern",     label: "Модерн" },
  { id: "japandi",    label: "Японди" },
  { id: "glamour",    label: "Гламур" },
  { id: "midcentury", label: "Mid-century" },
];

const SURFACES: (TileSurface | "all")[] = ["all", "floor", "wall", "both"];
const MATERIALS: (TileMaterial | "all")[] = [
  "all",
  "porcelain",
  "ceramic",
  "marble",
  "stone",
  "wood-look",
  "concrete",
  "mosaic",
  "brick",
];
const ROOMS: Room[] = ["all", "kitchen", "bath", "living", "bed", "hall", "outdoor"];

/**
 * Панель фильтров каталога плитки: поиск, поверхность (пол/стены),
 * материал, стиль, комната + кнопка «только избранное» и сброс.
 */
export default function TileFilters({
  search,
  setSearch,
  surface,
  setSurface,
  material,
  setMaterial,
  style,
  setStyle,
  room,
  setRoom,
  onlyFav,
  setOnlyFav,
  resultsCount,
  totalCount,
  onReset,
}: Props) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      {/* Поиск */}
      <div className="relative">
        <Icon
          name="Search"
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск: бренд, коллекция, узор, материал…"
          aria-label="Поиск по каталогу плитки"
          className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary"
        />
      </div>

      {/* Чипы: поверхность */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
          Поверхность
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {SURFACES.map((s) => (
            <button
              key={s}
              onClick={() => setSurface(s)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                surface === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-primary/10"
              }`}
            >
              {s === "all" ? "Все" : TILE_SURFACE_LABELS[s as TileSurface]}
            </button>
          ))}
        </div>
      </div>

      {/* Чипы: материал */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
          Материал
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {MATERIALS.map((m) => (
            <button
              key={m}
              onClick={() => setMaterial(m)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                material === m
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-primary/10"
              }`}
            >
              {m === "all" ? "Все" : TILE_MATERIAL_LABELS[m as TileMaterial]}
            </button>
          ))}
        </div>
      </div>

      {/* Чипы: стиль */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
          Стиль
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                style === s.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-primary/10"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Чипы: комната */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
          Помещение
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {ROOMS.map((r) => (
            <button
              key={r}
              onClick={() => setRoom(r)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                room === r
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-primary/10"
              }`}
            >
              {r === "all" ? "Все" : TILE_ROOM_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Нижняя строка: счётчик + избранное + сброс */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border flex-wrap">
        <p className="text-xs text-muted-foreground">
          Найдено{" "}
          <span className="font-bold text-foreground">{resultsCount}</span>
          {" "}из {totalCount}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOnlyFav(!onlyFav)}
            className={`text-[11px] font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              onlyFav
                ? "bg-red-500/10 text-red-500 border border-red-500/30"
                : "bg-secondary text-muted-foreground hover:text-red-500"
            }`}
          >
            <Icon name="Heart" size={12} className={onlyFav ? "fill-current" : ""} />
            {onlyFav ? "Только избранное" : "Только избранное"}
          </button>
          <button
            onClick={onReset}
            className="text-[11px] font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground"
          >
            <Icon name="RotateCcw" size={12} />
            Сбросить
          </button>
        </div>
      </div>
    </div>
  );
}
