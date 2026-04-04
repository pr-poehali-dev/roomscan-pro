export const AUTH_URL = "https://functions.poehali.dev/6ba50afb-d26a-4f86-ac87-cacbfb57c359";
export const PROJECTS_URL = "https://functions.poehali.dev/648d87c2-171e-4729-b3e2-2cafa6015a40";
export const SCAN_URL = "https://functions.poehali.dev/aa224ee6-cbee-45f1-bcf6-92dbb5ecd974";

export interface User { id: number; name: string; email: string; role: string; }
export interface Project { id: number; name: string; rooms: number; area: string; status: string; updated: string; }

export function getToken() { return localStorage.getItem("planscan_token") || ""; }
export function setToken(t: string) { localStorage.setItem("planscan_token", t); }
export function clearToken() { localStorage.removeItem("planscan_token"); }

export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", "X-Auth-Token": token, ...(options.headers || {}) },
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}