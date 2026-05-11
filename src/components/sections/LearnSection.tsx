import { useState, useEffect, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { COURSES, type Course, type Lesson, type LessonStep } from "@/lib/learning-courses";
import {
  getProgress,
  isLessonCompleted,
  markLessonCompleted,
  setLastLesson,
  getCourseProgress,
  getOverallStats,
  resetProgress,
} from "@/lib/learningStore";
import { notify, confirmAction } from "@/lib/notify";

interface Props {
  /** Колбэк навигации к разделу (передаётся из Index.tsx) */
  onNavigate?: (section: string) => void;
}

type View =
  | { kind: "list" }
  | { kind: "course"; courseId: string }
  | { kind: "lesson"; courseId: string; lessonId: string };

export default function LearnSection({ onNavigate }: Props) {
  const [view, setView] = useState<View>({ kind: "list" });
  const [tick, setTick] = useState(0); // принудительный ререндер после изменения прогресса

  const refresh = () => setTick((t) => t + 1);

  // tick — реактивная зависимость для useMemo
  const stats = useMemo(() => getOverallStats(), [tick]);
  const progress = useMemo(() => getProgress(), [tick]);

  if (view.kind === "lesson") {
    const course = COURSES.find((c) => c.id === view.courseId);
    const lesson = course?.lessons.find((l) => l.id === view.lessonId);
    if (!course || !lesson) {
      return <LessonNotFound onBack={() => setView({ kind: "list" })} />;
    }
    return (
      <LessonPlayer
        course={course}
        lesson={lesson}
        onNavigate={onNavigate}
        onComplete={() => {
          markLessonCompleted(course.id, lesson.id);
          refresh();
        }}
        onBack={() => {
          refresh();
          setView({ kind: "course", courseId: course.id });
        }}
        onNextLesson={(nextLessonId) => {
          setLastLesson(course.id, nextLessonId);
          setView({ kind: "lesson", courseId: course.id, lessonId: nextLessonId });
        }}
      />
    );
  }

  if (view.kind === "course") {
    const course = COURSES.find((c) => c.id === view.courseId);
    if (!course) return <LessonNotFound onBack={() => setView({ kind: "list" })} />;
    return (
      <CourseDetails
        course={course}
        onBack={() => setView({ kind: "list" })}
        onStartLesson={(lessonId) => {
          setLastLesson(course.id, lessonId);
          setView({ kind: "lesson", courseId: course.id, lessonId });
        }}
      />
    );
  }

  // === Список курсов ===
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Icon name="GraduationCap" size={20} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-primary">RoomScan Academy</span>
        </div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Учебный модуль</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          Интерактивные курсы по всем разделам сайта. Проходите уроки, отвечайте на вопросы,
          получайте бейджи и осваивайте сервис в своём темпе.
        </p>
      </header>

      {/* Общий прогресс */}
      <Card className="p-5 bg-gradient-to-br from-primary/5 to-primary/0 border-primary/20">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-1 min-w-[260px]">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
              <Icon name="Rocket" size={26} className="text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground text-lg">Ваш прогресс</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {stats.lessonsDone === 0
                  ? "Начните любой курс — это займёт меньше 10 минут"
                  : `Пройдено ${stats.lessonsDone} из ${stats.totalLessons} уроков · ${stats.badgesEarned} из ${stats.totalBadges} бейджей`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-black text-primary font-mono">{stats.percent}%</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">завершено</p>
            </div>
            {stats.lessonsDone > 0 && (
              <Button variant="ghost" size="sm" onClick={async () => {
                const ok = await confirmAction("Сбросить весь прогресс обучения?", { confirmLabel: "Сбросить" });
                if (ok) {
                  resetProgress();
                  refresh();
                  notify.info("Прогресс сброшен");
                }
              }}>
                <Icon name="RotateCcw" size={14} />
              </Button>
            )}
          </div>
        </div>
        <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${stats.percent}%` }}
          />
        </div>

        {progress.lastLesson && (() => {
          const course = COURSES.find((c) => c.id === progress.lastLesson!.courseId);
          const lesson = course?.lessons.find((l) => l.id === progress.lastLesson!.lessonId);
          if (!course || !lesson) return null;
          return (
            <div className="mt-4 pt-4 border-t border-primary/20 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm">
                <span className="text-muted-foreground">Последний урок: </span>
                <span className="font-semibold text-foreground">{lesson.title}</span>
                <span className="text-muted-foreground"> · {course.title}</span>
              </div>
              <Button
                size="sm"
                onClick={() => setView({ kind: "lesson", courseId: course.id, lessonId: lesson.id })}
              >
                <Icon name="Play" size={12} className="mr-1.5" />
                Продолжить
              </Button>
            </div>
          );
        })()}
      </Card>

      {/* Курсы */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-3">Курсы</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {COURSES.map((course) => {
            const p = getCourseProgress(course.id);
            const earned = progress.earnedBadges.includes(course.id);
            return (
              <Card
                key={course.id}
                className={`p-5 cursor-pointer hover:border-primary transition-all bg-gradient-to-br ${course.accent} group relative overflow-hidden`}
                onClick={() => setView({ kind: "course", courseId: course.id })}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-background/80 backdrop-blur rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Icon name={course.icon} size={22} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground text-base leading-tight">{course.title}</h3>
                      {earned && (
                        <Icon name="BadgeCheck" size={18} className="text-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-1">{course.audience}</p>
                  </div>
                </div>

                <p className="text-sm text-foreground/80 leading-relaxed mb-4 line-clamp-3">{course.desc}</p>

                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono text-muted-foreground">
                    {p.done}/{p.total} уроков
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {course.difficulty}
                  </Badge>
                </div>

                <div className="h-1.5 bg-background/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${p.percent}%` }}
                  />
                </div>

                {earned && (
                  <div className="mt-3 pt-3 border-t border-primary/20 flex items-center gap-2 text-xs">
                    <Icon name={course.badge.icon} size={14} className="text-primary" />
                    <span className="font-semibold text-foreground">Получен бейдж «{course.badge.name}»</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Бейджи */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="Award" size={18} className="text-primary" />
          <h2 className="text-lg font-bold text-foreground">Ваши бейджи</h2>
          <span className="text-sm text-muted-foreground font-mono">
            {stats.badgesEarned} / {stats.totalBadges}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {COURSES.map((c) => {
            const earned = progress.earnedBadges.includes(c.id);
            return (
              <div
                key={c.id}
                className={`p-4 rounded-xl border text-center transition-all ${
                  earned
                    ? "bg-primary/10 border-primary/40"
                    : "bg-secondary/30 border-border opacity-60 grayscale"
                }`}
                title={earned ? "Получено!" : `Завершите курс «${c.title}»`}
              >
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  earned ? "bg-primary/20" : "bg-secondary"
                }`}>
                  <Icon name={c.badge.icon} size={22} className={earned ? "text-primary" : "text-muted-foreground"} />
                </div>
                <p className="text-xs font-semibold text-foreground leading-tight">{c.badge.name}</p>
                {!earned && (
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                    <Icon name="Lock" size={9} className="inline mr-1" />
                    заблокирован
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ============ CourseDetails ============ */

function CourseDetails({
  course,
  onBack,
  onStartLesson,
}: {
  course: Course;
  onBack: () => void;
  onStartLesson: (lessonId: string) => void;
}) {
  const p = getCourseProgress(course.id);
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Icon name="ChevronLeft" size={14} />
        Все курсы
      </button>

      <Card className={`p-6 bg-gradient-to-br ${course.accent} border-primary/20`}>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-background/80 backdrop-blur rounded-2xl flex items-center justify-center shrink-0">
            <Icon name={course.icon} size={28} className="text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="font-mono text-xs">{course.difficulty}</Badge>
              <span className="text-xs text-muted-foreground font-mono">{course.audience}</span>
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">{course.title}</h1>
            <p className="text-muted-foreground mt-2">{course.desc}</p>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-primary/20 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Icon name={course.badge.icon} size={18} className="text-primary" />
            <span className="text-sm">
              <span className="font-semibold text-foreground">Бейдж: </span>
              <span className="text-foreground">«{course.badge.name}»</span>
            </span>
          </div>
          <div className="text-sm font-mono text-muted-foreground">
            {p.done}/{p.total} уроков · {p.percent}%
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        {course.lessons.map((lesson, idx) => {
          const done = isLessonCompleted(course.id, lesson.id);
          return (
            <Card
              key={lesson.id}
              className={`p-4 cursor-pointer hover:border-primary transition-colors flex items-center gap-4 ${
                done ? "bg-primary/5" : ""
              }`}
              onClick={() => onStartLesson(lesson.id)}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                done ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
              }`}>
                {done ? (
                  <Icon name="Check" size={18} />
                ) : (
                  <span className="font-bold font-mono text-sm">{idx + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon name={lesson.icon} size={14} className="text-primary shrink-0" />
                  <p className="font-bold text-foreground truncate">{lesson.title}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{lesson.subtitle}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
                  ~{lesson.duration} мин
                </span>
                <Icon name={done ? "RotateCcw" : "ArrowRight"} size={16} className="text-primary" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ============ LessonPlayer ============ */

function LessonPlayer({
  course,
  lesson,
  onNavigate,
  onComplete,
  onBack,
  onNextLesson,
}: {
  course: Course;
  lesson: Lesson;
  onNavigate?: (section: string) => void;
  onComplete: () => void;
  onBack: () => void;
  onNextLesson: (lessonId: string) => void;
}) {
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

function LessonNotFound({ onBack }: { onBack: () => void }) {
  return (
    <Card className="p-10 text-center">
      <Icon name="SearchX" size={40} className="mx-auto text-muted-foreground mb-3" />
      <p className="font-semibold text-foreground">Урок не найден</p>
      <Button onClick={onBack} variant="ghost" className="mt-3">
        Вернуться к курсам
      </Button>
    </Card>
  );
}

function stepTypeLabel(t: LessonStep["type"]): string {
  switch (t) {
    case "intro": return "Введение";
    case "feature": return "Возможность";
    case "tip": return "Совет";
    case "quiz": return "Вопрос";
    case "cta": return "Финал";
  }
}
