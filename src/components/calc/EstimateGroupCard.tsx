import { useState } from "react";
import Icon from "@/components/ui/icon";
import { formatRub, type EstimateGroup } from "@/lib/estimate";

interface Props {
  group: EstimateGroup;
  defaultOpen?: boolean;
}

/**
 * Раскрывающаяся карточка группы работ (Демонтаж, Черновые, Чистовые и т.д.).
 * Сворачивается по клику на заголовок.
 */
export default function EstimateGroupCard({ group, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors"
      >
        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
          <Icon name={group.icon} size={16} className="text-primary" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-bold text-foreground text-sm">{group.name}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {group.lines.length} позиций
          </p>
        </div>
        <p className="font-bold text-primary font-mono text-sm shrink-0">
          {formatRub(group.total)}
        </p>
        <Icon
          name="ChevronDown"
          size={16}
          className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-border divide-y divide-border">
          {group.lines.map((l, idx) => (
            <div key={idx} className="px-4 py-2.5 flex items-center gap-3 text-sm">
              <p className="flex-1 text-foreground min-w-0 truncate">{l.name}</p>
              <p className="text-xs text-muted-foreground font-mono shrink-0">
                {l.qty.toFixed(l.unit === "шт" || l.unit === "комплект" ? 0 : 1)} {l.unit} × {l.price.toLocaleString("ru-RU")} ₽
              </p>
              <p className="font-semibold text-foreground font-mono w-24 text-right shrink-0">
                {formatRub(l.total)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
