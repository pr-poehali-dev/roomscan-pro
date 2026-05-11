/**
 * Хранилище прогресса учебного модуля.
 * Уроки помечаются как пройденные после прохождения всех шагов (включая верный ответ на quiz).
 * Бейджи выдаются после завершения всех уроков курса.
 */

import { COURSES, TOTAL_LESSONS } from "./learning-courses";

const KEY = "roomscan:learning";

interface Progress {
  /** Множество ID завершённых уроков в формате `${courseId}/${lessonId}` */
  completedLessons: string[];
  /** Множество ID полученных бейджей (id курса) */
  earnedBadges: string[];
  /** Последний открытый урок (для кнопки «Продолжить») */
  lastLesson?: { courseId: string; lessonId: string };
  updatedAt: number;
}

const EMPTY: Progress = {
  completedLessons: [],
  earnedBadges: [],
  updatedAt: 0,
};

function read(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    return {
      completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
      earnedBadges: Array.isArray(parsed.earnedBadges) ? parsed.earnedBadges : [],
      lastLesson: parsed.lastLesson,
      updatedAt: parsed.updatedAt || 0,
    };
  } catch {
    return { ...EMPTY };
  }
}

function write(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...p, updatedAt: Date.now() }));
  } catch (err) {
    console.warn("Не удалось сохранить прогресс обучения", err);
  }
}

export function getProgress(): Progress {
  return read();
}

export function isLessonCompleted(courseId: string, lessonId: string): boolean {
  return read().completedLessons.includes(`${courseId}/${lessonId}`);
}

export function markLessonCompleted(courseId: string, lessonId: string) {
  const p = read();
  const key = `${courseId}/${lessonId}`;
  if (!p.completedLessons.includes(key)) {
    p.completedLessons.push(key);
  }

  // Проверяем — все ли уроки курса пройдены, выдаём бейдж
  const course = COURSES.find((c) => c.id === courseId);
  if (course) {
    const allDone = course.lessons.every((l) => p.completedLessons.includes(`${courseId}/${l.id}`));
    if (allDone && !p.earnedBadges.includes(courseId)) {
      p.earnedBadges.push(courseId);
    }
  }

  write(p);
}

export function setLastLesson(courseId: string, lessonId: string) {
  const p = read();
  p.lastLesson = { courseId, lessonId };
  write(p);
}

export function getCourseProgress(courseId: string): { done: number; total: number; percent: number } {
  const course = COURSES.find((c) => c.id === courseId);
  if (!course) return { done: 0, total: 0, percent: 0 };
  const p = read();
  const done = course.lessons.filter((l) => p.completedLessons.includes(`${courseId}/${l.id}`)).length;
  const total = course.lessons.length;
  return { done, total, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export function getOverallStats(): {
  lessonsDone: number;
  totalLessons: number;
  badgesEarned: number;
  totalBadges: number;
  percent: number;
} {
  const p = read();
  const lessonsDone = p.completedLessons.length;
  return {
    lessonsDone,
    totalLessons: TOTAL_LESSONS,
    badgesEarned: p.earnedBadges.length,
    totalBadges: COURSES.length,
    percent: TOTAL_LESSONS > 0 ? Math.round((lessonsDone / TOTAL_LESSONS) * 100) : 0,
  };
}

export function resetProgress() {
  write({ ...EMPTY });
}
