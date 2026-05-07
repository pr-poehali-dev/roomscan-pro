import { useState } from "react";
import Icon from "@/components/ui/icon";
import AdminDashboard from "./AdminDashboard";
import AdminCRM from "./AdminCRM";
import AdminPartners from "./AdminPartners";
import AdminSalesAgent from "./AdminSalesAgent";
import { getAdminToken, setAdminToken } from "@/lib/adminApi";
import { notify } from "@/lib/notify";

type Tab = "dashboard" | "crm" | "partners" | "ai";

const TABS: { id: Tab; label: string; icon: string; desc: string }[] = [
  { id: "dashboard", label: "Дашборд",   icon: "LayoutDashboard", desc: "Метрики и воронка" },
  { id: "crm",       label: "CRM",       icon: "Users",            desc: "Лиды, сделки, активности" },
  { id: "partners",  label: "Партнёры",  icon: "Building2",        desc: "AI-автопоиск партнёров" },
  { id: "ai",        label: "AI-агент",  icon: "Bot",              desc: "Письма и переговоры" },
];

/**
 * Админ-кабинет: мини-офис с CRM, партнёрами и ИИ-агентом продаж.
 */
export default function AdminOffice() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [tokenInput, setTokenInput] = useState(getAdminToken());
  const [showToken, setShowToken] = useState(false);

  const saveToken = () => {
    setAdminToken(tokenInput.trim());
    notify.success("Токен сохранён", "Все запросы к админ-API будут авторизованы");
  };

  return (
    <div className="animate-fade-in space-y-4">
      {/* Шапка */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">Админ-кабинет</p>
          <h2 className="text-3xl font-black text-foreground">Мини-офис RoomScan AI</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            CRM, отдел продаж с ИИ-агентом и автопоиск партнёров — в одном кабинете.
          </p>
        </div>
        <button
          onClick={() => setShowToken((v) => !v)}
          className="bg-card border border-border hover:border-primary text-foreground font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5"
        >
          <Icon name={showToken ? "X" : "Key"} size={12} />
          {showToken ? "Скрыть" : "Токен админа"}
        </button>
      </div>

      {showToken && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2 flex-wrap">
          <Icon name="Shield" size={14} className="text-amber-500" />
          <p className="text-xs text-foreground flex-1 min-w-[200px]">
            Введите ADMIN_TOKEN (если задан в секретах бэкенда). Сохраняется локально в браузере.
          </p>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="токен"
            className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm font-mono"
          />
          <button
            onClick={saveToken}
            className="bg-amber-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg hover:opacity-90"
          >
            Сохранить
          </button>
        </div>
      )}

      {/* Табы */}
      <div className="bg-card border border-border rounded-xl p-1 flex items-center gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${
              tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Icon name={t.icon} size={14} />
            <span>{t.label}</span>
            <span className={`hidden md:inline text-[10px] font-mono ${tab === t.id ? "opacity-80" : "opacity-50"}`}>
              · {t.desc}
            </span>
          </button>
        ))}
      </div>

      {/* Контент таба */}
      <div className="animate-fade-in" key={tab}>
        {tab === "dashboard" && <AdminDashboard />}
        {tab === "crm"       && <AdminCRM />}
        {tab === "partners"  && <AdminPartners />}
        {tab === "ai"        && <AdminSalesAgent />}
      </div>
    </div>
  );
}
