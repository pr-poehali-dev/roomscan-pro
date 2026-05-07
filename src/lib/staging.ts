/**
 * Библиотека хоумстейджинга — предпродажной подготовки квартиры.
 * Считает бюджет работ и прогноз увеличения стоимости продажи.
 *
 * Идея: разные сценарии (Сдать в аренду / Продать быстро / Продать дорого)
 * с разной глубиной подготовки и разным ROI.
 */

export type StagingGoal = "rent" | "fast_sale" | "max_price";

export interface StagingTask {
  id: string;
  title: string;
  desc: string;
  cost: number;       // ₽
  impact: number;     // % к цене продажи
  priority: "must" | "should" | "nice";
  category: "clean" | "repair" | "decor" | "photo";
  icon: string;
}

export interface StagingScenario {
  goal: StagingGoal;
  label: string;
  desc: string;
  budget: { min: number; max: number };
  expectedUplift: number; // % к стоимости
  daysApprox: number;
  tasks: StagingTask[];
}

interface StagingInput {
  area: number;          // м²
  marketPrice?: number;  // ₽ — текущая оценка квартиры (для прогноза)
  age?: "new" | "soviet" | "old"; // возраст дома (опционально)
}

/**
 * Базовый чек-лист задач хоумстейджинга, цены масштабируются от площади.
 */
function buildTasks(area: number): StagingTask[] {
  const k = area / 35; // нормировка к 1-комнатной 35 м²
  return [
    // CLEAN — must
    { id: "deep_clean",  title: "Генеральная уборка",       desc: "Мойка окон, чистка швов, вытяжки, плиты, пол", cost: Math.round(3500 * k),  impact: 1.5, priority: "must",   category: "clean", icon: "Sparkles" },
    { id: "declutter",   title: "Расхламление",             desc: "Убрать всё лишнее: одежду, книги, посуду, хобби", cost: Math.round(2000 * k), impact: 2.0, priority: "must",   category: "clean", icon: "Trash2" },
    { id: "depersonal",  title: "Обезличивание",            desc: "Снять личные фото, магнитики, сувениры", cost: 0,                     impact: 1.2, priority: "must",   category: "clean", icon: "User" },
    { id: "smell",       title: "Устранение запахов",       desc: "Озонирование, новые ароматы — кофе/выпечка", cost: Math.round(2500 * k),  impact: 0.8, priority: "must",   category: "clean", icon: "Wind" },

    // REPAIR — should
    { id: "paint_walls", title: "Покраска стен в светлый",  desc: "Белый/бежевый — расширяет пространство", cost: Math.round(18000 * k), impact: 4.5, priority: "should", category: "repair", icon: "Paintbrush" },
    { id: "fix_grout",   title: "Обновление швов плитки",   desc: "Замена затирки, силикона в санузле", cost: Math.round(4500 * k),  impact: 1.5, priority: "should", category: "repair", icon: "Wrench" },
    { id: "fix_doors",   title: "Регулировка дверей/окон",  desc: "Чтобы ничего не скрипело и не клинило", cost: Math.round(3000 * k),  impact: 0.8, priority: "should", category: "repair", icon: "DoorOpen" },
    { id: "lighting",    title: "Замена лампочек на тёплый белый", desc: "Однотонный свет 3000K по всей квартире", cost: Math.round(2800 * k),  impact: 1.2, priority: "should", category: "repair", icon: "Lightbulb" },

    // DECOR — nice
    { id: "textile",     title: "Текстиль: пледы, подушки, шторы", desc: "Светлая нейтральная гамма", cost: Math.round(8000 * k),  impact: 2.5, priority: "nice", category: "decor", icon: "Sofa" },
    { id: "plants",      title: "Живые растения / зелень",  desc: "2–3 крупных растения добавляют жизни", cost: Math.round(3500 * k),  impact: 1.0, priority: "nice", category: "decor", icon: "Leaf" },
    { id: "art",         title: "Постеры / картины",        desc: "Нейтральные принты в рамках", cost: Math.round(4500 * k),  impact: 1.2, priority: "nice", category: "decor", icon: "Image" },
    { id: "kitchen",     title: "Сервировка кухни/столовой", desc: "Свежие фрукты, посуда, скатерть", cost: Math.round(2500 * k),  impact: 0.8, priority: "nice", category: "decor", icon: "Utensils" },

    // PHOTO — must для продажи
    { id: "pro_photo",   title: "Профессиональная фотосъёмка", desc: "20+ фото с широкоугольным объективом", cost: 8000,                  impact: 5.5, priority: "must",   category: "photo", icon: "Camera" },
    { id: "video_tour",  title: "Видео-тур по квартире",     desc: "1-2 минуты, с пешим обходом", cost: 6000,                  impact: 2.5, priority: "should", category: "photo", icon: "Video" },
    { id: "floor_plan",  title: "Планировка с размерами",    desc: "Цветной 2D план для объявления", cost: 1500,                  impact: 1.5, priority: "should", category: "photo", icon: "LayoutGrid" },
  ];
}

/**
 * Рассчитывает 3 сценария хоумстейджинга для данных параметров.
 */
export function calcStagingScenarios(input: StagingInput): StagingScenario[] {
  const tasks = buildTasks(input.area);

  const filterByPriority = (priorities: StagingTask["priority"][]) =>
    tasks.filter((t) => priorities.includes(t.priority));

  const sumCost = (list: StagingTask[]) => list.reduce((s, t) => s + t.cost, 0);
  const sumImpact = (list: StagingTask[]) => list.reduce((s, t) => s + t.impact, 0);

  const rent = filterByPriority(["must"]);
  const fast = filterByPriority(["must", "should"]);
  const max  = filterByPriority(["must", "should", "nice"]);

  return [
    {
      goal: "rent",
      label: "Сдать в аренду",
      desc: "Минимальная подготовка — чистота и базовый порядок",
      budget: { min: Math.round(sumCost(rent) * 0.9), max: Math.round(sumCost(rent) * 1.1) },
      expectedUplift: Math.round(sumImpact(rent) * 10) / 10,
      daysApprox: 3,
      tasks: rent,
    },
    {
      goal: "fast_sale",
      label: "Продать быстро",
      desc: "Оптимум: квартира готова к показам и фото за 1 неделю",
      budget: { min: Math.round(sumCost(fast) * 0.9), max: Math.round(sumCost(fast) * 1.1) },
      expectedUplift: Math.round(sumImpact(fast) * 10) / 10,
      daysApprox: 7,
      tasks: fast,
    },
    {
      goal: "max_price",
      label: "Продать дорого",
      desc: "Полный стейджинг — прогноз +8…15% к цене (зависит от региона)",
      budget: { min: Math.round(sumCost(max) * 0.95), max: Math.round(sumCost(max) * 1.15) },
      expectedUplift: Math.round(sumImpact(max) * 10) / 10,
      daysApprox: 14,
      tasks: max,
    },
  ];
}

export function formatRubShort(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + " млн ₽";
  if (n >= 1_000) return Math.round(n / 1000) + " тыс ₽";
  return n + " ₽";
}