import { useState } from "react";
import Icon from "@/components/ui/icon";
import { saveProject } from "@/lib/projectsStore";
import { notify } from "@/lib/notify";

interface Props {
  onClose: () => void;
  onNavigate: (section: string) => void;
}

interface Step {
  id: string;
  title: string;
  goal: string;
  desc: string;
  icon: string;
  section: string;
  cta: string;
  time: string;
}

const STEPS: Step[] = [
  {
    id: "scan",
    title: "Шаг 1. Отсканируйте комнату",
    goal: "Получить точные размеры",
    desc:
      "Камерой телефона снимите комнату по периметру (~30 сек). Сервис автоматически вычислит площадь, периметр, высоту, найдёт двери и окна. Эти размеры подтянутся во все следующие шаги.",
    icon: "ScanLine",
    section: "scan",
    cta: "Открыть сканер",
    time: "30–60 сек",
  },
  {
    id: "plan",
    title: "Шаг 2. Соберите план в 2D/3D",
    goal: "Расставить мебель и проёмы",
    desc:
      "В Планировщике автоматически создастся прямоугольная комната по результатам скана. Добавьте двери, окна и мебель из каталога — переключитесь в 3D, чтобы увидеть результат.",
    icon: "LayoutGrid",
    section: "planner",
    cta: "Открыть планировщик",
    time: "5–10 мин",
  },
  {
    id: "calc",
    title: "Шаг 3. Рассчитайте смету ремонта",
    goal: "Узнать стоимость работ",
    desc:
      "Размеры подтянутся из скана. Выберите регион и тариф (Эконом/Стандарт/Премиум) — получите детальную смету по 6 группам работ. Скачайте PDF или сохраните как новый вариант проекта.",
    icon: "Calculator",
    section: "calc",
    cta: "Рассчитать смету",
    time: "2 мин",
  },
  {
    id: "staging",
    title: "Шаг 4. Хоумстейджинг (если продаёте)",
    goal: "Поднять цену продажи",
    desc:
      "Если вы готовите квартиру к продаже — загрузите фото и получите AI-анализ: что улучшить и насколько вырастет цена. Опционально, можно пропустить.",
    icon: "TrendingUp",
    section: "staging",
    cta: "Открыть стейджинг",
    time: "3 мин",
  },
];

/**
 * Мастер создания нового проекта — пошаговый алгоритм использования сайта.
 * 1) Имя → 2) Сканирование → 3) Планировщик → 4) Смета → 5) Стейджинг
 * После шага «Имя» проект сохраняется в localStorage. Кнопки на каждом шаге
 * ведут в соответствующий раздел сайта.
 */
export default function NewProjectWizard({ onClose, onNavigate }: Props) {
  const [stage, setStage] = useState<"name" | "steps">("name");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const submitName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      saveProject({ name: name.trim(), scan: null });
      notify.success("Проект создан", "Следуйте пошаговому плану ниже");
      setStage("steps");
    } catch (err) {
      notify.error("Не удалось создать проект", err instanceof Error ? err.message : "");
    } finally {
      setCreating(false);
    }
  };

  const goTo = (section: string) => {
    onNavigate(section);
    onClose();
  };

  if (stage === "name") {
    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          >
            <Icon name="X" size={18} />
          </button>

          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
            <Icon name="FolderPlus" size={22} className="text-primary" />
          </div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-1">Шаг 1 из 2</p>
          <h2 className="text-2xl font-black text-foreground mb-1">Новый проект</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Назовите проект — например, «Квартира на Таганке» или «Ремонт в спальне».
          </p>

          <form onSubmit={submitName} className="space-y-3">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название проекта"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!name.trim() || creating}
                className="flex-1 bg-primary text-primary-foreground hover:opacity-90 font-bold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Icon name={creating ? "Loader2" : "ArrowRight"} size={14} className={creating ? "animate-spin" : ""} />
                {creating ? "Создаю…" : "Создать и начать"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-secondary hover:bg-secondary/70 text-foreground text-sm px-3 py-2.5 rounded-lg"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Этап «Шаги» — пошаговый алгоритм
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-y-auto p-4 animate-fade-in">
      <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl shadow-2xl my-4">
        {/* Шапка */}
        <div className="sticky top-0 bg-card border-b border-border rounded-t-2xl px-5 py-4 flex items-center gap-3 z-10">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Icon name="Route" size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-primary">План работы</p>
            <h2 className="text-lg font-black text-foreground truncate">«{name}» — что дальше?</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Закрыть"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Интро */}
        <div className="px-5 pt-5">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-2.5">
            <Icon name="Info" size={14} className="text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground leading-relaxed">
              Проект создан и сохранён локально. Ниже — порядок действий, который займёт
              <b> 10–15 минут</b> и даст вам план, смету и AI-рекомендации. Шаги можно проходить в любой день — данные сохраняются автоматически.
            </p>
          </div>
        </div>

        {/* Шаги */}
        <ol className="px-5 py-5 space-y-3">
          {STEPS.map((s, i) => (
            <li key={s.id} className="bg-secondary/40 border border-border rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black">
                    {i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="absolute left-1/2 -translate-x-px top-10 bottom-0 w-px bg-border" style={{ height: "calc(100% + 12px)" }} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <Icon name={s.icon} size={15} className="text-primary mt-0.5 shrink-0" />
                    <p className="font-bold text-foreground text-sm">{s.title}</p>
                    <span className="text-[10px] font-mono uppercase tracking-wider bg-card text-muted-foreground px-2 py-0.5 rounded ml-auto">
                      {s.time}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-primary mt-1">
                    Цель: {s.goal}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{s.desc}</p>

                  <button
                    onClick={() => goTo(s.section)}
                    className="mt-3 inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:opacity-90 font-bold text-xs px-3 py-2 rounded-lg"
                  >
                    {s.cta}
                    <Icon name="ArrowRight" size={12} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {/* Финальный блок */}
        <div className="px-5 pb-5">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-2.5">
            <Icon name="CheckCircle2" size={14} className="text-emerald-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">После всех шагов</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Получите полный пакет: 3D-план, детальную смету в PDF, чек-лист стейджинга.
                Можно поделиться с дизайнером или мастером ссылкой одним кликом.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-3 w-full bg-secondary hover:bg-secondary/70 text-foreground font-bold text-sm py-2.5 rounded-lg"
          >
            Закрыть и начать позже
          </button>
        </div>
      </div>
    </div>
  );
}
