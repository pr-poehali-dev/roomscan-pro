/**
 * Лёгкий store состояния онбординга (первого знакомства с приложением).
 * Использует localStorage. При желании можно перезапустить тур из Помощи / Профиля.
 */

const KEY = "roomscan:onboarded:v1";

export function isOnboarded(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function markOnboarded() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* noop */
  }
}

export function resetOnboarding() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
