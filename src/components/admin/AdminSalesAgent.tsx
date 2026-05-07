import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { salesAgentApi, partnersApi, crmApi, type Partner, type Lead, type AILog, type SalesAction } from "@/lib/adminApi";
import { notify } from "@/lib/notify";

const ACTIONS: { id: SalesAction; label: string; icon: string; desc: string }[] = [
  { id: "outreach",  label: "Письмо партнёру",       icon: "Mail",         desc: "Первое письмо с предложением интеграции" },
  { id: "reply",     label: "Ответ на сообщение",    icon: "MessageSquare",desc: "Ответить партнёру / отработать возражение" },
  { id: "next_step", label: "След. шаги по лиду",    icon: "ListChecks",   desc: "3 следующих действия по лиду" },
  { id: "qualify",   label: "Квалификация лида",     icon: "Target",       desc: "Скоринг лида: hot/warm/cold + сумма" },
];

export default function AdminSalesAgent() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<AILog[]>([]);
  const [action, setAction] = useState<SalesAction>("outreach");
  const [partnerId, setPartnerId] = useState<number | "">("");
  const [leadId, setLeadId] = useState<number | "">("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState("");
  const [parsed, setParsed] = useState<unknown>(null);

  useEffect(() => {
    Promise.all([
      partnersApi.list(),
      crmApi.leads(),
      salesAgentApi.logs("sales-agent"),
    ]).then(([p, l, lg]) => {
      setPartners(p.items);
      setLeads(l.items);
      setLogs(lg.items);
    }).catch(() => {});
  }, []);

  const refreshLogs = async () => {
    try {
      const r = await salesAgentApi.logs("sales-agent");
      setLogs(r.items);
    } catch { /* noop */ }
  };

  const run = async () => {
    setBusy(true);
    setOutput("");
    setParsed(null);
    try {
      const params: Record<string, unknown> = {};
      if (partnerId) params.partner_id = partnerId;
      if (leadId) params.lead_id = leadId;
      if (action === "reply" && message) params.message = message;

      const r = await salesAgentApi.ask(action, params);
      setOutput(r.result);
      setParsed(r.parsed);
      refreshLogs();
      notify.success("Готово", `Использовано токенов: ${r.tokens_used}`);
    } catch (e) {
      notify.error("Ошибка ИИ-агента", e instanceof Error ? e.message : "");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(output);
      notify.success("Скопировано в буфер");
    } catch {
      notify.error("Не удалось скопировать");
    }
  };

  const needsPartner = action === "outreach" || action === "reply";
  const needsLead = action === "next_step" || action === "qualify";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
      {/* Левая панель — настройки */}
      <div className="space-y-3">
        <div className="bg-card border border-border rounded-xl p-3 space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Действие</p>
          <div className="grid grid-cols-2 gap-1.5">
            {ACTIONS.map((a) => (
              <button key={a.id} onClick={() => setAction(a.id)}
                      className={`p-2 rounded-lg text-left transition-all ${
                        action === a.id ? "bg-primary/15 border-2 border-primary" : "bg-secondary border-2 border-transparent hover:bg-secondary/70"
                      }`}>
                <Icon name={a.icon} size={14} className={action === a.id ? "text-primary mb-1" : "mb-1"} />
                <p className="text-[11px] font-bold text-foreground leading-tight">{a.label}</p>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {ACTIONS.find((a) => a.id === action)?.desc}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-3 space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Контекст</p>

          {needsPartner && (
            <div>
              <label className="text-[10px] font-mono text-muted-foreground">Партнёр</label>
              <select value={partnerId} onChange={(e) => setPartnerId(e.target.value ? Number(e.target.value) : "")}
                      className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm mt-0.5">
                <option value="">— выберите партнёра —</option>
                {partners.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
              </select>
            </div>
          )}

          {needsLead && (
            <div>
              <label className="text-[10px] font-mono text-muted-foreground">Лид</label>
              <select value={leadId} onChange={(e) => setLeadId(e.target.value ? Number(e.target.value) : "")}
                      className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm mt-0.5">
                <option value="">— выберите лида —</option>
                {leads.map((l) => <option key={l.id} value={l.id}>{l.name} {l.company ? `· ${l.company}` : ""}</option>)}
              </select>
            </div>
          )}

          {action === "reply" && (
            <div>
              <label className="text-[10px] font-mono text-muted-foreground">Сообщение партнёра</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                        rows={4} placeholder="Вставьте текст письма от партнёра…"
                        className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm mt-0.5 resize-none" />
            </div>
          )}

          <button onClick={run} disabled={busy || (needsPartner && !partnerId) || (needsLead && !leadId)}
                  className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
            <Icon name={busy ? "Loader2" : "Sparkles"} size={14} className={busy ? "animate-spin" : ""} />
            {busy ? "ИИ работает…" : "Запустить ИИ-агента"}
          </button>
        </div>

        {/* Логи */}
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">История</p>
            <button onClick={refreshLogs} className="text-muted-foreground hover:text-foreground">
              <Icon name="RefreshCw" size={12} />
            </button>
          </div>
          {logs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">Пусто</p>
          ) : (
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {logs.slice(0, 15).map((lg) => (
                <div key={lg.id} className="text-[11px] p-2 bg-secondary/40 rounded">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-foreground">{lg.action}</span>
                    <span className="text-muted-foreground font-mono">{lg.tokens_used}t</span>
                  </div>
                  <p className="text-muted-foreground font-mono text-[10px]">
                    {new Date(lg.created_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Правая панель — результат */}
      <div className="bg-card border border-border rounded-xl p-4 min-h-[400px]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Результат</p>
          {output && (
            <button onClick={copy} className="text-xs bg-secondary hover:bg-secondary/70 text-foreground font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Icon name="Copy" size={12} />
              Копировать
            </button>
          )}
        </div>

        {!output && !busy && (
          <div className="flex flex-col items-center justify-center h-72 text-center">
            <Icon name="Bot" size={36} className="text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground max-w-sm">
              Выберите действие, заполните контекст слева и запустите ИИ-агента — результат появится здесь
            </p>
          </div>
        )}

        {busy && (
          <div className="flex flex-col items-center justify-center h-72 gap-3">
            <Icon name="Loader2" size={28} className="text-primary animate-spin" />
            <p className="text-sm text-foreground">ИИ-агент думает…</p>
            <p className="text-xs text-muted-foreground">Обычно 5–15 секунд</p>
          </div>
        )}

        {output && (
          <div className="space-y-3">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90 bg-secondary/30 rounded-lg p-3">
              {output}
            </pre>

            {parsed !== null && parsed !== undefined && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-2">
                  Структурированный результат
                </p>
                <pre className="text-xs font-mono text-foreground overflow-x-auto">
                  {JSON.stringify(parsed, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
