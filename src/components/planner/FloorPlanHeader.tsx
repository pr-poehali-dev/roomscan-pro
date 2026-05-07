import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { FloorPlan } from "@/lib/floorPlan";

/**
 * Шапка редактора плана: имя плана, метрика площади/периметра и быстрые действия
 * (Из скана, Новый план, Импорт, Экспорт, Очистить).
 * Логика и стили 1:1 перенесены из FloorPlanEditor.tsx без изменений.
 */
export default function FloorPlanHeader({
  plan,
  setPlan,
  stats,
  loadFromScan,
  newRect,
  importPlanJson,
  exportPlanJson,
  clearAll,
}: {
  plan: FloorPlan;
  setPlan: (p: FloorPlan) => void;
  stats: { area: number; perimeter: number };
  loadFromScan: () => void;
  newRect: (preset: { w: number; h: number; name: string }) => void;
  importPlanJson: () => void;
  exportPlanJson: () => void;
  clearAll: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-2 flex-wrap">
      <Icon name="LayoutGrid" size={16} className="text-primary" />
      <input
        value={plan.name}
        onChange={(e) => setPlan({ ...plan, name: e.target.value })}
        className="bg-transparent font-bold text-foreground text-sm focus:outline-none border-b border-transparent hover:border-border focus:border-primary px-1 min-w-[100px]"
      />
      <span className="text-[11px] text-muted-foreground font-mono ml-auto">
        {stats.area.toFixed(1)} м² · {stats.perimeter.toFixed(1)} м периметр
      </span>

      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={loadFromScan}
          title="Создать план из последнего скана"
          className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs px-2.5 py-1.5 rounded-lg"
        >
          <Icon name="ScanLine" size={13} />
          Из скана
        </button>
        <div className="w-px h-5 bg-border mx-0.5" />
        <NewRoomButton onPick={newRect} />
        <button
          onClick={importPlanJson}
          title="Загрузить план из файла"
          className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/70 text-foreground font-bold text-xs px-2.5 py-1.5 rounded-lg"
        >
          <Icon name="Upload" size={13} />
          Импорт
        </button>
        <button
          onClick={exportPlanJson}
          className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/70 text-foreground font-bold text-xs px-2.5 py-1.5 rounded-lg"
        >
          <Icon name="Download" size={13} />
          Экспорт
        </button>
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive font-bold text-xs px-2.5 py-1.5 rounded-lg"
        >
          <Icon name="Eraser" size={13} />
          Очистить
        </button>
      </div>
    </div>
  );
}

function NewRoomButton({ onPick }: { onPick: (preset: { w: number; h: number; name: string }) => void }) {
  const [open, setOpen] = useState(false);
  const presets = [
    { w: 300, h: 400, name: "Маленькая (12 м²)" },
    { w: 400, h: 500, name: "Средняя (20 м²)" },
    { w: 500, h: 700, name: "Большая (35 м²)" },
    { w: 600, h: 1000, name: "Студия (60 м²)" },
  ];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 bg-primary text-primary-foreground hover:opacity-90 font-bold text-xs px-2.5 py-1.5 rounded-lg"
      >
        <Icon name="Plus" size={13} />
        Новый план
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl p-1 z-10 w-52">
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                onPick(p);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-secondary rounded text-xs font-bold text-foreground"
            >
              {p.name}
              <span className="block text-[10px] font-mono text-muted-foreground">
                {p.w} × {p.h} см
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
