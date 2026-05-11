import { useState, useEffect, Suspense } from "react";
import Icon from "@/components/ui/icon";
import { AUTH_URL, User, getToken, clearToken, apiFetch } from "@/lib/api";
import AuthScreen from "@/components/AuthScreen";
import ScenarioRunner from "@/components/ScenarioRunner";
import AIManager from "@/components/AIManager";
import SiteFooter from "@/components/SiteFooter";
import ContentProtection from "@/components/ContentProtection";
import CookieBanner from "@/components/CookieBanner";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import { isOnboarded } from "@/lib/onboardingStore";
import type { ScenarioSection } from "@/lib/scenarios";
import {
  type Section,
  navItemsAll,
  GUEST_MODE,
  GUEST_USER,
  SIDEBAR_COLLAPSED_KEY,
  getInitialSection,
} from "./index/types";
import SectionSkeleton from "./index/SectionSkeleton";
import Sidebar from "./index/Sidebar";
import TopHeader from "./index/TopHeader";
import SectionRouter from "./index/SectionRouter";

export default function Index() {
  const [active, setActive] = useState<Section>(getInitialSection);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1"; }
    catch { return false; }
  });
  const [user, setUser] = useState<User | null>(GUEST_MODE ? GUEST_USER : null);
  const [authChecked, setAuthChecked] = useState(GUEST_MODE);
  // Онбординг — первый запуск, мини-тур из 3 шагов
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !isOnboarded());

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

  return (
    <div className="min-h-screen bg-background flex font-golos">
      <Sidebar
        navItems={navItems}
        active={active}
        collapsed={collapsed}
        sidebarOpen={sidebarOpen}
        user={user}
        setActive={setActive}
        setSidebarOpen={setSidebarOpen}
        toggleCollapsed={toggleCollapsed}
        logout={logout}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <TopHeader
          navItems={navItems}
          active={active}
          setActive={setActive}
          setSidebarOpen={setSidebarOpen}
          logout={logout}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
            <div key={active} className="animate-fade-in">
              <Suspense fallback={<SectionSkeleton />}>
                <SectionRouter
                  active={active}
                  user={user}
                  setActive={setActive}
                  logout={logout}
                />
              </Suspense>
            </div>
          </div>
          <SiteFooter />
        </div>
      </main>

      <ContentProtection />
      <CookieBanner />

      {showOnboarding && (
        <OnboardingTour
          onNavigate={(s) => setActive(s as Section)}
          onClose={() => setShowOnboarding(false)}
        />
      )}

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
