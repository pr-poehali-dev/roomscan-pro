import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { markOnboarded } from "@/lib/onboardingStore";

interface Step {
  /** Иконка lucide */
  icon: string;
  /** Подзаголовок-меточка */
  meta: string;
  /** Главный заголовок шага */
  title: string;
  /** Описание */
  description: string;
  /** Подсказки-буллеты */
  bullets: string[];
  /** Куда перейти при «Открыть раздел» */
  navigateTo?: string;
  /** Текст кнопки CTA */
  ctaLabel?: string;
}

const STEPS: Step[] = [
  {
    icon: "ScanLine",
    meta: "Шаг 1 · 30 секунд",
    title: "Отсканируй или нарисуй комнату",
    description:
      "Используй камеру телефона или загрузи фото — AI определит размеры, проёмы, окна. Альтернатива: нарисуй план вручную в редакторе.",
    bullets: [
      "WebXR-сканирование на Android (Chrome)",
      "Фотограмметрия по QR-коду на любом устройстве",
      "Точность до ±2 см при оптимальных условиях",
    ],
    navigateTo: "scan",
    ctaLabel: "Начать сканирование",
  },
  {
    icon: "Sofa",
    meta: "Шаг 2 · 1 минута",
    title: "Подбери мебель и отделку",
    description:
      "80+ моделей мебели и 85+ моделей плитки от ведущих брендов. Расставь в плане одним кликом — размеры точные.",
    bullets: [
      "Каталог мебели с фильтрами по бренду, стилю, цене",
      "Каталог плитки и керамогранита (Italon, Atlas Concorde, Kerama Marazzi)",
      "AR-примерка прямо в твоей комнате",
    ],
    navigateTo: "catalog",
    ctaLabel: "Открыть каталог",
  },
  {
    icon: "FileDown",
    meta: "Шаг 3 · 30 секунд",
    title: "Получи смету и проект",
    description:
      "Готовый PDF с планом, 3D-визуализация, спецификация под закупку (Excel/CSV) и смета ремонта по 6 категориям работ.",
    bullets: [
      "PDF-комплект чертежей: планы, фасады, разрезы",
      "Excel-спецификация для закупки материалов",
      "Смета с учётом региональных коэффициентов",
    ],
    navigateTo: "export",
    ctaLabel: "Посмотреть экспорты",
  },
];

interface Props {
  /** Колбэк навигации между секциями (передаётся из Index.tsx) */
  onNavigate?: (section: string) => void;
  /** Закрыть тур */
  onClose: () => void;
}

/**
 * Онбординг для нового пользователя.
 * 3 шага: сканирование → каталог → экспорт.
 * Каждый шаг — отдельный экран с иконкой, описанием, буллетами и CTA.
 * После закрытия флаг сохраняется в localStorage, повторно не показывается.
 */
export default function OnboardingTour({ onNavigate, onClose }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function finish() {
    markOnboarded();
    onClose();
  }

  function handleCta() {
    if (current.navigateTo && onNavigate) {
      onNavigate(current.navigateTo);
    }
    finish();
  }

  function next() {
    if (isLast) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-background/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onb-title"
    >
      <div
        className="bg-card border border-border rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Прогресс-бар */}
        <div className="h-1 bg-secondary relative">
          <div
            className="absolute inset-y-0 left-0 bg-primary transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6 lg:p-8">
          {/* Топ — кнопка пропуска */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
                <Icon name={current.icon} size={22} className="text-primary" />
              </div>
              <div>
                <p className="t-meta text-primary mb-0.5">{current.meta}</p>
                <p className="text-[11px] font-mono text-muted-foreground">
                  {step + 1} / {STEPS.length}
                </p>
              </div>
            </div>
            <button
              onClick={finish}
              className="text-muted-foreground hover:text-foreground transition-colors text-xs font-bold uppercase tracking-wider"
            >
              Пропустить
            </button>
          </div>

          {/* Заголовок и описание */}
          <h2 id="onb-title" className="h-block text-foreground mb-3">
            {current.title}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-5">
            {current.description}
          </p>

          {/* Буллеты */}
          <ul className="space-y-2 mb-7">
            {current.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="Check" size={12} />
                </span>
                <span className="leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>

          {/* Точки прогресса */}
          <div className="flex items-center gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Перейти к шагу ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? "w-8 bg-primary"
                    : i < step
                      ? "w-1.5 bg-primary/60"
                      : "w-1.5 bg-border hover:bg-muted-foreground"
                }`}
              />
            ))}
          </div>

          {/* Кнопки */}
          <div className="flex items-center gap-2 flex-wrap">
            {current.ctaLabel && current.navigateTo && (
              <button
                onClick={handleCta}
                className="flex-1 min-w-[180px] bg-primary text-primary-foreground font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Icon name={current.icon} size={15} />
                {current.ctaLabel}
              </button>
            )}
            <button
              onClick={next}
              className="px-4 py-3 rounded-xl bg-secondary text-foreground font-bold text-sm hover:bg-secondary/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {isLast ? "Завершить" : "Дальше"}
              <Icon
                name={isLast ? "Check" : "ArrowRight"}
                size={14}
                className="inline ml-1.5"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
