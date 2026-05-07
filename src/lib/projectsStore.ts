/**
 * Локальный store «Мои проекты».
 * Каждый проект — снимок состояния (скан + смета + стейджинг + дата).
 * Хранится в localStorage, не требует авторизации.
 */

import type { LastScan } from "./scanStore";
import type { Tier } from "./estimate";
import type { StagingGoal } from "./staging";

export interface SavedProject {
  id: string;             // uuid v4
  name: string;
  createdAt: number;
  updatedAt: number;
  scan: LastScan | null;
  estimate?: {
    tier: Tier;
    grandTotal: number;
    daysApprox: number;
  };
  staging?: {
    goal: StagingGoal;
    budget: number;
    expectedUplift: number;
  };
  notes?: string;
}

const KEY = "roomscan:projects";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function listProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SavedProject[];
    return [...arr].sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveProject(input: Omit<SavedProject, "id" | "createdAt" | "updatedAt">): SavedProject {
  const now = Date.now();
  const project: SavedProject = {
    ...input,
    id: uid(),
    createdAt: now,
    updatedAt: now,
  };
  const all = listProjects();
  all.unshift(project);
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new Event("roomscan:projects:changed"));
  } catch {
    /* ignore */
  }
  return project;
}

export function updateProject(id: string, patch: Partial<SavedProject>): void {
  const all = listProjects();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], ...patch, updatedAt: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new Event("roomscan:projects:changed"));
  } catch {
    /* ignore */
  }
}

export function deleteProject(id: string): void {
  const all = listProjects().filter((p) => p.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new Event("roomscan:projects:changed"));
  } catch {
    /* ignore */
  }
}
