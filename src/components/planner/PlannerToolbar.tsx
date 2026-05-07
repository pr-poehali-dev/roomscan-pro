import Icon from "@/components/ui/icon";
import type { Tool } from "./PlanCanvas";

interface Props {
  tool: Tool;
  onToolChange: (t: Tool) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

const TOOLS: { id: Tool; label: string; icon: string; hint?: string }[] = [
  { id: "select",    label: "Выбор",      icon: "MousePointer2", hint: "Выделить и перетащить элемент" },
  { id: "wall",      label: "Стена",      icon: "Minus",          hint: "Кликнуть и тянуть. Shift — ровная линия" },
  { id: "door",      label: "Дверь",      icon: "DoorOpen",       hint: "Клик на стене" },
  { id: "window",    label: "Окно",       icon: "RectangleHorizontal", hint: "Клик на стене" },
  { id: "furniture", label: "Мебель",     icon: "Sofa",           hint: "Выбрать в каталоге справа и кликнуть" },
  { id: "delete",    label: "Удалить",    icon: "Trash2",         hint: "Клик по элементу" },
];

/**
 * Верхняя панель инструментов планировщика.
 */
export default function PlannerToolbar({ tool, onToolChange, onZoomIn, onZoomOut, onZoomFit, onUndo, canUndo }: Props) {
  return (
    <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 flex-wrap">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          onClick={() => onToolChange(t.id)}
          title={`${t.label}${t.hint ? ` — ${t.hint}` : ""}`}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            tool === t.id
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-secondary"
          }`}
        >
          <Icon name={t.icon} size={14} />
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}

      <div className="w-px h-6 bg-border mx-1" />

      {onUndo && (
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Отменить (Ctrl+Z)"
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icon name="Undo2" size={14} />
        </button>
      )}

      <button
        onClick={onZoomOut}
        title="Уменьшить"
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold text-foreground hover:bg-secondary"
      >
        <Icon name="ZoomOut" size={14} />
      </button>
      <button
        onClick={onZoomFit}
        title="По размеру"
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold text-foreground hover:bg-secondary"
      >
        <Icon name="Maximize" size={14} />
      </button>
      <button
        onClick={onZoomIn}
        title="Увеличить"
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold text-foreground hover:bg-secondary"
      >
        <Icon name="ZoomIn" size={14} />
      </button>
    </div>
  );
}
