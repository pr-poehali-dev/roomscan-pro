import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { crmApi, type Lead } from "@/lib/adminApi";
import { notify } from "@/lib/notify";

const STATUSES = [
  { id: "new",        label: "Новый",          color: "bg-blue-500/15 text-blue-500" },
  { id: "qualified",  label: "Квалиф.",        color: "bg-amber-500/15 text-amber-500" },
  { id: "in_work",    label: "В работе",       color: "bg-violet-500/15 text-violet-500" },
  { id: "won",        label: "Закрыт+",        color: "bg-emerald-500/15 text-emerald-500" },
  { id: "lost",       label: "Закрыт−",        color: "bg-red-500/15 text-red-500" },
];

export default function AdminCRM() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Форма создания
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", notes: "" });

  const load = async () => {
    setLoading(true);
    try {
      const r = await crmApi.leads(q || undefined, statusFilter || undefined);
      setLeads(r.items);
    } catch (e) {
      notify.error("Не удалось загрузить лидов", e instanceof Error ? e.message : "");
    } finally { setLoading(false); }
  };

  useEffect(() => { load();   }, [statusFilter]);

  const submitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      await crmApi.createLead({
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        notes: form.notes.trim() || null,
      });
      notify.success("Лид создан");
      setForm({ name: "", email: "", phone: "", company: "", notes: "" });
      setCreating(false);
      load();
    } catch (e) {
      notify.error("Ошибка создания", e instanceof Error ? e.message : "");
    }
  };

  const setStatus = async (lead: Lead, status: string) => {
    try {
      await crmApi.updateLead(lead.id, { status });
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status } : l)));
    } catch (e) {
      notify.error("Не удалось обновить", e instanceof Error ? e.message : "");
    }
  };

  return (
    <div className="space-y-4">
      {/* Шапка с фильтрами */}
      <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Поиск по имени, email, компании…"
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="">Все статусы</option>
          {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <button
          onClick={load}
          className="bg-secondary hover:bg-secondary/70 text-foreground font-bold text-sm px-3 py-2 rounded-lg flex items-center gap-1.5"
        >
          <Icon name="RefreshCw" size={13} />
          Обновить
        </button>
        <button
          onClick={() => setCreating(true)}
          className="bg-primary text-primary-foreground hover:opacity-90 font-bold text-sm px-3 py-2 rounded-lg flex items-center gap-1.5"
        >
          <Icon name="Plus" size={13} />
          Новый лид
        </button>
      </div>

      {/* Форма создания */}
      {creating && (
        <form onSubmit={submitNew} className="bg-card border-2 border-primary/40 rounded-xl p-4 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input value={form.name}    onChange={(e) => setForm({...form, name: e.target.value})}    placeholder="Имя контакта *"    className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm" required />
            <input value={form.company} onChange={(e) => setForm({...form, company: e.target.value})} placeholder="Компания"          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
            <input value={form.email}   onChange={(e) => setForm({...form, email: e.target.value})}   placeholder="Email" type="email" className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
            <input value={form.phone}   onChange={(e) => setForm({...form, phone: e.target.value})}   placeholder="Телефон"           className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="Заметки" rows={2} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm resize-none" />
          <div className="flex items-center gap-2">
            <button type="submit" className="bg-primary text-primary-foreground font-bold text-sm px-4 py-2 rounded-lg">Создать</button>
            <button type="button" onClick={() => setCreating(false)} className="text-muted-foreground hover:text-foreground text-sm">Отмена</button>
          </div>
        </form>
      )}

      {/* Список лидов */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-secondary/50 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <div className="col-span-3">Контакт</div>
          <div className="col-span-3">Компания / Email</div>
          <div className="col-span-2">Источник</div>
          <div className="col-span-2">Статус</div>
          <div className="col-span-2 text-right">Создан</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Загрузка…</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <Icon name="Inbox" size={32} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Лидов пока нет — создайте первый</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {leads.map((l) => (
              <div key={l.id} className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-secondary/30 transition-colors items-center">
                <div className="col-span-3 min-w-0">
                  <button onClick={() => setEditingId(editingId === l.id ? null : l.id)}
                          className="font-bold text-sm text-foreground hover:text-primary truncate block w-full text-left">
                    {l.name}
                  </button>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">{l.phone || "—"}</p>
                </div>
                <div className="col-span-3 min-w-0">
                  <p className="text-xs text-foreground truncate">{l.company || "—"}</p>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">{l.email || ""}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                    {l.source}
                  </span>
                </div>
                <div className="col-span-2">
                  <select value={l.status} onChange={(e) => setStatus(l, e.target.value)}
                          className={`text-[11px] font-bold rounded px-2 py-1 border-0 ${
                            STATUSES.find((s) => s.id === l.status)?.color || "bg-secondary text-foreground"
                          }`}>
                    {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div className="col-span-2 text-right text-[11px] font-mono text-muted-foreground">
                  {new Date(l.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                </div>

                {editingId === l.id && (
                  <div className="col-span-12 mt-2 p-3 bg-secondary/40 rounded-lg text-xs space-y-1">
                    {l.notes && <p><span className="text-muted-foreground">Заметки:</span> {l.notes}</p>}
                    {l.tags && <p><span className="text-muted-foreground">Теги:</span> {l.tags}</p>}
                    <p><span className="text-muted-foreground">Бюджет:</span> {l.budget_min} – {l.budget_max} ₽</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
