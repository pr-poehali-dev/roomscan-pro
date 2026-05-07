import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { getLastScan } from "@/lib/scanStore";
import type { RoomInput } from "@/lib/estimate";

interface Props {
  value: RoomInput;
  onChange: (v: RoomInput) => void;
}

/**
 * Блок ввода параметров помещения.
 * Если есть последний скан — показывает кнопку «Подставить из скана».
 */
export default function RoomInputs({ value, onChange }: Props) {
  const [hasScan, setHasScan] = useState<boolean>(() => !!getLastScan());

  useEffect(() => {
    const handler = () => setHasScan(!!getLastScan());
    window.addEventListener("roomscan:lastScan:changed", handler);
    return () => window.removeEventListener("roomscan:lastScan:changed", handler);
  }, []);

  const fromScan = () => {
    const s = getLastScan();
    if (!s) return;
    const perim = 2 * (s.width + s.length);
    onChange({
      area: +s.area.toFixed(1),
      perimeter: +perim.toFixed(1),
      height: +s.height.toFixed(2),
      doors: s.doors ?? value.doors,
      windows: s.windows ?? value.windows,
    });
  };

  const fields: { label: string; key: keyof RoomInput; min: number; max: number; step: number; suffix: string }[] = [
    { label: "Площадь", key: "area", min: 1, max: 500, step: 0.1, suffix: "м²" },
    { label: "Периметр стен", key: "perimeter", min: 4, max: 200, step: 0.1, suffix: "м" },
    { label: "Высота потолка", key: "height", min: 2, max: 5, step: 0.05, suffix: "м" },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-bold text-foreground text-sm">Параметры помещения</p>
        {hasScan && (
          <button
            onClick={fromScan}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline"
          >
            <Icon name="ScanLine" size={12} />
            Подставить из скана
          </button>
        )}
      </div>

      {fields.map((f) => (
        <div key={f.key}>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-muted-foreground">{f.label}, {f.suffix}</label>
            <span className="text-xs font-mono text-primary font-bold">
              {(value[f.key] as number).toFixed(f.step < 1 ? 1 : 0)}
            </span>
          </div>
          <input
            type="range"
            min={f.min}
            max={f.max}
            step={f.step}
            value={value[f.key]}
            onChange={(e) => onChange({ ...value, [f.key]: parseFloat(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: "hsl(142 70% 36%)" }}
          />
        </div>
      ))}

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
        {([
          { label: "Дверей", key: "doors", icon: "DoorOpen" },
          { label: "Окон", key: "windows", icon: "Square" },
        ] as const).map((f) => (
          <div key={f.key}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon name={f.icon} size={11} className="text-muted-foreground" />
              <label className="text-xs text-muted-foreground">{f.label}</label>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onChange({ ...value, [f.key]: Math.max(0, value[f.key] - 1) })}
                className="w-7 h-7 bg-secondary rounded-md flex items-center justify-center hover:bg-border"
              >
                <Icon name="Minus" size={11} />
              </button>
              <span className="flex-1 text-center font-mono font-bold text-sm">{value[f.key]}</span>
              <button
                onClick={() => onChange({ ...value, [f.key]: Math.min(20, value[f.key] + 1) })}
                className="w-7 h-7 bg-secondary rounded-md flex items-center justify-center hover:bg-border"
              >
                <Icon name="Plus" size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
