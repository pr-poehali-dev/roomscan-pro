import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { COURSES } from "@/lib/learning-courses";
import { getCourseProgress, resetProgress } from "@/lib/learningStore";
import { notify, confirmAction } from "@/lib/notify";

/**
 * Главный экран учебного модуля: общий прогресс, кнопка «Продолжить»,
 * сетка курсов и галерея бейджей.
 *
 * Презентационный компонент — все данные (stats, progress) и колбэки
 * (refresh, openCourse, openLesson) приходят сверху, чтобы вся логика
 * прогресса и переходов осталась в одном месте в LearnSection.
 */
interface Stats {
  lessonsDone: number;
  totalLessons: number;
  badgesEarned: number;
  totalBadges: number;
  percent: number;
}

interface Progress {
  completedLessons: string[];
  earnedBadges: string[];
  lastLesson?: { courseId: string; lessonId: string };
  updatedAt: number;
}

interface Props {
  stats: Stats;
  progress: Progress;
  refresh: () => void;
  openCourse: (courseId: string) => void;
  openLesson: (courseId: string, lessonId: string) => void;
}

export default function CoursesList({ stats, progress, refresh, openCourse, openLesson }: Props) {
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
                onClick={() => openLesson(course.id, lesson.id)}
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
                onClick={() => openCourse(course.id)}
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
