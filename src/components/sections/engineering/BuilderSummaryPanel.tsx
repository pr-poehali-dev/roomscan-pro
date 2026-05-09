import Icon from "@/components/ui/icon";
import { EQUIPMENT, CATEGORY_LABELS, formatRub } from "@/lib/engineering";
import { BuilderComposition, summarize } from "@/lib/equipment-builder";

interface Props {
  composition: BuilderComposition;
  selectedUid: string | null;
  onSelect: (uid: string | null) => void;
  onRemove: (uid: string) => void;
  onChangeRoom: (room: BuilderComposition["room"]) => void;
  onClear: () => void;
}

/**
 * Правая панель: настройки помещения, сводка по компоновке, список элементов.
 */
export default function BuilderSummaryPanel({
  composition,
  selectedUid,
  onSelect,
  onRemove,
  onChangeRoom,
  onClear,
}: Props) {
  const summary = summarize(composition);

  return (
    <div className="space-y-3">
      {/* Параметры помещения */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="bg-secondary/40 px-3 py-2 flex items-center gap-2">
          <Icon name="Ruler" size={13} className="text-primary" />
          <p className="text-xs font-bold uppercase tracking-wider">Тех. помещение</p>
        </div>
        <div className="p-3 space-y-2">
          <RoomInput
            label="Ширина"
            value={composition.room.width}
            min={2}
            max={10}
            step={0.1}
            unit="м"
            onChange={(v) => onChangeRoom({ ...composition.room, width: v })}
          />
          <RoomInput
            label="Глубина"
            value={composition.room.depth}
            min={2}
            max={10}
            step={0.1}
            unit="м"
            onChange={(v) => onChangeRoom({ ...composition.room, depth: v })}
          />
          <RoomInput
            label="Высота потолка"
            value={composition.room.height}
            min={2.2}
            max={4.5}
            step={0.1}
            unit="м"
            onChange={(v) => onChangeRoom({ ...composition.room, height: v })}
          />
          <div className="pt-1.5 border-t border-border">
            <p className="text-[10px] font-mono text-muted-foreground">
              Общая площадь:{" "}
              <span className="text-foreground font-bold">
                {(composition.room.width * composition.room.depth).toFixed(2)} м²
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Сводка */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="bg-secondary/40 px-3 py-2 flex items-center gap-2">
          <Icon name="BarChart3" size={13} className="text-primary" />
          <p className="text-xs font-bold uppercase tracking-wider">Сводка</p>
        </div>
        <div className="p-3 space-y-2">
          <SummaryRow icon="Package" label="Позиций" value={String(summary.itemsCount)} />
          <SummaryRow
            icon="PercentSquare"
            label="Заполнение"
            value={`${summary.fillPercent}%`}
            tone={summary.fillPercent > 60 ? "warn" : "ok"}
          />
          {summary.totalPower > 0 && (
            <SummaryRow icon="Flame" label="Мощность" value={`${summary.totalPower} кВт`} />
          )}
          <div className="pt-2 border-t border-border">
            <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mb-0.5">
              Итого
            </p>
            <p className="text-xl font-bold font-mono text-primary">
              {formatRub(summary.totalPrice)}
            </p>
          </div>
        </div>
      </div>

      {/* Проблемы / рекомендации */}
      {summary.issues.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-3">
          <p className="text-xs font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300 mb-2">
            <Icon name="TriangleAlert" size={13} />
            Замечания
          </p>
          <ul className="space-y-1 text-[11px] text-amber-900 dark:text-amber-200">
            {summary.issues.map((iss, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                <span>{iss}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Список размещённых */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="bg-secondary/40 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="LayoutList" size={13} className="text-primary" />
            <p className="text-xs font-bold uppercase tracking-wider">Состав</p>
          </div>
          {composition.placements.length > 0 && (
            <button
              onClick={onClear}
              className="text-[10px] text-destructive hover:underline flex items-center gap-1"
              title="Очистить"
            >
              <Icon name="Trash2" size={10} />
              Очистить
            </button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {composition.placements.length === 0 ? (
            <div className="p-4 text-center">
              <Icon name="PackageOpen" size={20} className="text-muted-foreground mx-auto mb-1.5" />
              <p className="text-[11px] text-muted-foreground">Пока пусто</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                Перетащите оборудование на план
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {composition.placements.map((p) => {
                const item = EQUIPMENT.find((e) => e.id === p.equipmentId);
                if (!item) return null;
                const isActive = selectedUid === p.uid;
                return (
                  <div
                    key={p.uid}
                    onClick={() => onSelect(isActive ? null : p.uid)}
                    className={`px-3 py-2 cursor-pointer flex items-center gap-2 transition-colors ${
                      isActive ? "bg-primary/10" : "hover:bg-secondary/50"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded shrink-0 border border-border overflow-hidden bg-secondary/40"
                      style={{
                        background: item.image ? undefined : item.color,
                      }}
                    >
                      {item.image && (
                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium truncate">
                        {item.brand ? `${item.brand} · ` : ""}
                        {CATEGORY_LABELS[item.category]}
                      </p>
                      <p className="text-[9px] font-mono text-muted-foreground truncate">
                        {p.position[0].toFixed(1)}, {p.position[1].toFixed(1)} м · {formatRub(item.price)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(p.uid);
                      }}
                      className="text-muted-foreground hover:text-destructive p-1"
                      title="Удалить"
                    >
                      <Icon name="X" size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────── ХЕЛПЕРЫ ────────────── */

function RoomInput({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-bold">
          {value.toFixed(1)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
      />
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: string;
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "warn";
}) {
  const colorClass =
    tone === "ok"
      ? "text-primary"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : "text-foreground";
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Icon name={icon} size={11} />
        {label}
      </span>
      <span className={`font-mono font-bold ${colorClass}`}>{value}</span>
    </div>
  );
}
