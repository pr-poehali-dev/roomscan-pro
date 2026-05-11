import { useState, useEffect, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type Course, type Lesson, type LessonStep } from "@/lib/learning-courses";
import { notify } from "@/lib/notify";
import { stepTypeLabel } from "./shared";

/**
 * Пошаговый плеер урока: введение → возможность → совет → вопрос → финал.
 * Логика прохождения шагов и quiz полностью изолирована внутри компонента —
 * наверх отдаются только onComplete (отметить урок пройденным),
 * onBack (выйти к курсу) и onNextLesson (перейти к следующему уроку).
 */
interface Props {
  course: Course;
  lesson: Lesson;
  onNavigate?: (section: string) => void;
  onComplete: () => void;
  onBack: () => void;
  onNextLesson: (lessonId: string) => void;
}

export default function LessonPlayer({
  course,
  lesson,
  onNavigate,
  onComplete,
  onBack,
  onNextLesson,
}: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState<Record<number, number>>({});
  const [completed, setCompleted] = useState(false);

  const step = lesson.steps[stepIdx];
  const isLast = stepIdx === lesson.steps.length - 1;

  useEffect(() => {
    setStepIdx(0);
    setQuizAnswered({});
    setCompleted(false);
  }, [lesson.id]);

  const handleNext = () => {
    if (step.type === "quiz") {
      const selected = quizAnswered[stepIdx];
      if (selected === undefined) {
        notify.warn("Выберите вариант ответа");
        return;
      }
      const isCorrect = step.options?.[selected]?.correct;
      if (!isCorrect) {
        notify.error("Неверный ответ", "Попробуйте ещё раз — подсказка ниже");
        return;
      }
    }

    if (isLast) {
      if (!completed) {
        onComplete();
        setCompleted(true);
        notify.success("Урок пройден!", `«${lesson.title}» отмечен как завершённый`);
      }
      return;
    }
    setStepIdx((i) => i + 1);
  };

  const handlePrev = () => {
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  };

  const handleCta = (s: LessonStep) => {
    if (s.navigateTo && onNavigate) {
      onNavigate(s.navigateTo);
    }
  };

  // Следующий урок в курсе
  const nextLesson = useMemo(() => {
    const idx = course.lessons.findIndex((l) => l.id === lesson.id);
    return idx >= 0 && idx < course.lessons.length - 1 ? course.lessons[idx + 1] : null;
  }, [course, lesson]);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Icon name="ChevronLeft" size={14} />
        К курсу «{course.title}»
      </button>

      <Card className="overflow-hidden">
        {/* Прогресс-бар */}
        <div className="h-1 bg-secondary relative">
          <div
            className="absolute inset-y-0 left-0 bg-primary transition-all duration-300"
            style={{ width: `${((stepIdx + 1) / lesson.steps.length) * 100}%` }}
          />
        </div>

        <div className="p-6 md:p-8">
          {/* Заголовок шага */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                <Icon name={step.icon} size={22} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold">
                  {stepTypeLabel(step.type)}
                </p>
                <p className="text-[11px] font-mono text-muted-foreground">
                  Шаг {stepIdx + 1} / {lesson.steps.length}
                </p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Закрыть"
            >
              <Icon name="X" size={18} />
            </button>
          </div>

          <h2 className="text-2xl font-black text-foreground tracking-tight mb-3">{step.title}</h2>

          {step.body && (
            <p className="text-base text-muted-foreground leading-relaxed mb-5">{step.body}</p>
          )}

          {step.bullets && step.bullets.length > 0 && (
            <ul className="space-y-2 mb-5">
              {step.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name="Check" size={12} />
                  </span>
                  <span className="leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          )}

          {/* CTA — открыть раздел */}
          {step.navigateTo && step.ctaLabel && (
            <Button onClick={() => handleCta(step)} className="mb-5">
              <Icon name="ExternalLink" size={14} className="mr-1.5" />
              {step.ctaLabel}
            </Button>
          )}

          {/* Quiz */}
          {step.type === "quiz" && step.question && step.options && (
            <div className="space-y-3 mb-5">
              <p className="font-semibold text-foreground">{step.question}</p>
              <div className="space-y-2">
                {step.options.map((opt, i) => {
                  const selected = quizAnswered[stepIdx] === i;
                  const showResult = selected;
                  return (
                    <button
                      key={i}
                      onClick={() => setQuizAnswered({ ...quizAnswered, [stepIdx]: i })}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                        showResult
                          ? opt.correct
                            ? "border-primary bg-primary/10"
                            : "border-destructive bg-destructive/10"
                          : "border-border hover:border-primary/50 bg-secondary/30"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        showResult
                          ? opt.correct
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-destructive bg-destructive text-destructive-foreground"
                          : "border-border"
                      }`}>
                        {showResult && (
                          <Icon name={opt.correct ? "Check" : "X"} size={12} />
                        )}
                      </div>
                      <span className="text-sm font-medium text-foreground flex-1">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              {quizAnswered[stepIdx] !== undefined && step.explain && (
                <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                  step.options[quizAnswered[stepIdx]]?.correct
                    ? "bg-primary/5 border border-primary/20"
                    : "bg-destructive/5 border border-destructive/20"
                }`}>
                  <Icon
                    name={step.options[quizAnswered[stepIdx]]?.correct ? "Lightbulb" : "Info"}
                    size={16}
                    className={step.options[quizAnswered[stepIdx]]?.correct ? "text-primary shrink-0 mt-0.5" : "text-destructive shrink-0 mt-0.5"}
                  />
                  <p className="text-foreground/90 leading-relaxed">{step.explain}</p>
                </div>
              )}
            </div>
          )}

          {/* Финальный экран после прохождения */}
          {isLast && completed && (
            <Card className="p-4 mb-5 bg-primary/10 border-primary/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                  <Icon name="Trophy" size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">Урок завершён!</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {nextLesson
                      ? `Следующий урок: «${nextLesson.title}»`
                      : `Это был последний урок курса «${course.title}». Вы получили бейдж «${course.badge.name}»!`}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Кнопки */}
          <div className="flex items-center gap-2 flex-wrap justify-between">
            <Button variant="ghost" onClick={handlePrev} disabled={stepIdx === 0}>
              <Icon name="ArrowLeft" size={14} className="mr-1.5" />
              Назад
            </Button>

            {isLast && completed ? (
              nextLesson ? (
                <Button onClick={() => onNextLesson(nextLesson.id)}>
                  Следующий урок
                  <Icon name="ArrowRight" size={14} className="ml-1.5" />
                </Button>
              ) : (
                <Button onClick={onBack}>
                  <Icon name="Trophy" size={14} className="mr-1.5" />
                  К курсу
                </Button>
              )
            ) : (
              <Button onClick={handleNext}>
                {isLast ? "Завершить урок" : "Дальше"}
                <Icon name={isLast ? "Check" : "ArrowRight"} size={14} className="ml-1.5" />
              </Button>
            )}
          </div>

          {/* Точки прогресса */}
          <div className="flex items-center justify-center gap-1.5 mt-5">
            {lesson.steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStepIdx(i)}
                aria-label={`Перейти к шагу ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIdx
                    ? "w-8 bg-primary"
                    : i < stepIdx
                      ? "w-1.5 bg-primary/60"
                      : "w-1.5 bg-border hover:bg-muted-foreground"
                }`}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
