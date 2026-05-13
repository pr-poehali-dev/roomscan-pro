import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import {
  getProjectItems,
  removeProjectItem,
  clearProjectItems,
  type ProjectItem,
} from "@/lib/scanStore";

/**
 * Блок «Корзина проекта» на главной — единый список всего, что пользователь
 * добавил: мебель, плитка, стены, окна. Можно удалять, очищать и отправлять
 * запрос подрядчику.
 */
interface Props {
  onNavigate?: (section: string) => void;
}

const SOURCE_META: Record<ProjectItem["source"], { label: string; icon: string; section: string }> = {
  furniture: { label: "Мебель",   icon: "Sofa",      section: "catalog" },
  tiles:     { label: "Плитка",   icon: "Grid2x2",   section: "tiles" },
  walls:     { label: "Стены",    icon: "Wallpaper", section: "walls" },
  openings:  { label: "Окна/двери", icon: "DoorOpen", section: "openings" },
  other:     { label: "Прочее",   icon: "Package",   section: "home" },
};

export default function ProjectBasketBlock({ onNavigate }: Props) {
  const [items, setItems] = useState<ProjectItem[]>([]);

  useEffect(() => {
    const reload = () => setItems(getProjectItems());
    reload();
    window.addEventListener("roomscan:project:changed", reload);
    return () => window.removeEventListener("roomscan:project:changed", reload);
  }, []);

  if (items.length === 0) return null;

  const total = items.reduce((s, i) => s + i.qty * i.pricePerUnit, 0);

  // группируем по source
  const byGroup = items.reduce<Record<ProjectItem["source"], ProjectItem[]>>((acc, it) => {
    acc[it.source] = acc[it.source] || [];
    acc[it.source].push(it);
    return acc;
  }, {} as Record<ProjectItem["source"], ProjectItem[]>);

  return (
    <section className="px-6 lg:px-12 max-w-6xl mx-auto w-full">
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardContent className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/15 text-primary">
                <Icon name="ShoppingBag" size={20} />
              </div>
              <div>
                <p className="font-black text-foreground text-lg">Корзина проекта</p>
                <p className="text-sm text-muted-foreground">
                  В вашем проекте {items.length} позици{plural(items.length, "я", "и", "й")} на сумму{" "}
                  <span className="font-bold text-foreground">
                    {total.toLocaleString("ru-RU")} ₽
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline" size="sm"
                onClick={() => {
                  clearProjectItems();
                  toast.success("Корзина очищена");
                }}
              >
                <Icon name="Trash2" size={14} className="mr-1.5" />
                Очистить
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  toast.success("Заявка отправлена", {
                    description: "Партнёр свяжется с вами в ближайшее время",
                  });
                }}
              >
                <Icon name="Send" size={14} className="mr-1.5" />
                Отправить подрядчику
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(byGroup).map(([source, list]) => {
              const meta = SOURCE_META[source as ProjectItem["source"]];
              const groupTotal = list.reduce((s, i) => s + i.qty * i.pricePerUnit, 0);
              return (
                <div key={source} className="rounded-lg border bg-card overflow-hidden">
                  <button
                    onClick={() => onNavigate?.(meta.section)}
                    className="w-full px-4 py-2 bg-muted/40 flex items-center justify-between hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Icon name={meta.icon} size={14} className="text-primary" />
                      <span className="text-xs uppercase tracking-widest font-mono font-bold text-foreground">
                        {meta.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        · {list.length} · {groupTotal.toLocaleString("ru-RU")} ₽
                      </span>
                    </div>
                    <Icon name="ChevronRight" size={14} className="text-muted-foreground" />
                  </button>
                  <ul className="divide-y">
                    {list.map((it) => (
                      <li key={it.id} className="px-4 py-2.5 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{it.title}</p>
                          {it.subtitle && (
                            <p className="text-xs text-muted-foreground truncate">{it.subtitle}</p>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground shrink-0">
                          {it.qty} {it.unit}
                        </div>
                        <div className="font-bold text-foreground shrink-0 w-24 text-right">
                          {(it.qty * it.pricePerUnit).toLocaleString("ru-RU")} ₽
                        </div>
                        <button
                          onClick={() => removeProjectItem(it.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          aria-label="Удалить"
                        >
                          <Icon name="X" size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
