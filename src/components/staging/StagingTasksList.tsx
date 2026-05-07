import { useState } from "react";
import Icon from "@/components/ui/icon";
import { formatRubShort, type StagingScenario, type StagingTask } from "@/lib/staging";

interface Props {
  scenario: StagingScenario;
}

const CAT_LABELS: Record<StagingTask["category"], string> = {
  clean: "Уборка и обезличивание",
  repair: "Косметический ремонт",
  decor: "Декор и атмосфера",
  photo: "Фото для объявления",
};

const PRIORITY_COLORS: Record<StagingTask["priority"], string> = {
  must:   "bg-red-500/10 text-red-500 border-red-500/30",
  should: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  nice:   "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
};

const PRIORITY_LABELS: Record<StagingTask["priority"], string> = {
  must:   "Обязательно",
  should: "Желательно",
  nice:   "По желанию",
};

export default function StagingTasksList({ scenario }: Props) {
  const [done, setDone] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const grouped = scenario.tasks.reduce<Record<string, StagingTask[]>>((acc, t) => {
    (acc[t.category] = acc[t.category] || []).push(t);
    return acc;
  }, {});

  const totalDone = scenario.tasks.filter((t) => done.has(t.id)).length;
  const progress = Math.round((totalDone / scenario.tasks.length) * 100);

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-foreground">Чек-лист подготовки</p>
          <span className="text-xs font-mono text-muted-foreground">
            {totalDone} / {scenario.tasks.length} · {progress}%
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {(Object.keys(grouped) as StagingTask["category"][]).map((cat) => (
        <div key={cat}>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
            {CAT_LABELS[cat]}
          </p>
          <div className="space-y-2">
            {grouped[cat].map((t) => {
              const isDone = done.has(t.id);
              return (
                <div
                  key={t.id}
                  className={`bg-card border rounded-xl p-3 flex items-start gap-3 transition-all ${
                    isDone ? "border-emerald-500/40 opacity-60" : "border-border"
                  }`}
                >
                  <button
                    onClick={() => toggle(t.id)}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      isDone ? "bg-emerald-500 border-emerald-500" : "border-border hover:border-primary"
                    }`}
                  >
                    {isDone && <Icon name="Check" size={14} className="text-white" />}
                  </button>

                  <Icon name={t.icon} size={20} className="text-primary shrink-0 mt-0.5" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className={`font-bold text-sm ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {t.title}
                      </p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[t.priority]}`}>
                        {PRIORITY_LABELS[t.priority]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono">
                      <span className="text-muted-foreground">
                        <Icon name="Wallet" size={10} className="inline mr-1" />
                        {t.cost === 0 ? "бесплатно" : formatRubShort(t.cost)}
                      </span>
                      <span className="text-emerald-500">
                        <Icon name="TrendingUp" size={10} className="inline mr-1" />
                        +{t.impact}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
