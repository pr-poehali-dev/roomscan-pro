import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { AUTH_URL, User, getToken, clearToken, apiFetch } from "@/lib/api";
import AuthScreen from "@/components/AuthScreen";
import { ScanSection, PlannerSection, CatalogSection, CalcSection, ExportSection, HelpSection } from "@/components/sections/ContentSections";
import { ProjectsSection, ProfileSection } from "@/components/sections/UserSections";
import UseCasesSection from "@/components/sections/UseCasesSection";
import StylesSection from "@/components/sections/StylesSection";
import PartnersSection from "@/components/sections/PartnersSection";
import AdminSection from "@/components/sections/AdminSection";
import ScenarioRunner from "@/components/ScenarioRunner";
import type { ScenarioSection } from "@/lib/scenarios";

type Section =
  | "scan"
  | "usecases"
  | "projects"
  | "planner"
  | "catalog"
  | "styles"
  | "calc"
  | "export"
  | "partners"
  | "admin"
  | "profile"
  | "help";

const navItemsAll: { id: Section; label: string; icon: string; hideInGuest?: boolean; adminOnly?: boolean }[] = [
  { id: "scan", label: "Сканирование", icon: "ScanLine" },
  { id: "usecases", label: "Сценарии", icon: "Target" },
  { id: "projects", label: "Мои проекты", icon: "FolderOpen", hideInGuest: true },
  { id: "planner", label: "Планировщик", icon: "LayoutGrid" },
  { id: "catalog", label: "Каталог мебели", icon: "Sofa" },
  { id: "styles", label: "AI-стили", icon: "Wand2" },
  { id: "calc", label: "Расчёты", icon: "Calculator" },
  { id: "export", label: "Экспорт", icon: "Share2" },
  { id: "partners", label: "Партнёрам", icon: "Handshake" },
  { id: "admin", label: "Админ", icon: "ShieldCheck", adminOnly: true },
  { id: "profile", label: "Профиль", icon: "User", hideInGuest: true },
  { id: "help", label: "Помощь", icon: "LifeBuoy" },
];

// На период тестирования — свободный вход. Регистрация скрыта.
const GUEST_MODE = true;
const GUEST_USER: User = {
  id: 0,
  email: "guest@roomscan-ai.ru",
  name: "Гость",
} as User;

export default function Index() {
  const [active, setActive] = useState<Section>("scan");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(GUEST_MODE ? GUEST_USER : null);
  const [authChecked, setAuthChecked] = useState(GUEST_MODE);

  // Скролл наверх и закрытие сайдбара при смене секции
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [active]);

  useEffect(() => {
    if (GUEST_MODE) return;
    const token = getToken();
    if (!token) { setAuthChecked(true); return; }
    apiFetch(`${AUTH_URL}?action=verify`).then(({ status, data }) => {
      if (status === 200 && data.user) setUser(data.user);
      else clearToken();
      setAuthChecked(true);
    });
  }, []);

  const logout = () => {
    if (GUEST_MODE) return; // в гостевом режиме выход недоступен
    clearToken();
    setUser(null);
    setActive("scan");
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icon name="Loader2" size={28} className="text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={setUser} />;

  // Админский пункт меню видим только если есть токен в localStorage
  // или если URL имеет hash #admin (для первичного входа).
  const hasAdminToken = typeof window !== "undefined" &&
    (!!localStorage.getItem("roomscan:admin_token") || window.location.hash === "#admin");

  let navItems = GUEST_MODE
    ? navItemsAll.filter((n) => !n.hideInGuest)
    : navItemsAll;
  if (!hasAdminToken) navItems = navItems.filter((n) => !n.adminOnly);

  const renderSection = () => {
    switch (active) {
      case "projects": return <ProjectsSection token={getToken()} />;
      case "scan": return <ScanSection />;
      case "usecases": return <UseCasesSection onNavigate={(s) => setActive(s as Section)} />;
      case "planner": return <PlannerSection />;
      case "catalog": return <CatalogSection />;
      case "styles": return <StylesSection />;
      case "calc": return <CalcSection />;
      case "export": return <ExportSection />;
      case "partners": return <PartnersSection />;
      case "admin": return <AdminSection />;
      case "profile": return <ProfileSection user={user} onLogout={logout} />;
      case "help": return <HelpSection />;
      default: return <ScanSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex font-golos">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="ScanLine" size={17} className="text-primary-foreground" />
            </div>
            <div>
              <p className="font-black text-foreground text-base tracking-tight">RoomScan AI</p>
              <p className="text-xs text-muted-foreground font-mono">roomscan-ai.ru</p>
            </div>
          </div>
          <a
            href="https://avangard-ai.ru"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Icon name="Zap" size={11} className="text-primary" />
            <span>Экосистема <span className="font-semibold text-primary">АВАНГАРД</span></span>
            <Icon name="ExternalLink" size={10} className="ml-auto opacity-50" />
          </a>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActive(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active === item.id
                  ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon name={item.icon} size={17} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          {GUEST_MODE ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="FlaskConical" size={13} className="text-yellow-500" />
                <p className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Тестовый режим</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Свободный вход. Регистрация откроется после релиза.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center shrink-0">
                <Icon name="User" size={15} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{user.email}</p>
              </div>
              <button onClick={logout} title="Выйти" className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                <Icon name="LogOut" size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border px-6 py-4 flex items-center justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Icon name="Menu" size={22} />
            </button>
            <span className="lg:hidden text-sm font-semibold text-foreground">
              {navItems.find((n) => n.id === active)?.label}
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <a href="https://avangard-ai.ru" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
              <Icon name="Zap" size={11} className="text-primary" />
              АВАНГАРД
            </a>
            <span className="text-border">/</span>
            <span className="text-muted-foreground">RoomScan AI</span>
            <span className="text-border">/</span>
            <span className="text-foreground">{navItems.find((n) => n.id === active)?.label}</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            {GUEST_MODE && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-md px-2 py-1">
                <Icon name="FlaskConical" size={11} />
                BETA
              </span>
            )}
            <button className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="Bell" size={20} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
            </button>
            {!GUEST_MODE && (
              <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors" title="Выйти">
                <Icon name="LogOut" size={20} />
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div key={active} className="animate-fade-in">
            {renderSection()}
          </div>
        </div>
      </main>

      <ScenarioRunner
        activeSection={active}
        onNavigate={(s: ScenarioSection) => setActive(s as Section)}
      />
    </div>
  );
}