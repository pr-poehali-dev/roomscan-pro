/**
 * API-клиент для модулей «Инженерные узлы» и «Модульные дома».
 * URL-ы из backend/func2url.json. Используем X-User-Id для разделения проектов.
 */
import { NodePlacement } from "./engineering";
import { HousePlacement } from "./modular-houses";

const ENG_URL = "https://functions.poehali.dev/006fd31a-3056-4ae4-ad05-7f4e409133b1";
const HOUSE_URL = "https://functions.poehali.dev/d3afca03-e4b6-4ca0-b2b9-70b2ddd526b5";
const QUOTE_URL = "https://functions.poehali.dev/64b55cbd-8657-4dad-8529-a44f9c1d7199";

/* ───────── Текущий пользователь (для гостей — стабильный ID) ───────── */

const GUEST_ID_KEY = "roomscan:guest-id";

function getUserId(): number {
  // Если в storage есть user-id (авторизация) — используем его
  try {
    const raw = window.localStorage.getItem("roomscan:user-id");
    if (raw && /^\d+$/.test(raw)) return parseInt(raw, 10);
  } catch {
    /* noop */
  }
  // Иначе — стабильный ID для гостя (генерируется один раз)
  try {
    let g = window.localStorage.getItem(GUEST_ID_KEY);
    if (!g) {
      g = String(900000 + Math.floor(Math.random() * 99999));
      window.localStorage.setItem(GUEST_ID_KEY, g);
    }
    return parseInt(g, 10);
  } catch {
    return 0;
  }
}

function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-User-Id": String(getUserId()),
  };
}

/* ───────── Engineering Projects ───────── */

export interface EngProjectDTO {
  id: number;
  title: string;
  template_id: string;
  total_price: number;
  notes?: string | null;
  layout?: NodePlacement[];
  created_at: string;
  updated_at: string;
}

export async function listEngProjects(): Promise<EngProjectDTO[]> {
  const r = await fetch(ENG_URL, { headers: headers() });
  if (!r.ok) throw new Error("list failed");
  const data = await r.json();
  return data.items || [];
}

export async function getEngProject(id: number): Promise<EngProjectDTO> {
  const r = await fetch(`${ENG_URL}?id=${id}`, { headers: headers() });
  if (!r.ok) throw new Error("get failed");
  return r.json();
}

export async function createEngProject(p: {
  title: string;
  template_id: string;
  layout: NodePlacement[];
  total_price: number;
  notes?: string;
}): Promise<EngProjectDTO> {
  const r = await fetch(ENG_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(p),
  });
  if (!r.ok) throw new Error("create failed");
  return r.json();
}

export async function updateEngProject(
  id: number,
  p: {
    title: string;
    template_id: string;
    layout: NodePlacement[];
    total_price: number;
    notes?: string;
  },
): Promise<EngProjectDTO> {
  const r = await fetch(`${ENG_URL}?id=${id}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(p),
  });
  if (!r.ok) throw new Error("update failed");
  return r.json();
}

export async function deleteEngProject(id: number): Promise<void> {
  const r = await fetch(`${ENG_URL}?id=${id}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!r.ok) throw new Error("delete failed");
}

/* ───────── House Projects ───────── */

export interface HouseProjectDTO {
  id: number;
  title: string;
  base_project_id: string | null;
  total_area: number;
  grand_total: number;
  notes?: string | null;
  layout?: HousePlacement[];
  created_at: string;
  updated_at: string;
}

export async function listHouseProjects(): Promise<HouseProjectDTO[]> {
  const r = await fetch(HOUSE_URL, { headers: headers() });
  if (!r.ok) throw new Error("list failed");
  const data = await r.json();
  return data.items || [];
}

export async function getHouseProject(id: number): Promise<HouseProjectDTO> {
  const r = await fetch(`${HOUSE_URL}?id=${id}`, { headers: headers() });
  if (!r.ok) throw new Error("get failed");
  return r.json();
}

export async function createHouseProject(p: {
  title: string;
  base_project_id: string;
  layout: HousePlacement[];
  total_area: number;
  grand_total: number;
  notes?: string;
}): Promise<HouseProjectDTO> {
  const r = await fetch(HOUSE_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(p),
  });
  if (!r.ok) throw new Error("create failed");
  return r.json();
}

export async function updateHouseProject(
  id: number,
  p: {
    title: string;
    base_project_id: string;
    layout: HousePlacement[];
    total_area: number;
    grand_total: number;
    notes?: string;
  },
): Promise<HouseProjectDTO> {
  const r = await fetch(`${HOUSE_URL}?id=${id}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(p),
  });
  if (!r.ok) throw new Error("update failed");
  return r.json();
}

export async function deleteHouseProject(id: number): Promise<void> {
  const r = await fetch(`${HOUSE_URL}?id=${id}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!r.ok) throw new Error("delete failed");
}

/* ───────── Quote (заявки) ───────── */

export interface QuotePayload {
  kind: "engineering" | "modular_house";
  project_title: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  comment?: string;
  total_price: number;
  snapshot?: {
    items: { name: string; quantity: number; price?: number }[];
  };
}

export async function sendQuote(p: QuotePayload): Promise<{ ok: boolean; id: number; telegram_sent: boolean }> {
  const r = await fetch(QUOTE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(data?.error || "send failed");
  }
  return data;
}
