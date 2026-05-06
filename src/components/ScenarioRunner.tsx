import { useState } from "react";
import Icon from "@/components/ui/icon";
import {
  useScenario,
  completeStep,
  stopScenario,
  type ScenarioSection,
} from "@/lib/scenarios";

interface Props {
  activeSection: string;
  onNavigate: (section: ScenarioSection) => void;
}

export default function ScenarioRunner({ activeSection, onNavigate }: Props) {
  const { state, flow, currentStep, currentStepIdx, isFinished, progress } = useScenario();
  const [collapsed, setCollapsed] = useState(false);

  if (!state || !flow) return null;

  const isOnTargetSection = currentStep && activeSection === currentStep.section;

  // Завершённый сценарий — показываем итог
  if (isFinished) {
    return (
      <div className="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 z-40 animate-fade-in">
        <div className="bg-card border-2 border-primary rounded-xl shadow-2xl shadow-primary/20 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Icon name="PartyPopper" size={20} className="text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono uppercase tracking-wider text-primary mb-0.5">Сценарий завершён</p>
              <p className="font-bold text-foreground text-sm">{flow.persona}</p>
              <p className="text-xs text-muted-foreground mt-1">{flow.outcome}</p>
            </div>
            <button
              onClick={stopScenario}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Закрыть"
            >
              <Icon name="X" size={16} />
            </button>
          </div>
          <button
            onClick={stopScenario}
            className="w-full mt-3 bg-primary text-primary-foreground font-bold py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm"
          >
            <Icon name="Check" size={14} />
            Готово
          </button>
        </div>
      </div>
    );
  }

  if (!currentStep) return null;

  // Свёрнутая компактная плашка
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-40 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 px-4 py-3 flex items-center gap-2 hover:opacity-90 transition-all animate-fade-in"
      >
        <Icon name={flow.icon} size={16} />
        <span className="text-xs font-bold font-mono">
          Шаг {currentStepIdx + 1}/{flow.steps.length}
        </span>
        <Icon name="ChevronUp" size={14} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 z-40 animate-fade-in">
      <div className="bg-card border-2 border-primary/40 rounded-xl shadow-2xl shadow-primary/10 overflow-hidden">
        {/* Прогресс-полоса */}
        <div className="h-1 bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="p-4">
          <div className="flex items-start gap-2 mb-3">
            <div className="w-8 h-8 bg-primary/15 rounded-lg flex items-center justify-center shrink-0">
              <Icon name={flow.icon} size={15} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Сценарий · шаг {currentStepIdx + 1} из {flow.steps.length}
              </p>
              <p className="font-bold text-foreground text-sm truncate">{flow.persona}</p>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Свернуть"
            >
              <Icon name="Minus" size={14} />
            </button>
            <button
              onClick={() => {
                if (confirm("Прервать сценарий? Прогресс будет потерян.")) stopScenario();
              }}
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
              aria-label="Прервать"
            >
              <Icon name="X" size={14} />
            </button>
          </div>

          {/* Текущий шаг */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name={currentStep.icon} size={14} className="text-primary" />
              <p className="text-sm font-bold text-foreground">{currentStep.title}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              {currentStep.description}
            </p>
            {currentStep.hint && (
              <div className="flex items-start gap-1.5 text-[11px] text-primary/80 mt-2 pt-2 border-t border-primary/15">
                <Icon name="Lightbulb" size={10} className="mt-0.5 shrink-0" />
                <span>{currentStep.hint}</span>
              </div>
            )}
          </div>

          {/* Действия */}
          <div className="flex gap-2">
            {!isOnTargetSection ? (
              <button
                onClick={() => onNavigate(currentStep.section)}
                className="flex-1 bg-primary text-primary-foreground font-bold py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm"
              >
                <Icon name="ArrowRight" size={14} />
                Перейти в раздел
              </button>
            ) : (
              <button
                onClick={() => completeStep(currentStep.id)}
                className="flex-1 bg-primary text-primary-foreground font-bold py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm"
              >
                <Icon name="Check" size={14} />
                Шаг выполнен
              </button>
            )}
          </div>

          {/* Мини-степпер */}
          <div className="flex items-center gap-1 mt-3 justify-center">
            {flow.steps.map((s, i) => {
              const done = state.completed.includes(s.id);
              const active = i === currentStepIdx;
              return (
                <div
                  key={s.id}
                  className={`h-1.5 rounded-full transition-all ${
                    done
                      ? "bg-primary w-4"
                      : active
                      ? "bg-primary/60 w-6"
                      : "bg-border w-3"
                  }`}
                  title={s.title}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
