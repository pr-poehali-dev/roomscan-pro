import Icon from "@/components/ui/icon";
import type { Tool } from "./PlanCanvas";

/**
 * Блок статистики плана и подсказок к текущему инструменту.
 * Логика и стили 1:1 перенесены из FloorPlanEditor.tsx без изменений.
 */

interface Stats {
  area: number;
  perimeter: number;
  walls: number;
  doors: number;
  windows: number;
  furniture: number;
}

export function FloorPlanStats({ stats }: { stats: Stats }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-2">
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
        Статистика
      </p>
      <Stat icon="Square" label="Площадь" value={`${stats.area.toFixed(2)} м²`} />
      <Stat icon="Ruler" label="Периметр" value={`${stats.perimeter.toFixed(1)} м`} />
      <Stat icon="Minus" label="Стен" value={`${stats.walls}`} />
      <Stat icon="DoorOpen" label="Дверей" value={`${stats.doors}`} />
      <Stat icon="RectangleHorizontal" label="Окон" value={`${stats.windows}`} />
      <Stat icon="Sofa" label="Объектов мебели" value={`${stats.furniture}`} />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon name={icon} size={13} className="text-primary shrink-0" />
      <span className="text-muted-foreground text-xs flex-1">{label}</span>
      <span className="font-mono font-bold text-foreground">{value}</span>
    </div>
  );
}

export function Hints({ tool }: { tool: Tool }) {
  const hints: Record<Tool, string> = {
    select:    "Кликните на элемент чтобы выделить, перетащите чтобы передвинуть. Зажмите Shift+ЛКМ — панорамирование.",
    wall:      "Кликните и тяните чтобы нарисовать стену. Зажмите Shift для ровной горизонтали/вертикали. Привязка к сетке 10 см.",
    door:      "Кликните на стену в нужном месте — там появится дверь шириной 80 см. Можно перетащить вдоль стены.",
    window:    "Кликните на стену в нужном месте — там появится окно шириной 120 см. Можно перетащить вдоль стены.",
    furniture: "Сначала выберите предмет в каталоге слева, потом кликните в нужное место плана.",
    delete:    "Кликните на элемент, чтобы удалить его из плана.",
  };
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 flex items-start gap-2">
      <Icon name="Info" size={13} className="text-primary shrink-0 mt-0.5" />
      <p className="text-[11px] text-foreground leading-relaxed">{hints[tool]}</p>
    </div>
  );
}
