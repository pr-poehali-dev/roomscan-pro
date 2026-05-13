import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Icon from "@/components/ui/icon";
import {
  WALL_CATEGORIES, WALL_STYLES, WALL_ROOMS, WALL_TEXTURES, WALL_COLOR_FAMILIES,
  type WallCategory, type WallStyle, type WallItem, type WallTexture, type ColorFamily,
} from "./wallsData";

export interface WallsFilterState {
  query: string;
  category: WallCategory | "all";
  styles: WallStyle[];
  rooms: Array<WallItem["rooms"][number]>;
  textures: WallTexture[];
  colors: ColorFamily[];
  onlyMoisture: boolean;
  onlyPaintable: boolean;
  onlyEco: boolean;
  onlyAcoustic: boolean;
  onlyPremium: boolean;
  onlyFav: boolean;
  sort: "popular" | "asc" | "desc";
}

export const initialWallsFilters: WallsFilterState = {
  query: "", category: "all", styles: [], rooms: [], textures: [], colors: [],
  onlyMoisture: false, onlyPaintable: false, onlyEco: false,
  onlyAcoustic: false, onlyPremium: false, onlyFav: false,
  sort: "popular",
};

interface Props {
  state: WallsFilterState;
  setState: (s: WallsFilterState) => void;
  favCount: number;
}

export default function WallsFilters({ state, setState, favCount }: Props) {
  const toggleStyle = (id: WallStyle) =>
    setState({
      ...state,
      styles: state.styles.includes(id) ? state.styles.filter((s) => s !== id) : [...state.styles, id],
    });

  const toggleRoom = (id: WallItem["rooms"][number]) =>
    setState({
      ...state,
      rooms: state.rooms.includes(id) ? state.rooms.filter((s) => s !== id) : [...state.rooms, id],
    });

  const toggleTexture = (id: WallTexture) =>
    setState({
      ...state,
      textures: state.textures.includes(id) ? state.textures.filter((s) => s !== id) : [...state.textures, id],
    });

  const toggleColor = (id: ColorFamily) =>
    setState({
      ...state,
      colors: state.colors.includes(id) ? state.colors.filter((s) => s !== id) : [...state.colors, id],
    });

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2 block">
            Поиск
          </Label>
          <div className="relative">
            <Icon name="Search" size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={state.query}
              onChange={(e) => setState({ ...state, query: e.target.value })}
              placeholder="Бренд, коллекция, тег"
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2 block">
            Категория
          </Label>
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant={state.category === "all" ? "default" : "outline"}
              onClick={() => setState({ ...state, category: "all" })}
            >
              Все
            </Button>
            {WALL_CATEGORIES.map((c) => (
              <Button
                key={c.id}
                size="sm"
                variant={state.category === c.id ? "default" : "outline"}
                onClick={() => setState({ ...state, category: c.id })}
              >
                <Icon name={c.icon} size={14} className="mr-1.5" />
                {c.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2 block">
            Стиль
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {WALL_STYLES.map((s) => (
              <Button
                key={s.id}
                size="sm"
                variant={state.styles.includes(s.id) ? "default" : "outline"}
                onClick={() => toggleStyle(s.id)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2 block">
            Помещение
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {WALL_ROOMS.map((r) => (
              <Button
                key={r.id}
                size="sm"
                variant={state.rooms.includes(r.id) ? "default" : "outline"}
                onClick={() => toggleRoom(r.id)}
              >
                <Icon name={r.icon} size={14} className="mr-1.5" />
                {r.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2 block">
            Цвет
          </Label>
          <div className="grid grid-cols-7 gap-1.5">
            {WALL_COLOR_FAMILIES.map((c) => {
              const active = state.colors.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleColor(c.id)}
                  title={c.label}
                  className={`w-full aspect-square rounded-md border-2 transition-all ${
                    active ? "border-primary scale-105 shadow-md" : "border-border hover:border-primary/50"
                  }`}
                  style={{ backgroundColor: c.sample }}
                  aria-label={c.label}
                  aria-pressed={active}
                />
              );
            })}
          </div>
          {state.colors.length > 0 && (
            <div className="text-[11px] text-muted-foreground mt-1.5">
              {state.colors.map((id) => WALL_COLOR_FAMILIES.find((c) => c.id === id)?.label).join(", ")}
            </div>
          )}
        </div>

        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2 block">
            Фактура
          </Label>
          <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
            {WALL_TEXTURES.map((t) => (
              <Button
                key={t.id}
                size="sm"
                variant={state.textures.includes(t.id) ? "default" : "outline"}
                onClick={() => toggleTexture(t.id)}
              >
                <Icon name={t.icon} size={12} className="mr-1" />
                {t.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <Toggle
            checked={state.onlyMoisture}
            onChange={(v) => setState({ ...state, onlyMoisture: v })}
            label="Влагостойкие"
          />
          <Toggle
            checked={state.onlyPaintable}
            onChange={(v) => setState({ ...state, onlyPaintable: v })}
            label="Под покраску"
          />
          <Toggle
            checked={state.onlyEco}
            onChange={(v) => setState({ ...state, onlyEco: v })}
            label="Эко-материалы"
          />
          <Toggle
            checked={state.onlyAcoustic}
            onChange={(v) => setState({ ...state, onlyAcoustic: v })}
            label="Шумопоглощение"
          />
          <Toggle
            checked={state.onlyPremium}
            onChange={(v) => setState({ ...state, onlyPremium: v })}
            label="Премиум"
          />
          <Toggle
            checked={state.onlyFav}
            onChange={(v) => setState({ ...state, onlyFav: v })}
            label={`Только избранное (${favCount})`}
          />
        </div>

        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-2 block">
            Сортировка
          </Label>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant={state.sort === "popular" ? "default" : "outline"}
              onClick={() => setState({ ...state, sort: "popular" })}
              className="flex-1"
            >
              Популярные
            </Button>
            <Button
              size="sm"
              variant={state.sort === "asc" ? "default" : "outline"}
              onClick={() => setState({ ...state, sort: "asc" })}
              className="flex-1"
            >
              Дешевле
            </Button>
            <Button
              size="sm"
              variant={state.sort === "desc" ? "default" : "outline"}
              onClick={() => setState({ ...state, sort: "desc" })}
              className="flex-1"
            >
              Дороже
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Toggle({
  checked, onChange, label,
}: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} />
      <span className="text-sm">{label}</span>
    </label>
  );
}