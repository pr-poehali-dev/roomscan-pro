import Icon from "@/components/ui/icon";

/**
 * Карточка метода сканирования в виде кнопки.
 * Используется на экране выбора метода — унифицирует разметку и стили
 * для всех 4 вариантов (WebXR / Photo / Vision / Pose).
 */

export interface Feature {
  icon: string;
  text: string;
  /** true — зелёная галочка, false — красный крест, null — жёлтое инфо */
  ok: boolean | null;
}

interface Props {
  icon: string;
  variantLabel: string;
  title: string;
  description: string;
  features: Feature[];
  onSelect: () => void;
  /** Лента сверху-справа, например «NEW · AI» или «Pose AI» */
  ribbon?: { text: string; tone: "primary" | "emerald" };
  /** «accented» — выделяем границей primary, «highlight» — градиент + рамка */
  emphasis?: "default" | "accented" | "highlight";
  /** Для feature-иконок: если true — зелёный «ok», иначе primary */
  featureOkTone?: "primary" | "emerald";
}

export default function MethodCard({
  icon,
  variantLabel,
  title,
  description,
  features,
  onSelect,
  ribbon,
  emphasis = "default",
  featureOkTone = "primary",
}: Props) {
  const containerClass =
    emphasis === "highlight"
      ? "bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary rounded-xl p-5 text-left hover:shadow-lg transition-all group space-y-3 relative"
      : emphasis === "accented"
        ? "bg-card border border-primary/40 rounded-xl p-5 text-left hover:border-primary transition-all group space-y-3 relative"
        : "bg-card border border-border rounded-xl p-5 text-left hover:border-primary/50 transition-all group space-y-3";

  const iconWrapClass =
    emphasis === "highlight"
      ? "w-12 h-12 bg-primary/15 border border-primary/40 rounded-xl flex items-center justify-center group-hover:bg-primary/25 transition-colors"
      : "w-12 h-12 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors";

  const badgeClass =
    emphasis === "highlight"
      ? "text-xs font-mono bg-primary/15 text-primary px-2.5 py-1 rounded-full"
      : "text-xs font-mono bg-primary/10 text-primary px-2.5 py-1 rounded-full";

  return (
    <button onClick={onSelect} className={containerClass}>
      {ribbon && (
        <span
          className={`absolute -top-2 -right-2 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-md ${
            ribbon.tone === "emerald"
              ? "bg-emerald-500 text-white"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {ribbon.text}
        </span>
      )}
      <div className="flex items-start justify-between">
        <div className={iconWrapClass}>
          <Icon name={icon} size={22} className="text-primary" />
        </div>
        <span className={badgeClass}>{variantLabel}</span>
      </div>
      <div>
        <p className="font-bold text-foreground text-lg">{title}</p>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="space-y-1.5">
        {features.map((f) => (
          <div key={f.text} className="flex items-center gap-2 text-xs">
            <Icon
              name={f.ok === true ? "CheckCircle2" : f.ok === false ? "XCircle" : "Info"}
              size={13}
              className={
                f.ok === true
                  ? featureOkTone === "emerald"
                    ? "text-emerald-500"
                    : "text-primary"
                  : f.ok === false
                    ? "text-destructive"
                    : "text-yellow-500"
              }
            />
            <span className="text-muted-foreground">{f.text}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-primary text-sm font-semibold group-hover:gap-3 transition-all">
        Выбрать <Icon name="ArrowRight" size={15} />
      </div>
    </button>
  );
}
