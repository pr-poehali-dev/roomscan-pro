/**
 * Тарифные планы RoomScan AI.
 * Цены в рублях за месяц. Годовая подписка — со скидкой -20%.
 */

export type PlanId = "free" | "pro" | "studio" | "business";

export interface PlanFeature {
  /** Текст возможности */
  text: string;
  /** Подчеркнуть как главное преимущество */
  highlight?: boolean;
  /** Перечеркнуть (нет в этом тарифе) */
  off?: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  /** Короткое описание для кого */
  audience: string;
  /** Месячная цена ₽ */
  priceMonthly: number;
  /** Годовая цена ₽/мес (со скидкой) */
  priceYearly: number;
  /** Краткий слоган */
  tagline: string;
  /** Цвет акцента */
  accent: "muted" | "primary" | "studio" | "premium";
  /** Является ли тариф популярным (бейдж) */
  badge?: string;
  /** Что включено */
  features: PlanFeature[];
  /** Текст кнопки */
  cta: string;
  /** Триал в днях (бесплатный пробный период) */
  trialDays?: number;
  /** ROI-прогноз — сколько окупает в месяц */
  roiHint?: string;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    audience: "Для собственников квартир и разовых задач",
    priceMonthly: 0,
    priceYearly: 0,
    tagline: "Базовый набор бесплатно. Без регистрации, локально в браузере.",
    accent: "muted",
    cta: "Уже доступно",
    features: [
      { text: "До 3 проектов одновременно" },
      { text: "5 сканирований комнат / месяц" },
      { text: "2D-планировщик и 3D-просмотр" },
      { text: "Каталог мебели + AR-примерка" },
      { text: "Каталог плитки (85+ моделей)" },
      { text: "Смета ремонта (Эконом/Стандарт/Премиум)" },
      { text: "Региональные коэффициенты (20+ регионов)" },
      { text: "3 AI-стиля интерьера" },
      { text: "3 AI-генерации FLUX / месяц" },
      { text: "3 AI-детекции мебели по фото / месяц" },
      { text: "Экспорт PDF, PNG, CSV" },
      { text: "Шеринг проектов ссылкой" },
      { text: "Split-view 2D + 3D (Live)", off: true },
      { text: "Excel-спецификация под закупку", off: true },
      { text: "Экспорт DWG/DXF, GLB, USDZ", off: true },
      { text: "White-label брендирование", off: true },
    ],
  },
  {
    id: "pro",
    name: "PRO",
    audience: "Для дизайнеров, риелторов, частных мастеров",
    priceMonthly: 990,
    priceYearly: 790,
    tagline: "Снимаем лимиты, открываем профессиональные форматы экспорта.",
    accent: "primary",
    badge: "Популярно",
    cta: "Попробовать 7 дней",
    trialDays: 7,
    roiHint: "Окупается за 1 проект (один клиент = ~30 000 ₽)",
    features: [
      { text: "До 50 проектов одновременно", highlight: true },
      { text: "50 сканирований / месяц", highlight: true },
      { text: "Split-view: 2D-план + Live 3D", highlight: true },
      { text: "Все возможности Free" },
      { text: "Все 8 AI-стилей FLUX + кастомные палитры" },
      { text: "100 AI-генераций / месяц" },
      { text: "100 AI-детекций мебели по фото / месяц" },
      { text: "Excel-спецификация под закупку", highlight: true },
      { text: "Экспорт OBJ / GLB / USDZ (3D)", highlight: true },
      { text: "Экспорт DWG / DXF (AutoCAD)", highlight: true },
      { text: "PDF-комплект чертежей (план/фасад/разрез)" },
      { text: "Брендированный шеринг проектов" },
      { text: "Приоритет в очереди AI" },
      { text: "Email-поддержка за 24 часа" },
      { text: "White-label PDF (ваш логотип)", off: true },
      { text: "Команда до 5 пользователей", off: true },
    ],
  },
  {
    id: "studio",
    name: "STUDIO",
    audience: "Для дизайн-студий и небольших бюро (2-5 человек)",
    priceMonthly: 2490,
    priceYearly: 1990,
    tagline: "White-label, командная работа, безлимит на стилизации — для студий.",
    accent: "studio",
    badge: "Новинка",
    cta: "Попробовать 14 дней",
    trialDays: 14,
    roiHint: "Один white-label-проект = ~50 000 ₽ доп. маржи",
    features: [
      { text: "Команда до 5 пользователей", highlight: true },
      { text: "White-label PDF и Excel (ваш логотип)", highlight: true },
      { text: "Безлимит AI-генераций FLUX", highlight: true },
      { text: "Безлимит AI-детекций по фото", highlight: true },
      { text: "Все возможности PRO" },
      { text: "Бренд-кит студии: цвет, логотип, контакты" },
      { text: "Спецификация для закупки с маржой студии" },
      { text: "Шеринг проектов на вашем поддомене" },
      { text: "Кастомные шаблоны PDF" },
      { text: "Удаление водяных знаков" },
      { text: "Telegram-поддержка за 4 часа" },
      { text: "Командные дашборды и аналитика" },
      { text: "API-доступ + Webhook", off: true },
      { text: "Команда более 5 человек", off: true },
    ],
  },
  {
    id: "business",
    name: "BUSINESS",
    audience: "Для агентств, подрядных бригад, застройщиков",
    priceMonthly: 4990,
    priceYearly: 3990,
    tagline: "Команда, API, ваш брендинг — для агентств и застройщиков.",
    accent: "premium",
    cta: "Запросить BUSINESS",
    roiHint: "Один объект = ~250 000 ₽ маржи + автоматизация документооборота",
    features: [
      { text: "Безлимит проектов и сканов", highlight: true },
      { text: "Все возможности STUDIO" },
      { text: "Команда до 25 пользователей", highlight: true },
      { text: "API-доступ к данным проектов", highlight: true },
      { text: "Webhook на изменения" },
      { text: "Интеграция с Bitrix24 / amoCRM" },
      { text: "Импорт каталога партнёра (CSV/API)" },
      { text: "Кастомный домен (project.studio.ru)" },
      { text: "Персональный аккаунт-менеджер" },
      { text: "Telegram-чат с командой за 1 час" },
      { text: "SLA 99.9% и расширенный лог" },
      { text: "Договор от ООО, оплата по счёту" },
      { text: "Onboarding-сессия для команды" },
    ],
  },
];

export function formatRubMonth(n: number): string {
  if (n === 0) return "0 ₽";
  return `${n.toLocaleString("ru-RU")} ₽`;
}

export interface ComparisonRow {
  label: string;
  free: string | boolean;
  pro: string | boolean;
  studio: string | boolean;
  business: string | boolean;
  /** Уникальная фича (есть только у нас, нет у конкурентов) */
  unique?: boolean;
}

export const COMPARISON_TABLE: ComparisonRow[] = [
  { label: "Цена за месяц",                       free: "0 ₽",       pro: "990 ₽",      studio: "2 490 ₽", business: "4 990 ₽" },
  { label: "Бесплатный триал",                    free: "—",         pro: "7 дней",     studio: "14 дней", business: "По запросу" },
  { label: "Проектов одновременно",               free: "3",         pro: "50",         studio: "Безлимит", business: "Безлимит" },
  { label: "3D-сканирований / месяц",             free: "5",         pro: "50",         studio: "Безлимит", business: "Безлимит" },
  { label: "Планировщик 2D/3D",                   free: true,        pro: true,         studio: true,      business: true },
  { label: "Split-view: 2D + Live 3D",            free: false,       pro: true,         studio: true,      business: true, unique: true },
  { label: "AR-примерка мебели",                  free: true,        pro: true,         studio: true,      business: true, unique: true },
  { label: "AI-детекция мебели по фото",          free: "3 / мес",   pro: "100 / мес",  studio: "Безлимит", business: "Безлимит", unique: true },
  { label: "Смета по 20 регионам РФ",             free: true,        pro: true,         studio: true,      business: true },
  { label: "AI-стили FLUX (8 шт)",                free: "3 базовых", pro: "Все + кастомные", studio: "Все + безлимит", business: "Все + безлимит" },
  { label: "AI-генераций / месяц",                free: "3",         pro: "100",        studio: "Безлимит", business: "Безлимит" },
  { label: "Каталог мебели (80+ SKU)",            free: true,        pro: true,         studio: true,      business: true },
  { label: "Каталог плитки (85+ моделей)",        free: true,        pro: true,         studio: true,      business: true },
  { label: "Excel-спецификация под закупку",      free: false,       pro: true,         studio: "С маржой", business: "С маржой", unique: true },
  { label: "Экспорт PDF / PNG / CSV",             free: true,        pro: true,         studio: true,      business: true },
  { label: "Экспорт OBJ / GLB / USDZ",            free: false,       pro: true,         studio: true,      business: true },
  { label: "Экспорт DWG / DXF (AutoCAD)",         free: false,       pro: true,         studio: true,      business: true },
  { label: "PDF-комплект чертежей",               free: false,       pro: true,         studio: true,      business: true },
  { label: "White-label брендирование",           free: false,       pro: false,        studio: true,      business: true, unique: true },
  { label: "Команда (доп. пользователи)",         free: false,       pro: false,        studio: "до 5",    business: "до 25" },
  { label: "API-доступ + Webhook",                free: false,       pro: false,        studio: false,     business: true },
  { label: "Кастомный домен",                     free: false,       pro: false,        studio: false,     business: true },
  { label: "Интеграции CRM (Bitrix/amo)",         free: false,       pro: false,        studio: false,     business: true },
  { label: "Приоритет очереди AI",                free: false,       pro: true,         studio: true,      business: true },
  { label: "Поддержка",                           free: "Чат-бот",   pro: "Email 24ч",  studio: "TG 4ч",   business: "TG 1ч + менеджер" },
];

/**
 * Сравнение с конкурентами на рынке РФ. Используется в блоке «Почему мы».
 */
export interface CompetitorRow {
  feature: string;
  us: boolean | string;
  planoplan: boolean | string;
  homestyler: boolean | string;
  houzz: boolean | string;
}

export const COMPETITORS_COMPARISON: CompetitorRow[] = [
  { feature: "AI-детекция мебели по фото",       us: true,         planoplan: false,  homestyler: false, houzz: false },
  { feature: "AR-примерка в реальной комнате",   us: true,         planoplan: false,  homestyler: true,  houzz: false },
  { feature: "Реальный FLUX-стайлинг (8 стилей)", us: true,         planoplan: false,  homestyler: true,  houzz: false },
  { feature: "Смета по 20 регионам РФ",          us: true,         planoplan: false,  homestyler: false, houzz: false },
  { feature: "Excel-спецификация под закупку",   us: true,         planoplan: false,  homestyler: false, houzz: true },
  { feature: "Экспорт DWG/DXF",                  us: true,         planoplan: false,  homestyler: false, houzz: false },
  { feature: "White-label / бренд-кит",          us: "от 2 490 ₽",  planoplan: false,  homestyler: false, houzz: "от $85/мес" },
  { feature: "Каталог мебели РФ-брендов",        us: true,         planoplan: true,   homestyler: false, houzz: false },
  { feature: "Локализация (RU)",                 us: true,         planoplan: true,   homestyler: false, houzz: false },
  { feature: "Цена входа (мес)",                 us: "0 ₽",         planoplan: "990 ₽", homestyler: "$10",  houzz: "$85" },
];
