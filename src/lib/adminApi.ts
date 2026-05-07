/**
 * API-клиент для админ-кабинета: CRM, партнёры, AI-агент.
 */

export const CRM_URL = "https://functions.poehali.dev/670c4048-1474-45cd-a4db-046fc2dd0381";
export const PARTNERS_FINDER_URL = "https://functions.poehali.dev/20f0f8db-38d0-44ee-9ae8-16abec8d49fd";
export const SALES_AGENT_URL = "https://functions.poehali.dev/4aa95b17-ab9a-4159-b62c-f5d97fe922c2";

const ADMIN_TOKEN_KEY = "roomscan:admin-token";

export function getAdminToken(): string {
  try { return window.localStorage.getItem(ADMIN_TOKEN_KEY) || ""; }
  catch { return ""; }
}
export function setAdminToken(t: string) {
  try { window.localStorage.setItem(ADMIN_TOKEN_KEY, t); }
  catch { /* noop */ }
}

async function adminFetch<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers["X-Admin-Token"] = token;
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  let data: unknown;
  try { data = text ? JSON.parse(text) : {}; }
  catch { data = { error: text }; }
  if (!res.ok) {
    const msg = (data as { error?: string })?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

/* ──────── ТИПЫ ──────── */

export interface Lead {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  status: string;
  tags: string | null;
  notes: string | null;
  budget_min: number;
  budget_max: number;
  assigned_to: string | null;
  next_action_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: number;
  lead_id: number | null;
  lead_name?: string;
  lead_email?: string;
  title: string;
  stage: string;
  amount: number;
  currency: string;
  probability: number;
  expected_close: string | null;
  closed_at: string | null;
  closed_won: boolean | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: number;
  lead_id: number | null;
  deal_id: number | null;
  partner_id: number | null;
  kind: string;
  title: string;
  description: string | null;
  due_at: string | null;
  completed_at: string | null;
  result: string | null;
  ai_generated: boolean;
  created_at: string;
}

export interface Partner {
  id: number;
  name: string;
  category: string;
  city: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  contact_person: string | null;
  description: string | null;
  rating: number;
  status: string;
  source: string;
  ai_score: number;
  ai_summary: string | null;
  tags: string | null;
  last_contact_at: string | null;
  created_at: string;
}

export interface DashboardStats {
  leads_total: number;
  leads_new: number;
  leads_week: number;
  deals_total: number;
  deals_open: number;
  deals_won: number;
  pipeline_amount: number;
  won_amount: number;
  partners_total: number;
  partners_discovered: number;
  partners_active: number;
  tasks_pending: number;
}

export interface DashboardResp {
  stats: DashboardStats;
  funnel: { stage: string; cnt: number; amount: number }[];
  recent_leads: Lead[];
}

export interface AILog {
  id: number;
  agent: string;
  action: string;
  input_text: string | null;
  output_text: string | null;
  tokens_used: number;
  status: string;
  created_at: string;
}

/* ──────── CRM ──────── */

export const crmApi = {
  dashboard: () => adminFetch<DashboardResp>(`${CRM_URL}?resource=dashboard`),

  leads: (q?: string, status?: string) => {
    const p = new URLSearchParams({ resource: "leads" });
    if (q) p.set("q", q);
    if (status) p.set("status", status);
    return adminFetch<{ items: Lead[] }>(`${CRM_URL}?${p}`);
  },
  createLead: (body: Partial<Lead>) =>
    adminFetch<{ item: Lead }>(`${CRM_URL}?resource=leads`, { method: "POST", body: JSON.stringify(body) }),
  updateLead: (id: number, body: Partial<Lead>) =>
    adminFetch<{ item: Lead }>(`${CRM_URL}?resource=leads&id=${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  deals: (stage?: string) => {
    const p = new URLSearchParams({ resource: "deals" });
    if (stage) p.set("stage", stage);
    return adminFetch<{ items: Deal[] }>(`${CRM_URL}?${p}`);
  },
  createDeal: (body: Partial<Deal>) =>
    adminFetch<{ item: Deal }>(`${CRM_URL}?resource=deals`, { method: "POST", body: JSON.stringify(body) }),
  updateDeal: (id: number, body: Partial<Deal>) =>
    adminFetch<{ item: Deal }>(`${CRM_URL}?resource=deals&id=${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  activities: (params?: { lead_id?: number; pending?: boolean }) => {
    const p = new URLSearchParams({ resource: "activities" });
    if (params?.lead_id) p.set("lead_id", String(params.lead_id));
    if (params?.pending) p.set("pending", "1");
    return adminFetch<{ items: Activity[] }>(`${CRM_URL}?${p}`);
  },
  createActivity: (body: Partial<Activity>) =>
    adminFetch<{ item: Activity }>(`${CRM_URL}?resource=activities`, { method: "POST", body: JSON.stringify(body) }),
  completeActivity: (id: number, result: string) =>
    adminFetch<{ item: Activity }>(`${CRM_URL}?resource=activities&id=${id}`, { method: "PATCH", body: JSON.stringify({ result }) }),
};

/* ──────── ПАРТНЁРЫ ──────── */

export const partnersApi = {
  list: (params?: { category?: string; city?: string; status?: string }) => {
    const p = new URLSearchParams();
    if (params?.category) p.set("category", params.category);
    if (params?.city) p.set("city", params.city);
    if (params?.status) p.set("status", params.status);
    return adminFetch<{ items: Partner[] }>(`${PARTNERS_FINDER_URL}?${p}`);
  },
  search: (category: string, city: string, count = 8) =>
    adminFetch<{ found: number; saved: number; preview: Partner[] }>(PARTNERS_FINDER_URL, {
      method: "POST",
      body: JSON.stringify({ action: "search", category, city, count }),
    }),
  update: (id: number, body: Partial<Partner>) =>
    adminFetch<{ item: Partner }>(`${PARTNERS_FINDER_URL}?id=${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

/* ──────── AI-АГЕНТ ──────── */

export type SalesAction = "outreach" | "reply" | "next_step" | "qualify";

export interface SalesAgentResult {
  action: SalesAction;
  result: string;
  parsed: unknown | null;
  tokens_used: number;
}

export const salesAgentApi = {
  ask: (action: SalesAction, params: Record<string, unknown>) =>
    adminFetch<SalesAgentResult>(SALES_AGENT_URL, {
      method: "POST",
      body: JSON.stringify({ action, ...params }),
    }),
  logs: (agent?: string) => {
    const p = new URLSearchParams({ resource: "logs" });
    if (agent) p.set("agent", agent);
    return adminFetch<{ items: AILog[] }>(`${SALES_AGENT_URL}?${p}`);
  },
};
