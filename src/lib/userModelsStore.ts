/**
 * Локальное хранилище пользовательских 3D-моделей (GLB).
 * Хранит data:URL в localStorage. Лимит ~10 моделей (или ~50МБ суммарно).
 */

const KEY = "roomscan:user-models";
const MAX_MODELS = 20;
const MAX_TOTAL_BYTES = 60 * 1024 * 1024;

export interface UserModel {
  id: string;
  name: string;
  sourceExt: string;
  sizeOut: number;
  dataUrl: string;
  triangles?: number;
  createdAt: number;
}

function read(): UserModel[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(list: UserModel[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (err) {
    console.warn("Не удалось сохранить модель в localStorage", err);
  }
}

export function listUserModels(): UserModel[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function saveUserModel(input: Omit<UserModel, "id" | "createdAt">): UserModel {
  const list = read();

  // Удаляем самые старые модели, если превышаем лимит
  while (list.length >= MAX_MODELS) {
    list.sort((a, b) => a.createdAt - b.createdAt);
    list.shift();
  }
  let total = list.reduce((s, m) => s + m.sizeOut, 0) + input.sizeOut;
  while (total > MAX_TOTAL_BYTES && list.length > 0) {
    list.sort((a, b) => a.createdAt - b.createdAt);
    const removed = list.shift();
    if (removed) total -= removed.sizeOut;
  }

  const model: UserModel = {
    id: `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    ...input,
  };
  list.push(model);
  write(list);
  return model;
}

export function removeUserModel(id: string) {
  const list = read().filter((m) => m.id !== id);
  write(list);
}

export function clearUserModels() {
  write([]);
}
