/**
 * Каталог модульных домов и блок-модулей.
 * 8 готовых проектов + конструктор из универсальных модулей.
 *
 * Цены ориентировочные, базовая комплектация (без отделки), 2025-2026.
 */

export type ModuleType =
  | "living"     // жилая комната / спальня
  | "kitchen"    // кухня
  | "bath"       // санузел
  | "tech"       // техническое (котельная / щитовая)
  | "terrace"    // терраса / веранда
  | "corridor";  // коридор / прихожая

export interface BlockModule {
  id: string;
  type: ModuleType;
  name: string;
  /** Габариты модуля: ширина × высота × глубина (м) */
  size: [number, number, number];
  /** Площадь, м² */
  area: number;
  /** Цена базовой комплектации, ₽ */
  price: number;
  /** Описание для модалки */
  description: string;
  /** Цвет на 3D-схеме */
  color: string;
  /** Иконка lucide */
  icon: string;
}

export const BLOCK_MODULES: BlockModule[] = [
  {
    id: "mod-living-18",
    type: "living",
    name: "Жилой блок 3×6 м",
    size: [3, 2.7, 6],
    area: 18,
    price: 590000,
    description:
      "Каркасно-щитовой жилой модуль. Утепление 200 мм каменной ватой, окно 1.5×1.4, входная дверь, чистовая отделка стен и потолка.",
    color: "#d3b58a",
    icon: "BedDouble",
  },
  {
    id: "mod-living-27",
    type: "living",
    name: "Жилой блок 3×9 м",
    size: [3, 2.7, 9],
    area: 27,
    price: 820000,
    description: "Удлинённая версия жилого модуля. Подходит для гостиной-кухни-студии или большой спальни с гардеробной.",
    color: "#d3b58a",
    icon: "BedDouble",
  },
  {
    id: "mod-kitchen",
    type: "kitchen",
    name: "Кухня-столовая 3×6 м",
    size: [3, 2.7, 6],
    area: 18,
    price: 720000,
    description:
      "Готовый модуль с подключёнными коммуникациями: вода, канализация, вытяжка. Кухонный гарнитур 3 м, мойка, варочная поверхность.",
    color: "#c89b6b",
    icon: "ChefHat",
  },
  {
    id: "mod-bath-9",
    type: "bath",
    name: "Санузел 3×3 м",
    size: [3, 2.7, 3],
    area: 9,
    price: 480000,
    description:
      "Полностью оборудованный санузел: душевая, унитаз, раковина, полотенцесушитель. Гидроизоляция, плитка, разводка под бойлер.",
    color: "#a8c5d6",
    icon: "Bath",
  },
  {
    id: "mod-tech-6",
    type: "tech",
    name: "Технический блок 2×3 м",
    size: [2, 2.7, 3],
    area: 6,
    price: 280000,
    description:
      "Помещение под котельную / щитовую. Несгораемая отделка, вентиляция, ввод кабеля, точка подключения газа. Без оборудования.",
    color: "#9aa5b1",
    icon: "Wrench",
  },
  {
    id: "mod-corridor",
    type: "corridor",
    name: "Прихожая 2×3 м",
    size: [2, 2.7, 3],
    area: 6,
    price: 220000,
    description: "Прихожая с входной группой. Тамбур, гардеробная зона, утеплённый пол.",
    color: "#b8a89a",
    icon: "DoorOpen",
  },
  {
    id: "mod-terrace",
    type: "terrace",
    name: "Открытая терраса 3×4 м",
    size: [3, 2.7, 4],
    area: 12,
    price: 180000,
    description: "Открытая терраса на свайном фундаменте. Декинг из лиственницы, балясины, кровля по желанию.",
    color: "#a89678",
    icon: "Trees",
  },
];

/* ────────────────── ГОТОВЫЕ ПРОЕКТЫ ДОМОВ ────────────────── */

export interface ModularHouseProject {
  id: string;
  name: string;
  /** Краткий слоган */
  tagline: string;
  /** Полное описание */
  description: string;
  /** Тёплая площадь, м² */
  area: number;
  /** Кол-во спален */
  bedrooms: number;
  /** Сколько нужно человеко-дней на сборку */
  daysToBuild: number;
  /** Состав модулей с координатами размещения [x, z] (метры) */
  layout: HousePlacement[];
  /** Иконка для карточки */
  icon: string;
  /** Целевая аудитория */
  forWhom: string;
  /** Базовая цена «под ключ» */
  basePrice: number;
}

export interface HousePlacement {
  moduleId: string;
  /** Положение модуля по [X, Z] в метрах от угла участка */
  position: [number, number];
  /** Поворот по Y, радианы (0 / π/2) */
  rotationY?: number;
}

export const HOUSE_PROJECTS: ModularHouseProject[] = [
  {
    id: "house-studio",
    name: "Студия «Минима»",
    tagline: "Самый компактный модульный дом — 24 м²",
    description:
      "Идеальный гостевой дом или дача выходного дня. Спальная зона, кухня-гостиная и санузел в одном жилом блоке.",
    area: 24,
    bedrooms: 1,
    daysToBuild: 7,
    icon: "Home",
    forWhom: "Дача, гостевой дом, офис в саду",
    basePrice: 1290000,
    layout: [
      { moduleId: "mod-living-18", position: [0, 0] },
      { moduleId: "mod-bath-9", position: [3, 0] },
    ],
  },
  {
    id: "house-family-50",
    name: "Семейный «Базис 50»",
    tagline: "Компактный дом для пары — 51 м²",
    description:
      "Спальня, отдельная кухня-гостиная, полноценный санузел и техническое помещение для котла. Подходит для постоянного проживания.",
    area: 51,
    bedrooms: 1,
    daysToBuild: 14,
    icon: "Heart",
    forWhom: "Пара, маленькая семья",
    basePrice: 2280000,
    layout: [
      { moduleId: "mod-kitchen", position: [0, 0] },
      { moduleId: "mod-living-18", position: [0, 6] },
      { moduleId: "mod-bath-9", position: [3, 6] },
      { moduleId: "mod-tech-6", position: [3, 9] },
    ],
  },
  {
    id: "house-family-80",
    name: "Семейный «Простор 80»",
    tagline: "Полноценный дом 81 м² — 2 спальни",
    description:
      "Просторный модульный дом для семьи с детьми. Две спальни, гостиная-кухня, санузел, прихожая. Соответствует требованиям ИЖС.",
    area: 81,
    bedrooms: 2,
    daysToBuild: 21,
    icon: "Users",
    forWhom: "Семья с 1-2 детьми",
    basePrice: 3590000,
    layout: [
      { moduleId: "mod-corridor", position: [0, 0] },
      { moduleId: "mod-kitchen", position: [2, 0] },
      { moduleId: "mod-living-18", position: [0, 6] },
      { moduleId: "mod-living-18", position: [3, 6] },
      { moduleId: "mod-bath-9", position: [0, 3] },
      { moduleId: "mod-tech-6", position: [6, 0] },
    ],
  },
  {
    id: "house-l-shape",
    name: "L-образный «Угловой 65»",
    tagline: "Современная Г-планировка с террасой",
    description:
      "Г-образное расположение модулей образует приватный внутренний двор с террасой. Отличный обзор, светлые комнаты с двух сторон.",
    area: 66,
    bedrooms: 2,
    daysToBuild: 18,
    icon: "Square",
    forWhom: "Любители открытых пространств",
    basePrice: 3120000,
    layout: [
      { moduleId: "mod-living-18", position: [0, 0] },
      { moduleId: "mod-living-18", position: [3, 0] },
      { moduleId: "mod-kitchen", position: [6, 0] },
      { moduleId: "mod-bath-9", position: [9, 0] },
      { moduleId: "mod-tech-6", position: [9, 3] },
      { moduleId: "mod-terrace", position: [6, 6] },
    ],
  },
  {
    id: "house-loft",
    name: "Лофт «Линия 100»",
    tagline: "Линейный одноэтажный дом 102 м²",
    description:
      "Элегантный вытянутый дом в стиле Scandi-Loft. 3 жилых блока, кухня-гостиная-столовая, мастер-санузел и техпомещение.",
    area: 102,
    bedrooms: 3,
    daysToBuild: 28,
    icon: "AlignHorizontalSpaceAround",
    forWhom: "Семья с детьми, ценители современного дизайна",
    basePrice: 4480000,
    layout: [
      { moduleId: "mod-corridor", position: [0, 0] },
      { moduleId: "mod-living-18", position: [2, 0] },
      { moduleId: "mod-living-18", position: [5, 0] },
      { moduleId: "mod-living-27", position: [8, 0] },
      { moduleId: "mod-kitchen", position: [11, 0] },
      { moduleId: "mod-bath-9", position: [2, 3] },
      { moduleId: "mod-tech-6", position: [11, 3] },
      { moduleId: "mod-terrace", position: [5, 3] },
    ],
  },
  {
    id: "house-premium",
    name: "Премиум «Резиденция 140»",
    tagline: "Большой семейный дом 141 м²",
    description:
      "Просторный дом для большой семьи. 3 спальни, мастер-санузел и второй гостевой санузел, большая кухня-столовая, гостиная и просторная терраса.",
    area: 141,
    bedrooms: 3,
    daysToBuild: 35,
    icon: "Crown",
    forWhom: "Семьи, ИЖС-проект, ВНЖ",
    basePrice: 6180000,
    layout: [
      { moduleId: "mod-corridor", position: [0, 0] },
      { moduleId: "mod-kitchen", position: [2, 0] },
      { moduleId: "mod-living-27", position: [5, 0] },
      { moduleId: "mod-living-18", position: [0, 3] },
      { moduleId: "mod-living-18", position: [3, 3] },
      { moduleId: "mod-living-18", position: [6, 3] },
      { moduleId: "mod-bath-9", position: [9, 3] },
      { moduleId: "mod-bath-9", position: [9, 0] },
      { moduleId: "mod-tech-6", position: [12, 0] },
      { moduleId: "mod-terrace", position: [12, 3] },
    ],
  },
  {
    id: "house-office",
    name: "Офис-куб «Studio 18»",
    tagline: "Один модуль — 18 м² офиса в саду",
    description:
      "Минимальный модульный объект. Подойдёт под удалённый кабинет, мастерскую, гостевой домик или баню. Сборка 3 дня.",
    area: 18,
    bedrooms: 0,
    daysToBuild: 3,
    icon: "Briefcase",
    forWhom: "Удалённая работа, мастерская, баня",
    basePrice: 690000,
    layout: [{ moduleId: "mod-living-18", position: [0, 0] }],
  },
];

/* ────────────────── HELPERS ────────────────── */

export function getModule(id: string): BlockModule | undefined {
  return BLOCK_MODULES.find((m) => m.id === id);
}

export interface HouseSpec {
  modules: { module: BlockModule; quantity: number; total: number }[];
  totalArea: number;
  modulesPrice: number;
  /** Доставка и установка (~25% от стоимости модулей) */
  delivery: number;
  /** Фундамент (свайно-винтовой ~ 4500 ₽/м²) */
  foundation: number;
  /** Подключение коммуникаций */
  utilities: number;
  /** ИТОГО под ключ */
  grandTotal: number;
}

export function calcHouseSpec(project: ModularHouseProject, regionK = 1): HouseSpec {
  const map = new Map<string, { module: BlockModule; quantity: number; total: number }>();
  let totalArea = 0;

  for (const placement of project.layout) {
    const mod = getModule(placement.moduleId);
    if (!mod) continue;
    totalArea += mod.area;
    if (map.has(mod.id)) {
      const row = map.get(mod.id)!;
      row.quantity += 1;
      row.total = Math.round(mod.price * row.quantity * regionK);
    } else {
      map.set(mod.id, {
        module: mod,
        quantity: 1,
        total: Math.round(mod.price * regionK),
      });
    }
  }

  const modulesPrice = Array.from(map.values()).reduce((s, r) => s + r.total, 0);
  const delivery = Math.round(modulesPrice * 0.18);
  const foundation = Math.round(totalArea * 4500 * regionK);
  const utilities = Math.round(180000 * regionK);
  const grandTotal = modulesPrice + delivery + foundation + utilities;

  return {
    modules: Array.from(map.values()),
    totalArea,
    modulesPrice,
    delivery,
    foundation,
    utilities,
    grandTotal,
  };
}

/** Расчёт спецификации для произвольной сборки модулей (конструктор) */
export function calcCustomSpec(placements: HousePlacement[], regionK = 1): HouseSpec {
  return calcHouseSpec(
    {
      id: "custom",
      name: "Свой проект",
      tagline: "",
      description: "",
      area: 0,
      bedrooms: 0,
      daysToBuild: 0,
      icon: "Sparkles",
      forWhom: "",
      basePrice: 0,
      layout: placements,
    },
    regionK,
  );
}

export const MODULE_TYPE_LABELS: Record<ModuleType, string> = {
  living: "Жилой блок",
  kitchen: "Кухня",
  bath: "Санузел",
  tech: "Техпомещение",
  terrace: "Терраса",
  corridor: "Прихожая",
};
