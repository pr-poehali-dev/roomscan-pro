import Icon from "@/components/ui/icon";
import type { User } from "@/lib/api";
import { GUEST_MODE, type NavItem, type Section } from "./types";

/**
 * Левый сайдбар: логотип, ссылка на экосистему АВАНГАРД, список разделов
 * и блок профиля/гостевого режима снизу. Состояние свёрнутости и колбэки
 * приходят сверху из Index, чтобы вся бизнес-логика осталась там.
 */
interface Props {
  navItems: NavItem[];
  active: Section;
  collapsed: boolean;
  sidebarOpen: boolean;
  user: User;
  setActive: (s: Section) => void;
  setSidebarOpen: (v: boolean) => void;
  toggleCollapsed: () => void;
  logout: () => void;
}

export default function Sidebar({
  navItems,
  active,
  collapsed,
  sidebarOpen,
  user,
  setActive,
  setSidebarOpen,
  toggleCollapsed,
  logout,
}: Props) {
  return (
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
  );
}
