/**
 * Хранилище избранных товаров (Wishlist).
 * Простой localStorage + событие "roomscan:favorites:changed" для синхронизации UI.
 */

const KEY = "roomscan:favorites";
const EVENT = "roomscan:favorites:changed";

function safeRead(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function safeWrite(ids: number[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* quota */
  }
}

export function getFavorites(): number[] {
  return safeRead();
}

export function isFavorite(id: number): boolean {
  return safeRead().includes(id);
}

export function toggleFavorite(id: number): boolean {
  const list = safeRead();
  const idx = list.indexOf(id);
  if (idx >= 0) {
    list.splice(idx, 1);
    safeWrite(list);
    return false;
  }
  list.push(id);
  safeWrite(list);
  return true;
}

export function clearFavorites() {
  safeWrite([]);
}

export const FAVORITES_EVENT = EVENT;
