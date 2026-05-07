import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import AdminDashboard from "./AdminDashboard";
import AdminCRM from "./AdminCRM";
import AdminPartners from "./AdminPartners";
import AdminSalesAgent from "./AdminSalesAgent";
import AdminLogin from "./AdminLogin";
import { adminAuthApi, clearAdminToken, getAdminLogin, getAdminToken } from "@/lib/adminApi";
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
  const [authState, setAuthState] = useState<"loading" | "authed" | "anon">("loading");
  const [adminLogin, setAdminLogin] = useState("");

  const checkAuth = async () => {
    if (!getAdminToken()) {
      setAuthState("anon");
      return;
    }
    setAuthState("loading");
    const ok = await adminAuthApi.verify();
    if (ok) {
      setAdminLogin(getAdminLogin());
      setAuthState("authed");
    } else {
      clearAdminToken();
      setAuthState("anon");
    }
  };

  useEffect(() => { checkAuth(); }, []);

  const handleLogout = () => {
    clearAdminToken();
    setAuthState("anon");
    notify.info("Вы вышли из админ-кабинета");
  };

  if (authState === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Icon name="Loader2" size={28} className="text-primary animate-spin" />
      </div>
    );
  }

  if (authState === "anon") {
    return <AdminLogin onSuccess={() => checkAuth()} />;
  }

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
        <div className="flex items-center gap-2">
          <div className="bg-card border border-border rounded-lg px-3 py-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
              <Icon name="User" size={13} className="text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-muted-foreground leading-none">админ</p>
              <p className="text-xs font-bold text-foreground leading-tight">{adminLogin || "—"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-card border border-border hover:border-destructive hover:text-destructive text-foreground font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Icon name="LogOut" size={13} />
            Выйти
          </button>
        </div>
      </div>

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