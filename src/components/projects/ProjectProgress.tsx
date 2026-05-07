import Icon from "@/components/ui/icon";
import type { SavedProject } from "@/lib/projectsStore";

interface Props {
  project: SavedProject;
  onNavigate?: (section: string) => void;
}

interface StepDef {
  id: string;
  label: string;
  icon: string;
  section: string;
  /** Выполнен ли шаг для конкретного проекта */
  isDone: (p: SavedProject) => boolean;
}

const STEPS: StepDef[] = [
  { id: "scan",     label: "Скан",       icon: "ScanLine",   section: "scan",    isDone: (p) => !!p.scan },
  { id: "plan",     label: "План",       icon: "LayoutGrid", section: "planner", isDone: (p) => !!p.scan }, // план опирается на скан
  { id: "estimate", label: "Смета",      icon: "Calculator", section: "calc",    isDone: (p) => !!p.estimate },
  { id: "staging",  label: "Стейджинг",  icon: "TrendingUp", section: "staging", isDone: (p) => !!p.staging },
];

/**
 * Компактный прогресс-индикатор шагов проекта на карточке списка.
 * Показывает 4 шага: Скан → План → Смета → Стейджинг.
 * Каждый шаг — кружок с галочкой (если выполнен) или иконкой раздела.
 * Клик по любому шагу — переход в соответствующий раздел.
 */
export default function ProjectProgress({ project, onNavigate }: Props) {
  const states = STEPS.map((s) => ({ ...s, done: s.isDone(project) }));
  const doneCount = states.filter((s) => s.done).length;
  const nextIndex = states.findIndex((s) => !s.done);
  const next = nextIndex >= 0 ? states[nextIndex] : null;
  const pct = Math.round((doneCount / STEPS.length) * 100);

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-2">
      {/* Прогресс-бар */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
          {doneCount}/{STEPS.length}
        </span>
      </div>

      {/* Шаги */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {states.map((s, i) => {
          const isNext = !s.done && i === nextIndex;
          return (
            <button
              key={s.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate?.(s.section);
              }}
              title={`${s.label}${s.done ? " — выполнено" : isNext ? " — следующий шаг" : ""}`}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                s.done
                  ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                  : isNext
                    ? "bg-primary text-primary-foreground hover:opacity-90 ring-2 ring-primary/30"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/70"
              }`}
            >
              {s.done ? (
                <Icon name="Check" size={11} />
              ) : (
                <Icon name={s.icon} size={11} />
              )}
              <span>{s.label}</span>
            </button>
          );
        })}

        {next && onNavigate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(next.section);
            }}
            className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
          >
            Продолжить
            <Icon name="ArrowRight" size={10} />
          </button>
        )}

        {!next && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
            <Icon name="CheckCircle2" size={11} />
            Все шаги пройдены
          </span>
        )}
      </div>
    </div>
  );
}
