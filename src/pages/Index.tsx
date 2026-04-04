import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { AUTH_URL, User, getToken, clearToken, apiFetch } from "@/lib/api";
import AuthScreen from "@/components/AuthScreen";
import { ScanSection, PlannerSection, CatalogSection, CalcSection, ExportSection, HelpSection } from "@/components/sections/ContentSections";
import { ProjectsSection, ProfileSection } from "@/components/sections/UserSections";

type Section =
  | "scan"
  | "projects"
  | "planner"
  | "catalog"
  | "calc"
  | "export"
  | "profile"
  | "help";

const navItems: { id: Section; label: string; icon: string }[] = [
  { id: "scan", label: "Сканирование", icon: "ScanLine" },
  { id: "projects", label: "Мои проекты", icon: "FolderOpen" },
  { id: "planner", label: "Планировщик", icon: "LayoutGrid" },
  { id: "catalog", label: "Каталог мебели", icon: "Sofa" },
  { id: "calc", label: "Расчёты", icon: "Calculator" },
  { id: "export", label: "Экспорт", icon: "Share2" },
  { id: "profile", label: "Профиль", icon: "User" },
  { id: "help", label: "Помощь", icon: "LifeBuoy" },
];

export default function Index() {
  const [active, setActive] = useState<Section>("scan");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { setAuthChecked(true); return; }
    apiFetch(`${AUTH_URL}?action=verify`).then(({ status, data }) => {
      if (status === 200 && data.user) setUser(data.user);
      else clearToken();
      setAuthChecked(true);
    });
  }, []);

  const logout = () => { clearToken(); setUser(null); setActive("scan"); };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icon name="Loader2" size={28} className="text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={setUser} />;

  const renderSection = () => {
    switch (active) {
      case "projects": return <ProjectsSection token={getToken()} />;
      case "scan": return <ScanSection />;
      case "planner": return <PlannerSection />;
      case "catalog": return <CatalogSection />;
      case "calc": return <CalcSection />;
      case "export": return <ExportSection />;
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
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
              <Icon name="ScanLine" size={18} className="text-primary-foreground" />
            </div>
            <div>
              <p className="font-black text-foreground text-base tracking-tight">PlanScan</p>
              <p className="text-xs text-muted-foreground font-mono">v3.1 Pro</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActive(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-all ${
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
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-secondary rounded-sm flex items-center justify-center shrink-0">
              <Icon name="User" size={15} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{user.email}</p>
            </div>
            <button onClick={logout} title="Выйти" className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
              <Icon name="LogOut" size={15} />
            </button>
          </div>
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
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon name="Menu" size={22} />
          </button>
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span>PlanScan</span>
            <span className="text-border">/</span>
            <span className="text-foreground">{navItems.find((n) => n.id === active)?.label}</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="Bell" size={20} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
            </button>
            <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors" title="Выйти">
              <Icon name="LogOut" size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
