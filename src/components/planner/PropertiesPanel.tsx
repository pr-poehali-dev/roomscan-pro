import Icon from "@/components/ui/icon";
import { dist, type FloorPlan } from "@/lib/floorPlan";
import type { SelectedRef } from "./PlanCanvas";

interface Props {
  plan: FloorPlan;
  selected: SelectedRef | null;
  onChange: (plan: FloorPlan) => void;
  onDeselect: () => void;
}

/**
 * Правая панель свойств выделенного элемента (стены, проёма, мебели).
 * Позволяет менять размеры, поворот, толщину стены, ширину проёма и т.д.
 */
export default function PropertiesPanel({ plan, selected, onChange, onDeselect }: Props) {
  if (!selected) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 text-center">
        <Icon name="MousePointer2" size={22} className="text-muted-foreground mx-auto mb-2" />
        <p className="text-xs font-bold text-foreground">Ничего не выделено</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Кликните на стену, проём или мебель, чтобы изменить её свойства
        </p>
      </div>
    );
  }

  if (selected.kind === "wall") {
    const wall = plan.walls.find((w) => w.id === selected.id);
    if (!wall) return null;
    const length = dist(wall.a, wall.b);
    return (
      <Card title="Стена" onClose={onDeselect} icon="Minus">
        <Field label="Длина">
          <span className="font-mono text-foreground font-bold">
            {(length / 100).toFixed(2)} м
          </span>
        </Field>
        <NumberField
          label="Толщина (см)"
          value={wall.thickness}
          min={5}
          max={50}
          step={5}
          onChange={(v) => {
            onChange({
              ...plan,
              walls: plan.walls.map((w) => (w.id === wall.id ? { ...w, thickness: v } : w)),
            });
          }}
        />
        <DangerButton
          label="Удалить стену"
          onClick={() => {
            onChange({
              ...plan,
              walls: plan.walls.filter((w) => w.id !== wall.id),
              openings: plan.openings.filter((o) => o.wallId !== wall.id),
            });
            onDeselect();
          }}
        />
      </Card>
    );
  }

  if (selected.kind === "opening") {
    const op = plan.openings.find((o) => o.id === selected.id);
    if (!op) return null;
    return (
      <Card
        title={op.kind === "door" ? "Дверь" : "Окно"}
        onClose={onDeselect}
        icon={op.kind === "door" ? "DoorOpen" : "RectangleHorizontal"}
      >
        <NumberField
          label="Ширина (см)"
          value={op.width}
          min={40}
          max={300}
          step={10}
          onChange={(v) => {
            onChange({
              ...plan,
              openings: plan.openings.map((o) => (o.id === op.id ? { ...o, width: v } : o)),
            });
          }}
        />
        <NumberField
          label="Положение на стене (%)"
          value={Math.round(op.t * 100)}
          min={0}
          max={100}
          step={5}
          onChange={(v) => {
            onChange({
              ...plan,
              openings: plan.openings.map((o) => (o.id === op.id ? { ...o, t: v / 100 } : o)),
            });
          }}
        />
        <DangerButton
          label="Удалить"
          onClick={() => {
            onChange({ ...plan, openings: plan.openings.filter((o) => o.id !== op.id) });
            onDeselect();
          }}
        />
      </Card>
    );
  }

  if (selected.kind === "furniture") {
    const f = plan.furniture.find((x) => x.id === selected.id);
    if (!f) return null;
    return (
      <Card title={f.type} onClose={onDeselect} icon={f.icon}>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Ширина (см)"
            value={f.w}
            min={20}
            max={500}
            step={5}
            onChange={(v) => {
              onChange({
                ...plan,
                furniture: plan.furniture.map((x) => (x.id === f.id ? { ...x, w: v } : x)),
              });
            }}
          />
          <NumberField
            label="Глубина (см)"
            value={f.h}
            min={20}
            max={500}
            step={5}
            onChange={(v) => {
              onChange({
                ...plan,
                furniture: plan.furniture.map((x) => (x.id === f.id ? { ...x, h: v } : x)),
              });
            }}
          />
        </div>

        <Field label="Поворот">
          <div className="flex gap-1">
            {[0, 90, 180, 270].map((deg) => (
              <button
                key={deg}
                onClick={() => {
                  onChange({
                    ...plan,
                    furniture: plan.furniture.map((x) => (x.id === f.id ? { ...x, rotation: deg } : x)),
                  });
                }}
                className={`flex-1 py-1.5 rounded text-xs font-bold ${
                  f.rotation === deg ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/70"
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </Field>

        <Field label="Цвет">
          <div className="flex gap-1 flex-wrap">
            {["#94a3b8", "#fde68a", "#fca5a5", "#86efac", "#a78bfa", "#bae6fd", "#fcd34d", "#cbd5e1"].map((c) => (
              <button
                key={c}
                onClick={() => {
                  onChange({
                    ...plan,
                    furniture: plan.furniture.map((x) => (x.id === f.id ? { ...x, color: c } : x)),
                  });
                }}
                style={{ background: c }}
                className={`w-6 h-6 rounded-full border-2 ${f.color === c ? "border-primary" : "border-border"}`}
              />
            ))}
          </div>
        </Field>

        <button
          onClick={() => {
            // Дублировать
            const copy = { ...f, id: `${f.id}_copy_${Date.now()}`, x: f.x + 30, y: f.y + 30 };
            onChange({ ...plan, furniture: [...plan.furniture, copy] });
          }}
          className="w-full bg-secondary hover:bg-secondary/70 text-foreground font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-2"
        >
          <Icon name="Copy" size={13} />
          Дублировать
        </button>

        <DangerButton
          label="Удалить"
          onClick={() => {
            onChange({ ...plan, furniture: plan.furniture.filter((x) => x.id !== f.id) });
            onDeselect();
          }}
        />
      </Card>
    );
  }

  return null;
}

/* ---------- helpers ---------- */

function Card({
  title, icon, onClose, children,
}: { title: string; icon: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Icon name={icon} size={16} className="text-primary" />
        <p className="font-bold text-foreground text-sm flex-1 truncate">{title}</p>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <Icon name="X" size={14} />
        </button>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase text-muted-foreground mb-1">{label}</p>
      {children}
    </div>
  );
}

function NumberField({
  label, value, min, max, step, onChange,
}: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(Math.max(min, Math.min(max, v)));
        }}
        className="w-full bg-secondary border border-border rounded px-2 py-1 text-sm font-mono text-foreground focus:outline-none focus:border-primary"
      />
    </Field>
  );
}

function DangerButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-destructive/10 hover:bg-destructive/20 text-destructive font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-2"
    >
      <Icon name="Trash2" size={13} />
      {label}
    </button>
  );
}
