import Icon from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Course } from "@/lib/learning-courses";
import { isLessonCompleted, getCourseProgress } from "@/lib/learningStore";

/**
 * Экран курса: шапка с описанием и бейджем + список уроков с маркерами прохождения.
 * Кликом по уроку родитель решает, какой плеер открыть.
 */
interface Props {
  course: Course;
  onBack: () => void;
  onStartLesson: (lessonId: string) => void;
}

export default function CourseDetails({ course, onBack, onStartLesson }: Props) {
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
