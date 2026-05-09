import Icon from "@/components/ui/icon";
import type { Transform } from "./roomTryOnUtils";

interface Props {
  transform: Transform;
  onSetOpacity: (v: number) => void;
  onAdjustScale: (delta: number) => void;
  onAdjustRotation: (delta: number) => void;
  onToggleFlip: () => void;
  onReset: () => void;
  onChangePhoto: () => void;
  onClearPhoto: () => void;
}

/**
 * Нижняя панель управления примеркой: слайдер прозрачности + кнопки масштаба,
 * поворота, зеркала, сброса и смены фото.
 * Логика 1:1 перенесена из RoomTryOn.tsx без изменений.
 */
export default function RoomTryOnControls({
  transform,
  onSetOpacity,
  onAdjustScale,
  onAdjustRotation,
  onToggleFlip,
  onReset,
  onChangePhoto,
  onClearPhoto,
}: Props) {
  return (
    <div className="bg-card/95 backdrop-blur-sm border-t border-border p-3 shrink-0 space-y-2.5">
      {/* Слайдер прозрачности */}
      <div className="flex items-center gap-2">
        <Icon name="Eye" size={13} className="text-muted-foreground shrink-0" />
        <input
          type="range"
          min={0.3}
          max={1}
          step={0.05}
          value={transform.opacity}
          onChange={(e) => onSetOpacity(parseFloat(e.target.value))}
          className="flex-1 h-1.5 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
        />
        <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
          {Math.round(transform.opacity * 100)}%
        </span>
      </div>

      {/* Кнопки */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <CtrlBtn icon="Minus" label="−" onClick={() => onAdjustScale(-0.1)} />
        <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap px-1">
          {Math.round(transform.scale * 100)}%
        </span>
        <CtrlBtn icon="Plus" label="+" onClick={() => onAdjustScale(0.1)} />

        <span className="w-px h-6 bg-border mx-1" />

        <CtrlBtn icon="RotateCcw" label="−15°" onClick={() => onAdjustRotation(-15)} />
        <CtrlBtn icon="RotateCw" label="+15°" onClick={() => onAdjustRotation(15)} />

        <span className="w-px h-6 bg-border mx-1" />

        <CtrlBtn
          icon="FlipHorizontal"
          label="Зеркало"
          onClick={onToggleFlip}
          active={transform.flipped}
        />
        <CtrlBtn icon="Undo2" label="Сброс" onClick={onReset} />

        <span className="flex-1" />

        <CtrlBtn icon="ImagePlus" label="Сменить фото" onClick={onChangePhoto} />
        <CtrlBtn icon="Trash2" label="Очистить" onClick={onClearPhoto} danger />
      </div>
    </div>
  );
}

function CtrlBtn({
  icon,
  label,
  onClick,
  active,
  danger,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold flex items-center gap-1 whitespace-nowrap transition-colors border ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : danger
            ? "bg-card border-destructive/30 text-destructive hover:bg-destructive/10"
            : "bg-card border-border text-foreground hover:border-primary/40 hover:text-primary"
      }`}
    >
      <Icon name={icon} size={11} />
      {label}
    </button>
  );
}
