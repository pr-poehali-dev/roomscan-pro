import Icon from "@/components/ui/icon";
import Breadcrumbs from "@/components/Breadcrumbs";
import SectionSEO from "@/components/SectionSEO";
import { GUEST_MODE, type NavItem, type Section } from "./types";

/**
 * Верхняя шапка: мобильный бургер, заголовок раздела на мобилке,
 * Breadcrumbs, SectionSEO, бейдж BETA, колокольчик уведомлений и кнопка выхода.
 */
interface Props {
  navItems: NavItem[];
  active: Section;
  setActive: (s: Section) => void;
  setSidebarOpen: (v: boolean) => void;
  logout: () => void;
}

export default function TopHeader({ navItems, active, setActive, setSidebarOpen, logout }: Props) {
  return (
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
  );
}
