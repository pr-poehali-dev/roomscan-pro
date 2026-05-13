import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Icon from "@/components/ui/icon";
import { getLastScan, getProjectItems } from "@/lib/scanStore";

/**
 * Блок прогресса проекта на главной — чеклист шагов воронки.
 * Подсвечивает, что уже сделано, что осталось, и ведёт пользователя дальше.
 */
interface Props {
  onNavigate?: (section: string) => void;
}

interface Step {
  id: string;
  label: string;
  hint: string;
  icon: string;
  section: string;
  done: boolean;
}

export default function ProjectProgressBlock({ onNavigate }: Props) {
  const [steps, setSteps] = useState<Step[]>(() => computeSteps());

  useEffect(() => {
    const reload = () => setSteps(computeSteps());
    window.addEventListener("roomscan:lastScan:changed", reload);
    window.addEventListener("roomscan:project:changed", reload);
    return () => {
      window.removeEventListener("roomscan:lastScan:changed", reload);
      window.removeEventListener("roomscan:project:changed", reload);
    };
  }, []);

  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  // показываем блок только если есть хоть какой-то прогресс или сохранённый скан
  if (doneCount === 0) return null;

  return (
    <section className="px-6 lg:px-12 max-w-6xl mx-auto w-full">
      <Card>
        <CardContent className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/15 text-primary">
                <Icon name="ListChecks" size={20} />
              </div>
              <div>
                <p className="font-black text-foreground text-lg">
                  Прогресс проекта · {pct}%
                </p>
                <p className="text-sm text-muted-foreground">
                  Выполнено {doneCount} из {steps.length} шагов
                </p>
              </div>
            </div>
          </div>

          <Progress value={pct} className="mb-5 h-2" />

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {steps.map((step) => (
              <li key={step.id}>
                <button
                  onClick={() => onNavigate?.(step.section)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3 ${
                    step.done
                      ? "bg-primary/5 border-primary/30"
                      : "bg-card hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      step.done
                        ? "bg-primary text-primary-foreground"
                        : "border-2 border-muted-foreground/30"
                    }`}
                  >
                    {step.done && <Icon name="Check" size={12} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium ${
                        step.done ? "text-foreground" : "text-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{step.hint}</p>
                  </div>
                  <Icon
                    name={step.icon}
                    size={16}
                    className={step.done ? "text-primary" : "text-muted-foreground"}
                  />
                </button>
              </li>
            ))}
          </ul>

          {pct < 100 && (
            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  const next = steps.find((s) => !s.done);
                  if (next) onNavigate?.(next.section);
                }}
              >
                Следующий шаг
                <Icon name="ArrowRight" size={14} className="ml-1.5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function computeSteps(): Step[] {
  const scan = getLastScan();
  const items = getProjectItems();
  const hasSource = (src: string) => items.some((i) => i.source === src);

  return [
    {
      id: "scan",
      label: "Сканировать комнату",
      hint: scan ? `${scan.area.toFixed(1)} м²` : "30 секунд с телефона",
      icon: "ScanLine",
      section: "scan",
      done: Boolean(scan),
    },
    {
      id: "planner",
      label: "Расставить мебель",
      hint: hasSource("furniture") ? "Мебель в корзине" : "2D/3D-планировщик",
      icon: "LayoutGrid",
      section: "planner",
      done: hasSource("furniture"),
    },
    {
      id: "walls",
      label: "Выбрать стены",
      hint: hasSource("walls") ? "Покрытия выбраны" : "Обои, краска, панели",
      icon: "Wallpaper",
      section: "walls",
      done: hasSource("walls"),
    },
    {
      id: "tiles",
      label: "Подобрать плитку",
      hint: hasSource("tiles") ? "Плитка в корзине" : "Для пола и стен",
      icon: "Grid2x2",
      section: "tiles",
      done: hasSource("tiles"),
    },
    {
      id: "openings",
      label: "Окна и двери",
      hint: hasSource("openings") ? "Добавлено" : "Расчёт с установкой",
      icon: "DoorOpen",
      section: "openings",
      done: hasSource("openings"),
    },
    {
      id: "calc",
      label: "Рассчитать смету",
      hint: "Эконом / Стандарт / Премиум",
      icon: "Calculator",
      section: "calc",
      done: false,
    },
  ];
}
