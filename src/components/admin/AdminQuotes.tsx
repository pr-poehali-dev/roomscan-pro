import { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { quotesApi, type QuoteRequest, type QuoteKind, type QuoteStatus } from "@/lib/adminApi";
import { notify, confirmAction } from "@/lib/notify";

const STATUS_META: Record<QuoteStatus, { label: string; color: string; icon: string }> = {
  new:      { label: "Новая",     color: "bg-blue-500/15 text-blue-500 border-blue-500/30",        icon: "Sparkles" },
  in_work:  { label: "В работе",  color: "bg-amber-500/15 text-amber-600 border-amber-500/30",      icon: "Loader" },
  done:     { label: "Завершена", color: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",icon: "Check" },
  rejected: { label: "Отклонена", color: "bg-red-500/15 text-red-500 border-red-500/30",            icon: "X" },
};

const KIND_META: Record<QuoteKind, { label: string; icon: string; color: string }> = {
  engineering:    { label: "Котельная",     icon: "Settings2", color: "text-orange-500" },
  modular_house:  { label: "Модульный дом", icon: "Boxes",     color: "text-emerald-500" },
};

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";
const fmtDate = (s: string) => new Date(s).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });

export default function AdminQuotes() {
  const [items, setItems] = useState<QuoteRequest[]>([]);
  const [stats, setStats] = useState<Partial<Record<QuoteStatus, number>>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [kindFilter, setKindFilter] = useState<QuoteKind | "all">("all");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");

  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await quotesApi.list({
        q: q || undefined,
        kind: kindFilter,
        status: statusFilter,
      });
      setItems(r.items);
      setStats(r.stats);
      setTotal(r.total);
    } catch (e) {
      notify.error("Не удалось загрузить заявки", e instanceof Error ? e.message : "");
    } finally {
      setLoading(false);
    }
  }, [q, kindFilter, statusFilter]);

  useEffect(() => { load(); }, [kindFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const setStatus = async (item: QuoteRequest, status: QuoteStatus) => {
    try {
      await quotesApi.update(item.id, { status });
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status } : x)));
      notify.success("Статус обновлён", STATUS_META[status].label);
    } catch (e) {
      notify.error("Не удалось обновить", e instanceof Error ? e.message : "");
    }
  };

  const saveNote = async (item: QuoteRequest, admin_note: string) => {
    try {
      await quotesApi.update(item.id, { admin_note });
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, admin_note } : x)));
      notify.success("Заметка сохранена");
    } catch (e) {
      notify.error("Не удалось сохранить", e instanceof Error ? e.message : "");
    }
  };

  const remove = async (item: QuoteRequest) => {
    const ok = await confirmAction(`Удалить заявку #${item.id}?`);
    if (!ok) return;
    try {
      await quotesApi.remove(item.id);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      setOpenId(null);
      notify.success("Заявка удалена");
    } catch (e) {
      notify.error("Не удалось удалить", e instanceof Error ? e.message : "");
    }
  };

  const kpi = useMemo(() => ({
    total,
    new: stats.new || 0,
    in_work: stats.in_work || 0,
    done: stats.done || 0,
    sum: items.reduce((s, x) => s + (x.total_price || 0), 0),
  }), [stats, total, items]);

  const openItem = items.find((x) => x.id === openId) || null;

  return (
    <div className="space-y-4">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Kpi icon="Inbox"    label="Всего"       value={String(kpi.total)}     accent="text-foreground" />
        <Kpi icon="Sparkles" label="Новых"       value={String(kpi.new)}       accent="text-blue-500" />
        <Kpi icon="Loader"   label="В работе"    value={String(kpi.in_work)}   accent="text-amber-500" />
        <Kpi icon="Check"    label="Завершены"   value={String(kpi.done)}      accent="text-emerald-500" />
        <Kpi icon="Banknote" label="На экране"   value={fmt(kpi.sum)}          accent="text-primary" />
      </div>

      {/* Фильтры */}
      <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Поиск: имя, телефон, email или название проекта…"
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value as QuoteKind | "all")}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="all">Все типы</option>
          <option value="engineering">Котельные</option>
          <option value="modular_house">Модульные дома</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as QuoteStatus | "all")}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="all">Все статусы</option>
          <option value="new">Новые</option>
          <option value="in_work">В работе</option>
          <option value="done">Завершённые</option>
          <option value="rejected">Отклонённые</option>
        </select>

        <button
          onClick={load}
          disabled={loading}
          className="bg-primary text-primary-foreground hover:opacity-90 font-bold text-sm px-3 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
        >
          {loading ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Search" size={14} />}
          Найти
        </button>
      </div>

      {/* Таблица */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground bg-secondary/40 border-b border-border">
          <div className="col-span-1">#</div>
          <div className="col-span-2">Тип / Дата</div>
          <div className="col-span-3">Клиент</div>
          <div className="col-span-3">Проект</div>
          <div className="col-span-1 text-right">Сумма</div>
          <div className="col-span-2 text-center">Статус</div>
        </div>

        {loading && items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <Icon name="Loader2" size={20} className="mx-auto animate-spin mb-2" />
            Загружаем…
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Icon name="Inbox" size={32} className="mx-auto text-muted-foreground mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">
              По выбранным фильтрам заявок нет.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((it) => (
              <QuoteRow
                key={it.id}
                item={it}
                onOpen={() => setOpenId(it.id)}
                onSetStatus={(s) => setStatus(it, s)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Детальная карточка */}
      {openItem && (
        <QuoteDetail
          item={openItem}
          onClose={() => setOpenId(null)}
          onSetStatus={(s) => setStatus(openItem, s)}
          onSaveNote={(n) => saveNote(openItem, n)}
          onDelete={() => remove(openItem)}
        />
      )}
    </div>
  );
}

/* ───────── Подкомпоненты ───────── */

function Kpi({ icon, label, value, accent }: { icon: string; label: string; value: string; accent: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon name={icon} size={12} className="text-muted-foreground" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      </div>
      <p className={`text-xl font-black font-mono truncate ${accent}`}>{value}</p>
    </div>
  );
}

function QuoteRow({
  item,
  onOpen,
  onSetStatus,
}: {
  item: QuoteRequest;
  onOpen: () => void;
  onSetStatus: (s: QuoteStatus) => void;
}) {
  const km = KIND_META[item.kind] ?? KIND_META.engineering;
  const sm = STATUS_META[item.status] ?? STATUS_META.new;

  return (
    <div className="px-4 py-3 hover:bg-secondary/40 transition-colors cursor-pointer" onClick={onOpen}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        <div className="col-span-1 flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground">#{item.id}</span>
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center gap-1.5">
            <Icon name={km.icon} size={13} className={km.color} />
            <span className="text-xs font-bold">{km.label}</span>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{fmtDate(item.created_at)}</p>
        </div>

        <div className="md:col-span-3 min-w-0">
          <p className="text-sm font-bold truncate">{item.client_name}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {item.client_phone || ""}
            {item.client_phone && item.client_email && " · "}
            {item.client_email || ""}
          </p>
        </div>

        <div className="md:col-span-3 min-w-0">
          <p className="text-xs font-medium truncate">{item.project_title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {item.sent_to_telegram && (
              <span className="text-[9px] font-mono text-sky-500 flex items-center gap-0.5">
                <Icon name="Send" size={9} /> TG
              </span>
            )}
            {item.sent_to_max && (
              <span className="text-[9px] font-mono text-violet-500 flex items-center gap-0.5">
                <Icon name="Send" size={9} /> MAX
              </span>
            )}
          </div>
        </div>

        <div className="md:col-span-1 md:text-right">
          <p className="text-sm font-bold font-mono text-primary">{fmt(item.total_price)}</p>
        </div>

        <div className="md:col-span-2 flex md:justify-center">
          <select
            value={item.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onSetStatus(e.target.value as QuoteStatus)}
            className={`text-[11px] font-bold px-2 py-1 rounded-lg border ${sm.color} focus:outline-none cursor-pointer`}
          >
            {(Object.keys(STATUS_META) as QuoteStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function QuoteDetail({
  item,
  onClose,
  onSetStatus,
  onSaveNote,
  onDelete,
}: {
  item: QuoteRequest;
  onClose: () => void;
  onSetStatus: (s: QuoteStatus) => void;
  onSaveNote: (n: string) => void;
  onDelete: () => void;
}) {
  const [note, setNote] = useState(item.admin_note || "");
  useEffect(() => setNote(item.admin_note || ""), [item.id, item.admin_note]);

  const km = KIND_META[item.kind] ?? KIND_META.engineering;
  const sm = STATUS_META[item.status] ?? STATUS_META.new;
  const items = item.snapshot?.items || [];

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Шапка */}
        <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Icon name={km.icon} size={16} className={km.color} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {km.label} · #{item.id} · {fmtDate(item.created_at)}
              </p>
              <p className="font-bold truncate">{item.project_title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold px-2 py-1 rounded-lg border ${sm.color} flex items-center gap-1`}>
              <Icon name={sm.icon} size={11} />
              {sm.label}
            </span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Закрыть">
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {/* Контакт + сумма */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 bg-secondary/40 rounded-xl p-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Контакты клиента
              </p>
              <p className="text-base font-bold">{item.client_name}</p>
              <div className="mt-2 space-y-1 text-sm">
                {item.client_phone && (
                  <a href={`tel:${item.client_phone}`} className="flex items-center gap-1.5 text-foreground hover:text-primary">
                    <Icon name="Phone" size={13} className="text-muted-foreground" />
                    {item.client_phone}
                  </a>
                )}
                {item.client_email && (
                  <a href={`mailto:${item.client_email}`} className="flex items-center gap-1.5 text-foreground hover:text-primary break-all">
                    <Icon name="Mail" size={13} className="text-muted-foreground" />
                    {item.client_email}
                  </a>
                )}
              </div>
              {item.comment && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                    Комментарий клиента
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{item.comment}</p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/30 rounded-xl p-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Сумма проекта
              </p>
              <p className="text-2xl font-black text-primary font-mono mt-1">{fmt(item.total_price)}</p>
              <div className="mt-3 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Icon
                    name={item.sent_to_telegram ? "CheckCircle2" : "Circle"}
                    size={11}
                    className={item.sent_to_telegram ? "text-sky-500" : "text-muted-foreground"}
                  />
                  Telegram
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon
                    name={item.sent_to_max ? "CheckCircle2" : "Circle"}
                    size={11}
                    className={item.sent_to_max ? "text-violet-500" : "text-muted-foreground"}
                  />
                  MAX
                </div>
              </div>
            </div>
          </div>

          {/* Состав */}
          {items.length > 0 && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Состав проекта ({items.length})
              </p>
              <div className="bg-secondary/40 rounded-xl divide-y divide-border max-h-60 overflow-y-auto">
                {items.map((row, i) => (
                  <div key={i} className="px-3 py-2 flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{row.name}</span>
                    <span className="font-mono text-xs text-muted-foreground shrink-0">
                      ×{row.quantity}
                      {row.price ? ` · ${fmt(row.price)}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Заметка */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1 block">
              Внутренняя заметка
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Что обсудили с клиентом, договорённости, дальнейшие шаги…"
              rows={3}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
            />
            <button
              onClick={() => onSaveNote(note)}
              className="mt-2 bg-secondary hover:bg-secondary/70 text-foreground font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            >
              <Icon name="Save" size={12} />
              Сохранить заметку
            </button>
          </div>

          {/* Смена статуса */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Изменить статус
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(STATUS_META) as QuoteStatus[]).map((s) => {
                const meta = STATUS_META[s];
                const active = item.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => onSetStatus(s)}
                    className={`p-2.5 rounded-lg border-2 text-xs font-bold flex items-center gap-1.5 transition-all ${
                      active
                        ? `${meta.color} border-current`
                        : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon name={meta.icon} size={13} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Подвал */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between gap-2">
          <button
            onClick={onDelete}
            className="text-xs text-red-500 hover:text-red-600 font-bold flex items-center gap-1.5"
          >
            <Icon name="Trash2" size={13} />
            Удалить
          </button>
          <button
            onClick={onClose}
            className="bg-secondary hover:bg-secondary/70 text-foreground font-bold text-sm px-4 py-2 rounded-lg"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
