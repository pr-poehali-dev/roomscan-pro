import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { PARTNERS_URL } from "@/lib/api";

const TOKEN_KEY = "roomscan:admin_token";

interface Application {
  id: number;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  partnership_type: "catalog" | "api" | "branded" | "enterprise";
  catalog_size: number | null;
  description: string | null;
  status: "new" | "review" | "approved" | "rejected";
  created: string;
  updated: string;
}

interface ListResponse {
  applications: Application[];
  total: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:      { label: "Новая",      color: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  review:   { label: "На рассмотрении", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30" },
  approved: { label: "Одобрена",   color: "bg-primary/10 text-primary border-primary/30" },
  rejected: { label: "Отклонена",  color: "bg-destructive/10 text-destructive border-destructive/30" },
};

const TYPE_LABELS: Record<string, string> = {
  catalog:    "Каталог",
  api:        "API-интеграция",
  branded:    "Брендированный",
  enterprise: "Enterprise",
};

const STATUSES: Application["status"][] = ["new", "review", "approved", "rejected"];

export default function AdminSection() {
  const [token, setTokenState] = useState<string>(() => localStorage.getItem(TOKEN_KEY) ?? "");
  const [tokenInput, setTokenInput] = useState("");
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | Application["status"]>("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<number | null>(null);

  const loadList = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${PARTNERS_URL}?action=list`, {
        headers: { "X-Admin-Token": token },
      });
      const d = await r.json();
      if (r.status === 401) {
        setError("Неверный токен. Введите правильный ADMIN_TOKEN.");
        setData(null);
        // токен невалиден — стираем
        localStorage.removeItem(TOKEN_KEY);
        setTokenState("");
        return;
      }
      if (!r.ok) {
        setError(d.error || "Ошибка загрузки");
        return;
      }
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) loadList();
  }, [token, loadList]);

  const login = () => {
    const t = tokenInput.trim();
    if (!t) {
      setError("Введите токен");
      return;
    }
    localStorage.setItem(TOKEN_KEY, t);
    setTokenState(t);
    setTokenInput("");
    setError("");
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setTokenState("");
    setData(null);
  };

  const updateStatus = async (id: number, status: Application["status"]) => {
    setUpdating(id);
    try {
      const r = await fetch(`${PARTNERS_URL}?action=update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token },
        body: JSON.stringify({ id, status }),
      });
      const d = await r.json();
      if (r.ok && d.ok) {
        // Локально обновляем без перезагрузки списка
        setData((prev) => {
          if (!prev) return prev;
          const apps = prev.applications.map((a) => a.id === id ? { ...a, status } : a);
          const by_status = { new: 0, review: 0, approved: 0, rejected: 0 };
          apps.forEach((a) => { by_status[a.status]++; });
          return { ...prev, applications: apps, by_status };
        });
      } else {
        setError(d.error || "Не удалось обновить");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Сетевая ошибка");
    } finally {
      setUpdating(null);
    }
  };

  // ── Экран входа ────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="animate-fade-in max-w-md mx-auto py-12">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <Icon name="ShieldCheck" size={22} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Админ-панель</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Введите ADMIN_TOKEN, чтобы получить доступ к заявкам партнёров.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ADMIN_TOKEN</label>
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && login()}
                placeholder="Длинная случайная строка из настроек"
                className="w-full bg-secondary/40 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/40 font-mono"
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md px-3 py-2 flex items-center gap-2">
                <Icon name="AlertCircle" size={14} />
                {error}
              </div>
            )}

            <button
              onClick={login}
              className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Icon name="LogIn" size={16} />
              Войти
            </button>

            <p className="text-[10px] text-muted-foreground text-center">
              Токен хранится в localStorage. Чтобы выйти — нажмите «Выход» в заголовке.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Основной список ───────────────────────────────────────────────────
  const filteredApps = (data?.applications ?? []).filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        a.company_name.toLowerCase().includes(s) ||
        a.contact_name.toLowerCase().includes(s) ||
        a.email.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">
            Заявки партнёров · admin
          </p>
          <h2 className="text-3xl font-bold">Админ-панель</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadList}
            disabled={loading}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors flex items-center gap-1.5"
          >
            <Icon name={loading ? "Loader2" : "RefreshCw"} size={13} className={loading ? "animate-spin" : ""} />
            Обновить
          </button>
          <button
            onClick={logout}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1.5"
          >
            <Icon name="LogOut" size={13} />
            Выход
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md px-3 py-2 flex items-center gap-2">
          <Icon name="AlertCircle" size={14} />
          {error}
        </div>
      )}

      {/* Сводка */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATUSES.map((s) => {
            const count = data.by_status[s] ?? 0;
            const cfg = STATUS_LABELS[s];
            return (
              <button
                key={s}
                onClick={() => setFilter(filter === s ? "all" : s)}
                className={`bg-card border rounded-lg p-3 text-left transition-all ${
                  filter === s ? "border-primary/50 shadow" : "border-border hover:border-primary/30"
                }`}
              >
                <p className={`text-2xl font-black font-mono ${
                  count > 0 ? "text-primary" : "text-muted-foreground"
                }`}>
                  {count}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{cfg.label}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Поиск + фильтр */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск: компания, имя, email"
            className="w-full bg-secondary/40 border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary/40"
          />
        </div>
        {filter !== "all" && (
          <button
            onClick={() => setFilter("all")}
            className="text-xs font-mono px-3 py-2 rounded-md border border-primary/30 bg-primary/10 text-primary flex items-center gap-1.5"
          >
            Фильтр: {STATUS_LABELS[filter].label}
            <Icon name="X" size={12} />
          </button>
        )}
      </div>

      {/* Список заявок */}
      {loading && !data && (
        <div className="text-center py-12">
          <Icon name="Loader2" size={28} className="text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">Загрузка…</p>
        </div>
      )}

      {data && filteredApps.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <Icon name="Inbox" size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {data.applications.length === 0
              ? "Заявок пока нет"
              : "Нет заявок по выбранному фильтру"}
          </p>
        </div>
      )}

      {filteredApps.length > 0 && (
        <div className="space-y-2">
          {filteredApps.map((a) => {
            const cfg = STATUS_LABELS[a.status];
            return (
              <div key={a.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-foreground">{a.company_name}</p>
                      <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                        {TYPE_LABELS[a.partnership_type] ?? a.partnership_type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      ID #{a.id} · создана {a.created}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm mb-3">
                  <Field icon="User"   label="Контакт" value={a.contact_name} />
                  <Field icon="Mail"   label="Email"   value={a.email} link={`mailto:${a.email}`} />
                  <Field icon="Phone"  label="Телефон" value={a.phone || "—"} link={a.phone ? `tel:${a.phone}` : undefined} />
                  <Field icon="Globe"  label="Сайт"    value={a.website || "—"} link={a.website || undefined} />
                </div>

                {(a.catalog_size != null || a.description) && (
                  <div className="bg-secondary/30 rounded-md p-3 mb-3 text-xs text-muted-foreground space-y-1">
                    {a.catalog_size != null && (
                      <p><span className="font-semibold text-foreground">SKU:</span> {a.catalog_size.toLocaleString("ru-RU")}</p>
                    )}
                    {a.description && (
                      <p><span className="font-semibold text-foreground">Комментарий:</span> {a.description}</p>
                    )}
                  </div>
                )}

                {/* Действия по статусу */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mr-2">
                    Сменить статус:
                  </span>
                  {STATUSES.filter((s) => s !== a.status).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(a.id, s)}
                      disabled={updating === a.id}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:text-primary hover:border-primary/40 disabled:opacity-50 transition-colors"
                    >
                      → {STATUS_LABELS[s].label}
                    </button>
                  ))}
                  {updating === a.id && (
                    <Icon name="Loader2" size={12} className="text-primary animate-spin ml-1" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ icon, label, value, link }: { icon: string; label: string; value: string; link?: string }) {
  const content = (
    <>
      <Icon name={icon} size={11} className="text-primary shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-foreground truncate" title={value}>{value}</p>
      </div>
    </>
  );
  return (
    <div className="bg-secondary/30 rounded-md px-2.5 py-1.5 flex items-center gap-2">
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 flex-1 hover:text-primary transition-colors min-w-0">
          {content}
        </a>
      ) : content}
    </div>
  );
}
