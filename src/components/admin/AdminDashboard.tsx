import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { crmApi, type DashboardResp } from "@/lib/adminApi";

const STAGE_LABELS: Record<string, string> = {
  qualification: "Квалификация",
  proposal: "КП отправлено",
  negotiation: "Переговоры",
  contract: "Договор",
  payment: "Оплата",
};

const formatRub = (n: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);

/**
 * Дашборд админ-кабинета: ключевые метрики, воронка, последние лиды.
 */
export default function AdminDashboard() {
  const [data, setData] = useState<DashboardResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setData(await crmApi.dashboard());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Загрузка дашборда…</div>;
  if (error) return <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-sm text-destructive">{error}</div>;
  if (!data) return null;

  const s = data.stats;
  const cards = [
    { icon: "Users",      label: "Всего лидов",       val: s.leads_total,         hint: `Новых: ${s.leads_new}`, color: "from-primary/15 to-primary/5" },
    { icon: "TrendingUp", label: "За неделю",         val: s.leads_week,          hint: "Новых лидов",           color: "from-blue-500/15 to-blue-500/5" },
    { icon: "Briefcase",  label: "Открытых сделок",   val: s.deals_open,          hint: `Всего: ${s.deals_total}`, color: "from-amber-500/15 to-amber-500/5" },
    { icon: "Trophy",     label: "Выиграно",          val: s.deals_won,           hint: formatRub(s.won_amount), color: "from-emerald-500/15 to-emerald-500/5" },
    { icon: "Coins",      label: "Pipeline",          val: formatRub(s.pipeline_amount), hint: "Прогноз выручки", color: "from-violet-500/15 to-violet-500/5", isString: true },
    { icon: "Building2",  label: "Партнёров",         val: s.partners_total,      hint: `Активных: ${s.partners_active}`, color: "from-cyan-500/15 to-cyan-500/5" },
    { icon: "Search",     label: "Найдено ИИ",        val: s.partners_discovered, hint: "Ждут обработки",        color: "from-pink-500/15 to-pink-500/5" },
    { icon: "ListTodo",   label: "Задач в работе",    val: s.tasks_pending,       hint: "Активности",            color: "from-orange-500/15 to-orange-500/5" },
  ];

  const totalFunnel = data.funnel.reduce((acc, f) => acc + Number(f.amount), 0);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className={`bg-gradient-to-br ${c.color} border border-border rounded-2xl p-4`}>
            <div className="flex items-start justify-between mb-2">
              <Icon name={c.icon} size={18} className="text-foreground/70" />
            </div>
            <p className="text-2xl font-black text-foreground font-mono">
              {c.isString ? c.val : Number(c.val).toLocaleString("ru-RU")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
            <p className="text-[10px] text-muted-foreground/70 font-mono mt-1">{c.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Воронка */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Воронка продаж</p>
          {data.funnel.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Сделок пока нет</p>
          ) : (
            <div className="space-y-2">
              {data.funnel.map((f) => {
                const pct = totalFunnel > 0 ? (Number(f.amount) / totalFunnel) * 100 : 0;
                return (
                  <div key={f.stage}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-foreground">{STAGE_LABELS[f.stage] || f.stage}</span>
                      <span className="font-mono text-muted-foreground">
                        {f.cnt} · {formatRub(Number(f.amount))}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.max(pct, 4)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Последние лиды */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Последние лиды</p>
          {data.recent_leads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Лидов пока нет</p>
          ) : (
            <div className="space-y-2">
              {data.recent_leads.map((l) => (
                <div key={l.id} className="flex items-center gap-3 p-2 hover:bg-secondary/50 rounded-lg transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {l.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{l.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                      {l.company || l.email || "—"}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {new Date(l.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
