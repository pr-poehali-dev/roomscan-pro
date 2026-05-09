import Icon from "@/components/ui/icon";
import { LayoutVariant } from "@/lib/modular-houses";

interface Props {
  variants: LayoutVariant[];
  selectedId: string;
  onSelect: (variantId: string) => void;
}

/**
 * Переключатель планировок A / B / C внутри одного проекта.
 * Показывается только если у проекта есть >= 2 вариантов.
 */
export default function LayoutVariantPicker({
  variants,
  selectedId,
  onSelect,
}: Props) {
  if (!variants || variants.length < 2) return null;

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];

  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-primary flex items-center gap-1.5">
          <Icon name="Layers" size={12} />
          Выбор планировки
        </p>
        <p className="text-[10px] font-mono text-muted-foreground">
          {variants.length} {variants.length === 2 ? "варианта" : "вариантов"}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {variants.map((v) => {
          const active = v.id === selected.id;
          return (
            <button
              key={v.id}
              onClick={() => onSelect(v.id)}
              className={`text-left p-2.5 rounded-lg border-2 transition-all ${
                active
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/30 hover:border-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground"
                  }`}
                >
                  {v.id}
                </span>
                <p className="text-xs font-bold truncate">{v.name}</p>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-2">
                {v.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
