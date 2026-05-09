/**
 * Хранилище избранных товаров (Wishlist).
 * localStorage + событие "roomscan:favorites:changed" для синхронизации UI.
 *
 * In-memory cache: парсим JSON только один раз и при внешних изменениях.
 * Это критично, потому что isFavorite() вызывается для каждой карточки
 * каталога на каждом рендере (80+ раз на список).
 */

const KEY = "roomscan:favorites";
const EVENT = "roomscan:favorites:changed";

let cache: Set<number> | null = null;

function loadFromStorage(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.filter((n) => typeof n === "number") : []);
  } catch {
    return new Set();
  }
}

function ensureCache(): Set<number> {
  if (cache === null) cache = loadFromStorage();
  return cache;
}

// Подписка на изменения из других вкладок (storage event) и собственных событий
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) cache = loadFromStorage();
  });
}

function persist() {
  if (typeof window === "undefined" || !cache) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(Array.from(cache)));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* quota */
  }
}

export function getFavorites(): number[] {
  return Array.from(ensureCache());
}

export function isFavorite(id: number): boolean {
  return ensureCache().has(id);
}

export function toggleFavorite(id: number): boolean {
  const set = ensureCache();
  if (set.has(id)) {
    set.delete(id);
    persist();
    return false;
  }
  set.add(id);
  persist();
  return true;
}

export function clearFavorites() {
  cache = new Set();
  persist();
}

export const FAVORITES_EVENT = EVENT;
