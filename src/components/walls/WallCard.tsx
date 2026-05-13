import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import type { WallItem } from "./wallsData";
import { WALL_CATEGORIES } from "./wallsData";

interface Props {
  item: WallItem;
  wallsAreaNet: number | null;   // м² стен из скана (или null)
  isFav: boolean;
  onToggleFav: (id: string) => void;
  onAdd: (item: WallItem, qty: number) => void;
}

/**
 * Карточка покрытия. Сама считает нужное количество единиц
 * (рулонов / банок краски / м²) из площади стен последнего скана.
 */
export default function WallCard({ item, wallsAreaNet, isFav, onToggleFav, onAdd }: Props) {
  const cat = WALL_CATEGORIES.find((c) => c.id === item.category);
  const needQty = wallsAreaNet ? Math.ceil(wallsAreaNet / item.coveragePerUnit) : null;
  const total = needQty ? needQty * item.pricePerUnit : null;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5 group flex flex-col">
      <div
        className="relative h-32 w-full"
        style={{ backgroundColor: item.color }}
      >
        <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.6),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.3),transparent_50%)]" />
        <div className="absolute top-2 left-2 flex gap-1.5">
          {item.hit && (
            <Badge className="bg-primary text-primary-foreground border-0 shadow-sm">ХИТ</Badge>
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
      </div>

      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex-1">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-0.5">
            {item.brand}{item.collection ? ` · ${item.collection}` : ""}
          </p>
          <p className="font-bold text-foreground leading-tight">{item.title}</p>
        </div>

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
        </div>

        <div className="flex items-end justify-between gap-2 pt-2 border-t">
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
          <Button
            size="sm"
            onClick={() => onAdd(item, needQty ?? 1)}
            className="shrink-0"
          >
            <Icon name="Plus" size={14} className="mr-1" />
            В проект
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
