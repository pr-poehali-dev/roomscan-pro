import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { AUTH_URL, User, getToken, clearToken, apiFetch } from "@/lib/api";
import AuthScreen from "@/components/AuthScreen";
import { ScanSection, PlannerSection, CatalogSection, CalcSection, ExportSection, HelpSection } from "@/components/sections/ContentSections";
import { ProjectsSection, ProfileSection } from "@/components/sections/UserSections";
import UseCasesSection from "@/components/sections/UseCasesSection";
import HomeSection from "@/components/sections/HomeSection";
import StylesSection from "@/components/sections/StylesSection";
import StagingSection from "@/components/sections/StagingSection";
import OpeningsSection from "@/components/sections/OpeningsSection";
import PartnersSection from "@/components/sections/PartnersSection";
import PricingSection from "@/components/sections/PricingSection";
import EngineeringSection from "@/components/sections/EngineeringSection";
import ModularHousesSection from "@/components/sections/ModularHousesSection";
import AdminOffice from "@/components/admin/AdminOffice";
import ScenarioRunner from "@/components/ScenarioRunner";
import AIManager from "@/components/AIManager";
import SectionSEO from "@/components/SectionSEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import SiteFooter from "@/components/SiteFooter";
import ContentProtection from "@/components/ContentProtection";
import CookieBanner from "@/components/CookieBanner";
import type { ScenarioSection } from "@/lib/scenarios";
import type { SectionId } from "@/lib/seo";

type Section =
  | "home"
  | "scan"
  | "usecases"
  | "projects"
  | "planner"
  | "catalog"
  | "styles"
  | "calc"
  | "openings"
  | "staging"
  | "engineering"
  | "modular-houses"
  | "export"
  | "pricing"
  | "partners"
  | "admin"
  | "profile"
  | "help";

const navItemsAll: { id: Section; label: string; icon: string; hideInGuest?: boolean }[] = [
  { id: "home", label: "Главная", icon: "Home" },
  { id: "scan", label: "Сканирование", icon: "ScanLine" },
  { id: "usecases", label: "Сценарии", icon: "Target" },
  { id: "projects", label: "Мои проекты", icon: "FolderOpen" },
  { id: "planner", label: "Планировщик", icon: "LayoutGrid" },
  { id: "catalog", label: "Каталог мебели", icon: "Sofa" },
  { id: "styles", label: "AI-стили", icon: "Wand2" },
  { id: "calc", label: "Смета ремонта", icon: "Calculator" },
  { id: "openings", label: "Окна и двери", icon: "DoorOpen" },
  { id: "staging", label: "Хоумстейджинг", icon: "TrendingUp" },
  { id: "engineering", label: "Инженерные узлы", icon: "Settings2" },
  { id: "modular-houses", label: "Модульные дома", icon: "Boxes" },
  { id: "export", label: "Экспорт", icon: "Share2" },
  { id: "pricing", label: "Тарифы", icon: "Wallet" },
  { id: "partners", label: "Партнёрам", icon: "Handshake" },
  { id: "admin", label: "Админ-кабинет", icon: "ShieldCheck" },
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

// Восстановление активной секции из URL hash при загрузке
function getInitialSection(): Section {
  if (typeof window === "undefined") return "home";
  const hash = window.location.hash.replace("#", "") as Section;
  const valid: Section[] = [
    "home", "scan", "usecases", "projects", "planner", "catalog",
    "styles", "calc", "openings", "staging", "engineering", "modular-houses",
    "export", "pricing", "partners", "admin", "profile", "help",
  ];
  return valid.includes(hash) ? hash : "home";
}

const SIDEBAR_COLLAPSED_KEY = "roomscan:sidebar-collapsed";

export default function Index() {
  const [active, setActive] = useState<Section>(getInitialSection);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1"; }
    catch { return false; }
  });
  const [user, setUser] = useState<User | null>(GUEST_MODE ? GUEST_USER : null);
  const [authChecked, setAuthChecked] = useState(GUEST_MODE);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      try { window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0"); }
      catch { /* noop */ }
      return next;
    });
  };

  // Скролл наверх + синхронизация URL hash при смене секции
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      const newHash = active === "home" ? "" : `#${active}`;
      if (window.location.hash !== newHash) {
        window.history.replaceState(null, "", `${window.location.pathname}${newHash}`);
      }
    }
  }, [active]);

  // Синхронизация: если пользователь жмёт "назад" в браузере
  useEffect(() => {
    const onHashChange = () => {
      setActive(getInitialSection());
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Импорт проекта по ссылке #shared=...
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    const m = hash.match(/^#shared=(.+)$/);
    if (!m) return;
    try {
      const json = decodeURIComponent(escape(atob(decodeURIComponent(m[1]))));
      const project = JSON.parse(json);
      // Импортируем, если такого id ещё нет
      import("@/lib/projectsStore").then(({ listProjects, saveProject }) => {
        const exists = listProjects().find((p) => p.name === project.name);
        if (!exists) {
          saveProject({
            name: `${project.name} (импорт)`,
            scan: project.scan ?? null,
            estimate: project.estimate,
            staging: project.staging,
            notes: project.notes,
          });
          import("@/lib/notify").then(({ notify }) =>
            notify.success(`Проект «${project.name}» импортирован`, "Найдёте его во вкладке «Мои проекты»"),
          );
        }
        // Уберём хэш чтобы не импортить повторно
        window.history.replaceState(null, "", window.location.pathname);
        setActive("projects");
      });
    } catch (err) {
      console.warn("Не удалось импортировать проект из ссылки:", err);
    }
  }, []);

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
    setActive("home");
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icon name="Loader2" size={28} className="text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={setUser} />;

  // Админский пункт меню теперь виден всегда — кликнув на него,
  // пользователь попадёт на форму логина (AdminOffice сам её показывает,
  // если токен отсутствует или истёк).
  const navItems = GUEST_MODE
    ? navItemsAll.filter((n) => !n.hideInGuest)
    : navItemsAll;

  const renderSection = () => {
    switch (active) {
      case "home": return <HomeSection onNavigate={(s) => setActive(s as Section)} userName={user?.name} />;
      case "projects": return <ProjectsSection token={getToken()} onNavigate={(s) => setActive(s as Section)} />;
      case "scan": return <ScanSection />;
      case "usecases": return <UseCasesSection onNavigate={(s) => setActive(s as Section)} />;
      case "planner": return <PlannerSection onNavigate={(s) => setActive(s as Section)} />;
      case "catalog": return <CatalogSection />;
      case "styles": return <StylesSection />;
      case "calc": return <CalcSection />;
      case "openings": return <OpeningsSection />;
      case "staging": return <StagingSection />;
      case "engineering": return <EngineeringSection />;
      case "modular-houses": return <ModularHousesSection />;
      case "export": return <ExportSection />;
      case "pricing": return <PricingSection />;
      case "partners": return <PartnersSection />;
      case "admin": return <AdminOffice />;
      case "profile": return <ProfileSection user={user} onLogout={logout} />;
      case "help": return <HelpSection />;
      default: return <HomeSection onNavigate={(s) => setActive(s as Section)} userName={user?.name} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex font-golos">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 ${collapsed ? "w-16" : "w-64"} bg-card border-r border-border flex flex-col transition-all duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className={`${collapsed ? "p-3" : "p-5"} border-b border-border relative`}>
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} mb-3`}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Icon name="ScanLine" size={17} className="text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="font-black text-foreground text-base tracking-tight truncate">RoomScan AI</p>
                <p className="text-xs text-muted-foreground font-mono truncate">roomscan-ai.ru</p>
              </div>
            )}
          </div>
          {!collapsed && (
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
          )}
          {/* Кнопка сворачивания (только desktop) */}
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 bg-card border border-border rounded-full items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors z-10"
            aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
            title={collapsed ? "Развернуть меню" : "Свернуть меню"}
          >
            <Icon name={collapsed ? "ChevronRight" : "ChevronLeft"} size={12} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActive(item.id); setSidebarOpen(false); }}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-lg text-sm transition-all ${
                active === item.id
                  ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon name={item.icon} size={17} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className={`${collapsed ? "p-2" : "p-4"} border-t border-border`}>
          {collapsed ? (
            !GUEST_MODE ? (
              <button
                onClick={logout}
                title={`Выйти (${user.email})`}
                className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
              >
                <Icon name="LogOut" size={16} />
              </button>
            ) : (
              <div className="flex items-center justify-center p-2" title="Тестовый режим">
                <Icon name="FlaskConical" size={14} className="text-yellow-500" />
              </div>
            )
          ) : GUEST_MODE ? (
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
          <Breadcrumbs
            activeSection={active}
            onNavigate={(s) => setActive(s as Section)}
          />
          <SectionSEO sectionId={active} />
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

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
            <div key={active} className="animate-fade-in">
              {renderSection()}
            </div>
          </div>
          <SiteFooter />
        </div>
      </main>

      <ContentProtection />
      <CookieBanner />

      <ScenarioRunner
        activeSection={active}
        onNavigate={(s: ScenarioSection) => setActive(s as Section)}
      />

      <AIManager
        activeSection={active}
        onNavigate={(s: string) => setActive(s as Section)}
      />
    </div>
  );
}