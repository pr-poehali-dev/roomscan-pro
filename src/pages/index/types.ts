/**
 * Общие типы и константы для главной страницы Index.
 * Список секций, навигация, гостевой режим, восстановление активной секции из URL.
 */
import type { User } from "@/lib/api";

export type Section =
  | "home"
  | "scan"
  | "usecases"
  | "projects"
  | "planner"
  | "catalog"
  | "tiles"
  | "styles"
  | "calc"
  | "openings"
  | "staging"
  | "engineering"
  | "modular-houses"
  | "converter"
  | "brands"
  | "learn"
  | "export"
  | "pricing"
  | "partners"
  | "admin"
  | "profile"
  | "help";

export interface NavItem {
  id: Section;
  label: string;
  icon: string;
  hideInGuest?: boolean;
}

export const navItemsAll: NavItem[] = [
  { id: "home", label: "Главная", icon: "Home" },
  { id: "learn", label: "Обучение", icon: "GraduationCap" },
  { id: "scan", label: "Сканирование", icon: "ScanLine" },
  { id: "usecases", label: "Сценарии", icon: "Target" },
  { id: "projects", label: "Мои проекты", icon: "FolderOpen" },
  { id: "planner", label: "Планировщик", icon: "LayoutGrid" },
  { id: "catalog", label: "Каталог мебели", icon: "Sofa" },
  { id: "tiles", label: "Каталог плитки", icon: "Grid2x2" },
  { id: "styles", label: "AI-стили", icon: "Wand2" },
  { id: "calc", label: "Смета ремонта", icon: "Calculator" },
  { id: "openings", label: "Окна и двери", icon: "DoorOpen" },
  { id: "staging", label: "Хоумстейджинг", icon: "TrendingUp" },
  { id: "engineering", label: "Инженерные узлы", icon: "Settings2" },
  { id: "modular-houses", label: "Модульные дома", icon: "Boxes" },
  { id: "converter", label: "Конвертер 3D", icon: "FileBox" },
  { id: "brands", label: "Российские бренды", icon: "Store" },
  { id: "export", label: "Экспорт", icon: "Share2" },
  { id: "pricing", label: "Тарифы", icon: "Wallet" },
  { id: "partners", label: "Партнёрам", icon: "Handshake" },
  { id: "admin", label: "Админ-кабинет", icon: "ShieldCheck" },
  { id: "profile", label: "Профиль", icon: "User", hideInGuest: true },
  { id: "help", label: "Помощь", icon: "LifeBuoy" },
];

// На период тестирования — свободный вход. Регистрация скрыта.
export const GUEST_MODE = true;
export const GUEST_USER: User = {
  id: 0,
  email: "guest@roomscan-ai.ru",
  name: "Гость",
} as User;

export const SIDEBAR_COLLAPSED_KEY = "roomscan:sidebar-collapsed";

// Восстановление активной секции из URL hash при загрузке
export function getInitialSection(): Section {
  if (typeof window === "undefined") return "home";
  const hash = window.location.hash.replace("#", "") as Section;
  const valid: Section[] = [
    "home", "scan", "usecases", "projects", "planner", "catalog", "tiles",
    "styles", "calc", "openings", "staging", "engineering", "modular-houses",
    "converter", "brands", "learn", "export", "pricing", "partners", "admin", "profile", "help",
  ];
  return valid.includes(hash) ? hash : "home";
}
