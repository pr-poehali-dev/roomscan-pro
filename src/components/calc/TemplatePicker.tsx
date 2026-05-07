import Icon from "@/components/ui/icon";
import { ESTIMATE_TEMPLATES, type EstimateTemplate } from "@/lib/estimateTemplates";

interface Props {
  onPick: (template: EstimateTemplate) => void;
}

/**
 * Блок быстрых шаблонов «Новостройка» и «Вторичка».
 * Клик по карточке заполняет параметры комнаты и тариф автоматически.
 */
export default function TemplatePicker({ onPick }: Props) {
  const newOnes  = ESTIMATE_TEMPLATES.filter((t) => t.kind === "new");
  const seconds  = ESTIMATE_TEMPLATES.filter((t) => t.kind === "second");

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Icon name="Sparkles" size={16} className="text-primary" />
        <p className="text-sm font-bold text-foreground">Готовые шаблоны</p>
        <p className="text-xs text-muted-foreground hidden sm:block">
          Кликните — параметры подставятся автоматически
        </p>
      </div>

      {/* Новостройка */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-emerald-500/15 text-emerald-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
            Новостройка
          </span>
          <span className="text-[11px] text-muted-foreground">
            Без демонтажа, ровные стены, евроотделка
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {newOnes.map((t) => (
            <TemplateCard key={t.id} template={t} onPick={onPick} accent="emerald" />
          ))}
        </div>
      </div>

      {/* Вторичка */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-amber-500/15 text-amber-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
            Вторичка
          </span>
          <span className="text-[11px] text-muted-foreground">
            Демонтаж + выравнивание стен и инженерия
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {seconds.map((t) => (
            <TemplateCard key={t.id} template={t} onPick={onPick} accent="amber" />
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplateCard({
  template, onPick, accent,
}: {
  template: EstimateTemplate;
  onPick: (t: EstimateTemplate) => void;
  accent: "emerald" | "amber";
}) {
  const accentBorder = accent === "emerald"
    ? "hover:border-emerald-500/60"
    : "hover:border-amber-500/60";

  return (
    <button
      type="button"
      onClick={() => onPick(template)}
      className={`text-left bg-secondary/40 border border-border ${accentBorder} hover:bg-secondary rounded-lg p-3 transition-colors group`}
      title={template.note}
    >
      <div className="flex items-start gap-2">
        <Icon name={template.icon} size={16} className={accent === "emerald" ? "text-emerald-500 mt-0.5 shrink-0" : "text-amber-500 mt-0.5 shrink-0"} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground leading-tight">{template.name}</p>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{template.desc}</p>
          <div className="flex items-center gap-1 mt-1.5">
            <span className="text-[9px] font-mono uppercase text-muted-foreground bg-card px-1.5 py-0.5 rounded">
              {template.recommendedTier === "econom" ? "эконом" : template.recommendedTier === "standart" ? "стандарт" : "премиум"}
            </span>
            <Icon name="ArrowRight" size={11} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all ml-auto" />
          </div>
        </div>
      </div>
    </button>
  );
}
