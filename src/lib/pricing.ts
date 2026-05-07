/**
 * Тарифные планы RoomScan AI.
 * Цены в рублях за месяц. Годовая подписка — со скидкой -20%.
 */

export type PlanId = "free" | "pro" | "business";

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
  accent: "muted" | "primary" | "premium";
  /** Является ли тариф популярным (бейдж) */
  badge?: string;
  /** Что включено */
  features: PlanFeature[];
  /** Текст кнопки */
  cta: string;
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
      { text: "Смета ремонта (Эконом/Стандарт/Премиум)" },
      { text: "Региональные коэффициенты (20+ регионов)" },
      { text: "3 AI-стиля интерьера" },
      { text: "3 AI-анализа фото (хоумстейджинг) / месяц" },
      { text: "Экспорт PDF, PNG, CSV" },
      { text: "Шеринг проектов ссылкой" },
      { text: "Экспорт в OBJ/GLB/USDZ", off: true },
      { text: "Экспорт DWG/DXF для AutoCAD", off: true },
      { text: "Приоритет очереди AI", off: true },
      { text: "Командная работа", off: true },
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
    cta: "Перейти на PRO",
    features: [
      { text: "До 50 проектов одновременно", highlight: true },
      { text: "50 сканирований / месяц", highlight: true },
      { text: "Все возможности Free", highlight: false },
      { text: "Все AI-стили + кастомные палитры" },
      { text: "50 AI-анализов фото / месяц" },
      { text: "Экспорт OBJ / GLB / USDZ (3D)", highlight: true },
      { text: "Экспорт DWG / DXF (AutoCAD)", highlight: true },
      { text: "Брендированный шеринг проектов" },
      { text: "Приоритет в очереди AI" },
      { text: "Email-поддержка за 24 часа" },
      { text: "Брендирование PDF (логотип)", off: true },
      { text: "Команда до 10 пользователей", off: true },
      { text: "API-доступ", off: true },
    ],
  },
  {
    id: "business",
    name: "BUSINESS",
    audience: "Для студий, агентств, подрядных бригад",
    priceMonthly: 4990,
    priceYearly: 3990,
    tagline: "Команда, API, ваш брендинг — для агентств и студий.",
    accent: "premium",
    cta: "Запросить BUSINESS",
    features: [
      { text: "Безлимит проектов и сканов", highlight: true },
      { text: "Все возможности PRO" },
      { text: "500 AI-анализов фото / месяц" },
      { text: "До 10 пользователей в команде", highlight: true },
      { text: "Брендирование PDF: логотип, реквизиты", highlight: true },
      { text: "Удаление водяных знаков" },
      { text: "API-доступ к данным проектов", highlight: true },
      { text: "Webhook на изменения" },
      { text: "Telegram-чат с менеджером" },
      { text: "Персональный аккаунт-менеджер" },
      { text: "Личный SLA 99.9% и расширенный лог" },
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
  business: string | boolean;
}

export const COMPARISON_TABLE: ComparisonRow[] = [
  { label: "Цена за месяц",                       free: "0 ₽",       pro: "990 ₽",     business: "4 990 ₽" },
  { label: "Проектов одновременно",               free: "3",         pro: "50",        business: "Безлимит" },
  { label: "3D-сканирований / месяц",             free: "5",         pro: "50",        business: "Безлимит" },
  { label: "Планировщик 2D/3D",                   free: true,        pro: true,        business: true },
  { label: "AR-примерка мебели",                  free: true,        pro: true,        business: true },
  { label: "Смета по 20 регионам РФ",             free: true,        pro: true,        business: true },
  { label: "AI-стили интерьера",                  free: "3 базовых", pro: "Все + кастомные", business: "Все + кастомные" },
  { label: "AI-анализ фото / месяц",              free: "3",         pro: "50",        business: "500" },
  { label: "Экспорт PDF / PNG / CSV",             free: true,        pro: true,        business: true },
  { label: "Экспорт OBJ / GLB / USDZ",            free: false,       pro: true,        business: true },
  { label: "Экспорт DWG / DXF (AutoCAD)",         free: false,       pro: true,        business: true },
  { label: "Шеринг проектов",                     free: true,        pro: "Брендирован.", business: "Брендирован." },
  { label: "Брендирование PDF (ваш логотип)",     free: false,       pro: false,       business: true },
  { label: "Команда (доп. пользователи)",         free: false,       pro: false,       business: "до 10" },
  { label: "API-доступ + Webhook",                free: false,       pro: false,       business: true },
  { label: "Приоритет очереди AI",                free: false,       pro: true,        business: true },
  { label: "Поддержка",                           free: "Чат-бот",   pro: "Email 24ч", business: "TG + менеджер" },
];
