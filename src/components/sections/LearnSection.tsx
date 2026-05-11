import { useState, useMemo } from "react";
import { COURSES } from "@/lib/learning-courses";
import {
  getProgress,
  markLessonCompleted,
  setLastLesson,
  getOverallStats,
} from "@/lib/learningStore";
import CoursesList from "./learn/CoursesList";
import CourseDetails from "./learn/CourseDetails";
import LessonPlayer from "./learn/LessonPlayer";
import { LessonNotFound } from "./learn/shared";

/**
 * Корневой компонент учебного модуля. Держит view-state (список курсов /
 * детали курса / плеер урока) и пересчёт прогресса. Подкомпоненты —
 * CoursesList, CourseDetails и LessonPlayer — получают данные и колбэки
 * сверху.
 */

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
    <CoursesList
      stats={stats}
      progress={progress}
      refresh={refresh}
      openCourse={(courseId) => setView({ kind: "course", courseId })}
      openLesson={(courseId, lessonId) => setView({ kind: "lesson", courseId, lessonId })}
    />
  );
}
