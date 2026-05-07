import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { partnersApi, type Partner } from "@/lib/adminApi";
import { notify } from "@/lib/notify";

const CATEGORIES = [
  { id: "designer",  label: "Дизайнеры",        icon: "Palette" },
  { id: "builder",   label: "Строители/Ремонт", icon: "Hammer" },
  { id: "furniture", label: "Магазины мебели",  icon: "Sofa" },
  { id: "decor",     label: "Декор / Интерьер", icon: "Lamp" },
  { id: "kitchen",   label: "Кухни",            icon: "ChefHat" },
  { id: "tile",      label: "Плитка / Сантех.", icon: "Bath" },
];

const STATUSES = [
  { id: "discovered", label: "Найден",       color: "bg-blue-500/15 text-blue-500" },
  { id: "contacted",  label: "Связались",    color: "bg-amber-500/15 text-amber-500" },
  { id: "negotiating",label: "Переговоры",   color: "bg-violet-500/15 text-violet-500" },
  { id: "active",     label: "Партнёр",      color: "bg-emerald-500/15 text-emerald-500" },
  { id: "rejected",   label: "Отклонили",    color: "bg-red-500/15 text-red-500" },
];

export default function AdminPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [category, setCategory] = useState("designer");
  const [city, setCity] = useState("Москва");
  const [count, setCount] = useState(8);
  const [filter, setFilter] = useState<{ category: string; status: string }>({ category: "", status: "" });

  const load = async () => {
    setLoading(true);
    try {
      const r = await partnersApi.list({
        category: filter.category || undefined,
        status: filter.status || undefined,
      });
      setPartners(r.items);
    } catch (e) {
      notify.error("Не удалось загрузить партнёров", e instanceof Error ? e.message : "");
    } finally { setLoading(false); }
  };

  useEffect(() => { load();   }, [filter]);

  const runSearch = async () => {
    setSearching(true);
    try {
      const r = await partnersApi.search(category, city, count);
      notify.success(`ИИ нашёл ${r.found}, добавлено ${r.saved}`, `Категория: ${category}, город: ${city}`);
      load();
    } catch (e) {
      notify.error("Поиск не удался", e instanceof Error ? e.message : "");
    } finally { setSearching(false); }
  };

  const updateStatus = async (p: Partner, status: string) => {
    try {
      await partnersApi.update(p.id, { status });
      setPartners((prev) => prev.map((x) => (x.id === p.id ? { ...x, status } : x)));
    } catch (e) {
      notify.error("Не удалось обновить", e instanceof Error ? e.message : "");
    }
  };

  return (
    <div className="space-y-4">
      {/* Блок AI-автопоиска */}
      <div className="bg-gradient-to-br from-primary/15 to-emerald-500/5 border-2 border-primary/30 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">AI</span>
          <p className="font-black text-foreground uppercase tracking-wide text-sm">Автопоиск партнёров через ИИ</p>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          ИИ-агент найдёт релевантных кандидатов по категории и городу и добавит их в базу с оценкой потенциала.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="bg-card border border-border rounded-lg px-3 py-2 text-sm">
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <input value={city} onChange={(e) => setCity(e.target.value)}
                 placeholder="Город (Москва, СПб, Казань…)"
                 className="bg-card border border-border rounded-lg px-3 py-2 text-sm" />
          <select value={count} onChange={(e) => setCount(Number(e.target.value))}
                  className="bg-card border border-border rounded-lg px-3 py-2 text-sm">
            {[5, 8, 10, 15].map((n) => <option key={n} value={n}>{n} компаний</option>)}
          </select>
          <button onClick={runSearch} disabled={searching}
                  className="bg-primary text-primary-foreground hover:opacity-90 font-bold text-sm px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50">
            <Icon name={searching ? "Loader2" : "Sparkles"} size={14} className={searching ? "animate-spin" : ""} />
            {searching ? "Ищу…" : "Запустить поиск"}
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-2 flex-wrap">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Фильтры:</p>
        <select value={filter.category} onChange={(e) => setFilter({...filter, category: e.target.value})}
                className="bg-secondary border border-border rounded px-2 py-1 text-xs">
          <option value="">Все категории</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={filter.status} onChange={(e) => setFilter({...filter, status: e.target.value})}
                className="bg-secondary border border-border rounded px-2 py-1 text-xs">
          <option value="">Все статусы</option>
          {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <span className="text-[11px] text-muted-foreground ml-auto font-mono">Всего: {partners.length}</span>
      </div>

      {/* Список */}
      {loading ? (
        <div className="text-center text-muted-foreground py-8 text-sm">Загрузка…</div>
      ) : partners.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl p-10 text-center">
          <Icon name="Building2" size={28} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-bold text-foreground">Партнёров пока нет</p>
          <p className="text-xs text-muted-foreground mt-1">Запустите AI-автопоиск выше — ИИ найдёт кандидатов</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {partners.map((p) => {
            const st = STATUSES.find((s) => s.id === p.status);
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl p-3 hover:border-primary/40 transition-colors">
                <div className="flex items-start gap-2 mb-2">
                  <Icon name={CATEGORIES.find((c) => c.id === p.category)?.icon || "Building2"}
                        size={18} className="text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="font-bold text-foreground text-sm truncate flex-1">{p.name}</p>
                      <span className="text-[9px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded">
                        AI {p.ai_score}/100
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {CATEGORIES.find((c) => c.id === p.category)?.label || p.category} · {p.city || "—"}
                    </p>
                  </div>
                </div>

                {p.ai_summary && (
                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed line-clamp-3">
                    {p.ai_summary}
                  </p>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Icon name="ExternalLink" size={11} />
                      Сайт
                    </a>
                  )}
                  {p.email && <span className="text-[11px] text-muted-foreground font-mono truncate">{p.email}</span>}
                  <select value={p.status} onChange={(e) => updateStatus(p, e.target.value)}
                          className={`ml-auto text-[10px] font-bold rounded px-2 py-1 border-0 ${st?.color || "bg-secondary"}`}>
                    {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
