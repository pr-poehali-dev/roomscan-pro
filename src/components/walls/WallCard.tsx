import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import type { WallItem } from "./wallsData";
import { WALL_CATEGORIES, WALL_TEXTURES } from "./wallsData";
import { textureBackground } from "./texturePattern";

interface Props {
  item: WallItem;
  wallsAreaNet: number | null;   // м² стен из скана (или null)
  isFav: boolean;
  isApplied: boolean;            // применено ли это покрытие в планировщике
  onToggleFav: (id: string) => void;
  onAdd: (item: WallItem, qty: number) => void;
  onApply: (item: WallItem) => void;
}

/**
 * Карточка покрытия. Сама считает нужное количество единиц
 * (рулонов / банок краски / м²) из площади стен последнего скана.
 */
export default function WallCard({ item, wallsAreaNet, isFav, isApplied, onToggleFav, onAdd, onApply }: Props) {
  const cat = WALL_CATEGORIES.find((c) => c.id === item.category);
  const needQty = wallsAreaNet ? Math.ceil(wallsAreaNet / item.coveragePerUnit) : null;
  const total = needQty ? needQty * item.pricePerUnit : null;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5 group flex flex-col">
      <div
        className="relative h-36 w-full"
        style={{ backgroundColor: item.color }}
      >
        {/* Имитация фактуры поверх цвета */}
        <div
          className="absolute inset-0"
          style={{ backgroundImage: textureBackground(item.textures, item.color) }}
        />
        {/* Бейджи: ХИТ / премиум / категория */}
        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap max-w-[75%]">
          {item.hit && (
            <Badge className="bg-primary text-primary-foreground border-0 shadow-sm">ХИТ</Badge>
          )}
          {item.premium && (
            <Badge className="bg-amber-500/95 text-white border-0 shadow-sm">
              <Icon name="Crown" size={11} className="mr-1" />
              Премиум
            </Badge>
          )}
          {cat && (
            <Badge variant="secondary" className="shadow-sm">
              <Icon name={cat.icon} size={12} className="mr-1" />
              {cat.label}
            </Badge>
          )}
        </div>
        <button
          onClick={() => onToggleFav(item.id)}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
          aria-label="В избранное"
        >
          <Icon
            name="Heart"
            size={14}
            className={isFav ? "fill-destructive text-destructive" : "text-muted-foreground"}
          />
        </button>
        {/* Название тона */}
        {item.colorName && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border border-white/60 shadow-sm shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[11px] font-medium text-white drop-shadow-md truncate">
              {item.colorName}
            </span>
          </div>
        )}
      </div>

      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex-1">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-0.5">
            {item.brand}{item.collection ? ` · ${item.collection}` : ""}
          </p>
          <p className="font-bold text-foreground leading-tight">{item.title}</p>
        </div>

        {/* Фактуры (до 3 шт) */}
        <div className="flex flex-wrap gap-1">
          {item.textures.slice(0, 3).map((t) => {
            const meta = WALL_TEXTURES.find((x) => x.id === t);
            if (!meta) return null;
            return (
              <Badge key={t} variant="secondary" className="text-[10px] py-0 font-medium">
                <Icon name={meta.icon} size={10} className="mr-1" />
                {meta.label}
              </Badge>
            );
          })}
        </div>

        {/* Свойства */}
        <div className="flex flex-wrap gap-1">
          {item.moistureResistant && (
            <Badge variant="outline" className="text-[10px] py-0">влагостойкая</Badge>
          )}
          {item.paintable && (
            <Badge variant="outline" className="text-[10px] py-0">под покраску</Badge>
          )}
          {item.eco && (
            <Badge variant="outline" className="text-[10px] py-0">эко</Badge>
          )}
          {item.acoustic && (
            <Badge variant="outline" className="text-[10px] py-0">
              <Icon name="Volume2" size={9} className="mr-1" />
              акустика
            </Badge>
          )}
        </div>

        <div className="pt-2 border-t space-y-2">
          <div>
            <div className="text-xs text-muted-foreground">
              {item.pricePerUnit.toLocaleString("ru-RU")} ₽ / {item.unit}
            </div>
            {total !== null && needQty !== null ? (
              <div className="font-black text-foreground">
                {total.toLocaleString("ru-RU")} ₽
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  · {needQty} {item.unit}
                </span>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">отсканируйте для расчёта</div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={isApplied ? "default" : "outline"}
              onClick={() => onApply(item)}
              className="flex-1"
            >
              <Icon name={isApplied ? "Check" : "Paintbrush"} size={14} className="mr-1" />
              {isApplied ? "Применено" : "Примерить"}
            </Button>
            <Button
              size="sm"
              onClick={() => onAdd(item, needQty ?? 1)}
              className="flex-1"
            >
              <Icon name="Plus" size={14} className="mr-1" />
              В проект
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}