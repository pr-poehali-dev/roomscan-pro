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

/** Тип конструкции дома */
export type ConstructionType = "modular" | "frame" | "futuristic";

export interface HousePlacement {
  moduleId: string;
  /** Положение модуля по [X, Z] в метрах от угла участка */
  position: [number, number];
  /** Поворот по Y, радианы (0 / π/2) */
  rotationY?: number;
}

/** Альтернативный вариант планировки одного и того же дома */
export interface LayoutVariant {
  /** Идентификатор внутри проекта: A / B / C */
  id: string;
  /** Короткое имя варианта */
  name: string;
  /** Описание особенностей варианта */
  description: string;
  /** Раскладка модулей */
  layout: HousePlacement[];
}

export interface ModularHouseProject {
  id: string;
  name: string;
  /** Краткий слоган */
  tagline: string;
  /** Полное описание */
  description: string;
  /** Тип конструкции (модульный / каркасный / футуристичный) */
  construction: ConstructionType;
  /** Тёплая площадь, м² */
  area: number;
  /** Кол-во спален */
  bedrooms: number;
  /** Сколько нужно человеко-дней на сборку */
  daysToBuild: number;
  /** Базовый layout (вариант A) — для обратной совместимости */
  layout: HousePlacement[];
  /** Альтернативные планировки (минимум 2-3 варианта на проект) */
  variants?: LayoutVariant[];
  /** Иконка для карточки */
  icon: string;
  /** URL фотореалистичного превью для каталога */
  previewImage?: string;
  /** Целевая аудитория */
  forWhom: string;
  /** Базовая цена «под ключ» */
  basePrice: number;
}

export const HOUSE_PROJECTS: ModularHouseProject[] = [
  {
    id: "house-studio",
    name: "Студия «Минима»",
    tagline: "Самый компактный модульный дом — 24 м²",
    description:
      "Идеальный гостевой дом или дача выходного дня. Спальная зона, кухня-гостиная и санузел в одном жилом блоке.",
    construction: "modular",
    area: 24,
    bedrooms: 1,
    daysToBuild: 7,
    icon: "Home",
    previewImage: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/d091e460-4f0c-4a46-9836-79ca7fbdf4af.jpg",
    forWhom: "Дача, гостевой дом, офис в саду",
    basePrice: 1290000,
    layout: [
      { moduleId: "mod-living-18", position: [0, 0] },
      { moduleId: "mod-bath-9", position: [3, 0] },
    ],
    variants: [
      {
        id: "A",
        name: "Линейная",
        description: "Жилой блок и санузел в одну линию — узкий участок",
        layout: [
          { moduleId: "mod-living-18", position: [0, 0] },
          { moduleId: "mod-bath-9", position: [3, 0] },
        ],
      },
      {
        id: "B",
        name: "С террасой",
        description: "Открытая терраса перед входом — для отдыха",
        layout: [
          { moduleId: "mod-living-18", position: [0, 0] },
          { moduleId: "mod-bath-9", position: [3, 0] },
          { moduleId: "mod-terrace", position: [0, 6] },
        ],
      },
    ],
  },
  {
    id: "house-family-50",
    name: "Семейный «Базис 50»",
    tagline: "Компактный дом для пары — 51 м²",
    description:
      "Спальня, отдельная кухня-гостиная, полноценный санузел и техническое помещение для котла. Подходит для постоянного проживания.",
    construction: "modular",
    area: 51,
    bedrooms: 1,
    daysToBuild: 14,
    icon: "Heart",
    previewImage: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/51a217a5-5c3c-4ab1-a6a8-9a0d911ac2cd.jpg",
    forWhom: "Пара, маленькая семья",
    basePrice: 2280000,
    layout: [
      { moduleId: "mod-kitchen", position: [0, 0] },
      { moduleId: "mod-living-18", position: [0, 6] },
      { moduleId: "mod-bath-9", position: [3, 6] },
      { moduleId: "mod-tech-6", position: [3, 9] },
    ],
    variants: [
      {
        id: "A",
        name: "Базовая",
        description: "Спальня в глубине участка, кухня у входа",
        layout: [
          { moduleId: "mod-kitchen", position: [0, 0] },
          { moduleId: "mod-living-18", position: [0, 6] },
          { moduleId: "mod-bath-9", position: [3, 6] },
          { moduleId: "mod-tech-6", position: [3, 9] },
        ],
      },
      {
        id: "B",
        name: "С прихожей",
        description: "Дополнительный модуль прихожей — больше комфорта",
        layout: [
          { moduleId: "mod-corridor", position: [0, 0] },
          { moduleId: "mod-kitchen", position: [2, 0] },
          { moduleId: "mod-living-18", position: [2, 6] },
          { moduleId: "mod-bath-9", position: [0, 3] },
          { moduleId: "mod-tech-6", position: [5, 6] },
        ],
      },
      {
        id: "C",
        name: "С террасой",
        description: "Терраса на южной стороне для летнего отдыха",
        layout: [
          { moduleId: "mod-kitchen", position: [0, 0] },
          { moduleId: "mod-living-18", position: [0, 6] },
          { moduleId: "mod-bath-9", position: [3, 6] },
          { moduleId: "mod-tech-6", position: [3, 9] },
          { moduleId: "mod-terrace", position: [3, 0] },
        ],
      },
    ],
  },
  {
    id: "house-family-80",
    name: "Семейный «Простор 80»",
    tagline: "Полноценный дом 81 м² — 2 спальни",
    description:
      "Просторный модульный дом для семьи с детьми. Две спальни, гостиная-кухня, санузел, прихожая. Соответствует требованиям ИЖС.",
    construction: "modular",
    area: 81,
    bedrooms: 2,
    daysToBuild: 21,
    icon: "Users",
    previewImage: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/e49d713c-4435-4657-b87a-e0a4dbd3e5ef.jpg",
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
    variants: [
      {
        id: "A",
        name: "Стандарт",
        description: "Две спальни рядом, общий санузел",
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
        id: "B",
        name: "С большой гостиной",
        description: "Удлинённая жилая зона вместо двух спален",
        layout: [
          { moduleId: "mod-corridor", position: [0, 0] },
          { moduleId: "mod-kitchen", position: [2, 0] },
          { moduleId: "mod-living-27", position: [0, 6] },
          { moduleId: "mod-bath-9", position: [3, 3] },
          { moduleId: "mod-tech-6", position: [6, 0] },
        ],
      },
      {
        id: "C",
        name: "С террасой и тех.зоной",
        description: "Большая терраса + увеличенная техническая зона",
        layout: [
          { moduleId: "mod-corridor", position: [0, 0] },
          { moduleId: "mod-kitchen", position: [2, 0] },
          { moduleId: "mod-living-18", position: [0, 6] },
          { moduleId: "mod-living-18", position: [3, 6] },
          { moduleId: "mod-bath-9", position: [0, 3] },
          { moduleId: "mod-tech-6", position: [6, 0] },
          { moduleId: "mod-terrace", position: [6, 6] },
        ],
      },
    ],
  },
  {
    id: "house-l-shape",
    name: "L-образный «Угловой 65»",
    tagline: "Современная Г-планировка с террасой",
    description:
      "Г-образное расположение модулей образует приватный внутренний двор с террасой. Отличный обзор, светлые комнаты с двух сторон.",
    construction: "modular",
    area: 66,
    bedrooms: 2,
    daysToBuild: 18,
    icon: "Square",
    previewImage: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/93ebe235-a14b-4072-9478-78b58022a09e.jpg",
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
    variants: [
      {
        id: "A",
        name: "Г-форма",
        description: "Классическая L-планировка с террасой во дворе",
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
        id: "B",
        name: "Зеркальная",
        description: "Зеркальное отражение — терраса справа",
        layout: [
          { moduleId: "mod-bath-9", position: [0, 0] },
          { moduleId: "mod-kitchen", position: [3, 0] },
          { moduleId: "mod-living-18", position: [6, 0] },
          { moduleId: "mod-living-18", position: [9, 0] },
          { moduleId: "mod-tech-6", position: [0, 3] },
          { moduleId: "mod-terrace", position: [3, 6] },
        ],
      },
    ],
  },
  {
    id: "house-loft",
    name: "Лофт «Линия 100»",
    tagline: "Линейный одноэтажный дом 102 м²",
    description:
      "Элегантный вытянутый дом в стиле Scandi-Loft. 3 жилых блока, кухня-гостиная-столовая, мастер-санузел и техпомещение.",
    construction: "modular",
    area: 102,
    bedrooms: 3,
    daysToBuild: 28,
    icon: "AlignHorizontalSpaceAround",
    previewImage: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/b4e7953e-6c4a-4300-b28f-a7722586875d.jpg",
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
    construction: "modular",
    area: 141,
    bedrooms: 3,
    daysToBuild: 35,
    icon: "Crown",
    previewImage: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/b1d40aaf-d5a2-4a7e-8103-7024b73c1703.jpg",
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
    construction: "modular",
    area: 18,
    bedrooms: 0,
    daysToBuild: 3,
    icon: "Briefcase",
    previewImage: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/193ef950-4371-4002-bf9a-58608b79953c.jpg",
    forWhom: "Удалённая работа, мастерская, баня",
    basePrice: 690000,
    layout: [{ moduleId: "mod-living-18", position: [0, 0] }],
  },

  /* ────────── ФУТУРИСТИЧНЫЕ МОДУЛЬНЫЕ ────────── */

  {
    id: "house-futuro-glass",
    name: "Кантилевер «Glass 60»",
    tagline: "Парящий объём с панорамным остеклением",
    description:
      "Современный модульный дом с консольным выносом над цоколем. Сплошное остекление, чёрные алюминиевые рамы, тёплый ореховый софит. Интегрированная LED-подсветка по периметру кровли.",
    construction: "futuristic",
    area: 60,
    bedrooms: 1,
    daysToBuild: 22,
    icon: "Sparkles",
    previewImage: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/bf1f7f77-69ff-481d-9fd2-527a4d488a83.jpg",
    forWhom: "Дизайнеры, любители современной архитектуры",
    basePrice: 4290000,
    layout: [
      { moduleId: "mod-living-27", position: [0, 0] },
      { moduleId: "mod-kitchen", position: [3, 0] },
      { moduleId: "mod-bath-9", position: [3, 6] },
      { moduleId: "mod-terrace", position: [0, 9] },
    ],
    variants: [
      {
        id: "A",
        name: "Open-Space",
        description: "Открытая планировка кухня-гостиная",
        layout: [
          { moduleId: "mod-living-27", position: [0, 0] },
          { moduleId: "mod-kitchen", position: [3, 0] },
          { moduleId: "mod-bath-9", position: [3, 6] },
          { moduleId: "mod-terrace", position: [0, 9] },
        ],
      },
      {
        id: "B",
        name: "С техзоной",
        description: "Отдельное техническое помещение",
        layout: [
          { moduleId: "mod-living-27", position: [0, 0] },
          { moduleId: "mod-kitchen", position: [3, 0] },
          { moduleId: "mod-bath-9", position: [3, 6] },
          { moduleId: "mod-tech-6", position: [5, 6] },
          { moduleId: "mod-terrace", position: [0, 9] },
        ],
      },
    ],
  },
  {
    id: "house-futuro-stack",
    name: "Стек «Cross 90»",
    tagline: "Перекрёстные объёмы — навес-терраса снизу",
    description:
      "Двухуровневая композиция: верхний модуль развёрнут перпендикулярно нижнему, образуя крытую террасу. Тёмный бетон сверху, панорамное остекление снизу, дубовый потолок. Для участков с панорамными видами.",
    construction: "futuristic",
    area: 90,
    bedrooms: 2,
    daysToBuild: 32,
    icon: "Layers",
    previewImage: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/6b0469f9-5b47-4cd6-b857-3e0c4ec6264d.jpg",
    forWhom: "Видовые участки, склоны, у воды",
    basePrice: 5890000,
    layout: [
      { moduleId: "mod-living-27", position: [0, 0] },
      { moduleId: "mod-living-18", position: [0, 9] },
      { moduleId: "mod-kitchen", position: [3, 0] },
      { moduleId: "mod-bath-9", position: [6, 0] },
      { moduleId: "mod-tech-6", position: [6, 3] },
      { moduleId: "mod-terrace", position: [3, 6] },
    ],
    variants: [
      {
        id: "A",
        name: "Крест",
        description: "Перекрёстная планировка с террасой-навесом",
        layout: [
          { moduleId: "mod-living-27", position: [0, 0] },
          { moduleId: "mod-living-18", position: [0, 9] },
          { moduleId: "mod-kitchen", position: [3, 0] },
          { moduleId: "mod-bath-9", position: [6, 0] },
          { moduleId: "mod-tech-6", position: [6, 3] },
          { moduleId: "mod-terrace", position: [3, 6] },
        ],
      },
      {
        id: "B",
        name: "Линия",
        description: "Линейная компоновка с расширенной террасой",
        layout: [
          { moduleId: "mod-corridor", position: [0, 0] },
          { moduleId: "mod-kitchen", position: [2, 0] },
          { moduleId: "mod-living-27", position: [5, 0] },
          { moduleId: "mod-bath-9", position: [8, 0] },
          { moduleId: "mod-living-18", position: [2, 3] },
          { moduleId: "mod-terrace", position: [5, 3] },
          { moduleId: "mod-tech-6", position: [8, 3] },
        ],
      },
    ],
  },
  {
    id: "house-futuro-villa",
    name: "Вилла «Horizon 120»",
    tagline: "Длинная вилла с инфинити-бассейном",
    description:
      "Горизонтальная вилла с панорамной изогнутой остеклённой стеной. Антрацитовый бетон, тёплый тиковый потолок-консоль, бассейн с эффектом исчезающего края. Премиум-класс для постоянного проживания.",
    construction: "futuristic",
    area: 120,
    bedrooms: 3,
    daysToBuild: 40,
    icon: "Crown",
    previewImage: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/a0334408-79df-43dc-a06b-ffb2d461c036.jpg",
    forWhom: "ИЖС-премиум, ВНЖ, видовые участки",
    basePrice: 8490000,
    layout: [
      { moduleId: "mod-corridor", position: [0, 0] },
      { moduleId: "mod-kitchen", position: [2, 0] },
      { moduleId: "mod-living-27", position: [5, 0] },
      { moduleId: "mod-living-18", position: [8, 0] },
      { moduleId: "mod-living-18", position: [11, 0] },
      { moduleId: "mod-bath-9", position: [14, 0] },
      { moduleId: "mod-bath-9", position: [14, 3] },
      { moduleId: "mod-tech-6", position: [11, 3] },
      { moduleId: "mod-terrace", position: [5, 3] },
    ],
    variants: [
      {
        id: "A",
        name: "Премиум",
        description: "3 спальни, 2 санузла, длинная терраса",
        layout: [
          { moduleId: "mod-corridor", position: [0, 0] },
          { moduleId: "mod-kitchen", position: [2, 0] },
          { moduleId: "mod-living-27", position: [5, 0] },
          { moduleId: "mod-living-18", position: [8, 0] },
          { moduleId: "mod-living-18", position: [11, 0] },
          { moduleId: "mod-bath-9", position: [14, 0] },
          { moduleId: "mod-bath-9", position: [14, 3] },
          { moduleId: "mod-tech-6", position: [11, 3] },
          { moduleId: "mod-terrace", position: [5, 3] },
        ],
      },
      {
        id: "B",
        name: "С двумя террасами",
        description: "Терраса с обеих сторон гостиной",
        layout: [
          { moduleId: "mod-corridor", position: [0, 0] },
          { moduleId: "mod-kitchen", position: [2, 0] },
          { moduleId: "mod-living-27", position: [5, 0] },
          { moduleId: "mod-living-18", position: [8, 0] },
          { moduleId: "mod-living-18", position: [11, 0] },
          { moduleId: "mod-bath-9", position: [14, 0] },
          { moduleId: "mod-tech-6", position: [14, 3] },
          { moduleId: "mod-terrace", position: [5, 3] },
          { moduleId: "mod-terrace", position: [9, 3] },
        ],
      },
    ],
  },
  {
    id: "house-futuro-hex",
    name: "Капсула «Hex 36»",
    tagline: "Гексагональный pod-дом для леса",
    description:
      "Геометрическая капсула с угловыми треугольными стёклами, тёплым кедровым интерьером и LED-подсветкой по рёбрам. Для лесных участков, эко-туризма, гостевых домиков.",
    construction: "futuristic",
    area: 36,
    bedrooms: 1,
    daysToBuild: 12,
    icon: "Hexagon",
    previewImage: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/a7339b65-edbb-48a0-9cdd-0d8c5a614ee0.jpg",
    forWhom: "Эко-туризм, гостевой под, дача в лесу",
    basePrice: 2490000,
    layout: [
      { moduleId: "mod-living-27", position: [0, 0] },
      { moduleId: "mod-bath-9", position: [3, 0] },
    ],
    variants: [
      {
        id: "A",
        name: "Однокомнатный",
        description: "Жилая зона + санузел",
        layout: [
          { moduleId: "mod-living-27", position: [0, 0] },
          { moduleId: "mod-bath-9", position: [3, 0] },
        ],
      },
      {
        id: "B",
        name: "С террасой",
        description: "С видовой террасой над землёй",
        layout: [
          { moduleId: "mod-living-27", position: [0, 0] },
          { moduleId: "mod-bath-9", position: [3, 0] },
          { moduleId: "mod-terrace", position: [0, 9] },
        ],
      },
    ],
  },

  /* ────────── КАРКАСНЫЕ ДОМА ────────── */

  {
    id: "frame-classic-60",
    name: "Каркасный «Скандик 60»",
    tagline: "Классический каркасник 60 м² с верандой",
    description:
      "Традиционный одноэтажный каркасный дом по скандинавской технологии. Стойки 50×150, утеплитель 200 мм, белый горизонтальный сайдинг, серая металлочерепица. Гостиная-кухня, спальня, санузел.",
    construction: "frame",
    area: 60,
    bedrooms: 1,
    daysToBuild: 30,
    icon: "Home",
    previewImage: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/170386fc-2dde-4c79-93ba-5773e468aebf.jpg",
    forWhom: "Постоянное проживание, ИЖС, дача",
    basePrice: 2490000,
    layout: [
      { moduleId: "mod-corridor", position: [0, 0] },
      { moduleId: "mod-living-27", position: [2, 0] },
      { moduleId: "mod-bath-9", position: [5, 0] },
      { moduleId: "mod-living-18", position: [2, 3] },
      { moduleId: "mod-tech-6", position: [5, 3] },
    ],
    variants: [
      {
        id: "A",
        name: "Базовая",
        description: "Стандартная планировка с верандой",
        layout: [
          { moduleId: "mod-corridor", position: [0, 0] },
          { moduleId: "mod-living-27", position: [2, 0] },
          { moduleId: "mod-bath-9", position: [5, 0] },
          { moduleId: "mod-living-18", position: [2, 3] },
          { moduleId: "mod-tech-6", position: [5, 3] },
        ],
      },
      {
        id: "B",
        name: "С большой кухней",
        description: "Отдельная кухня вместо студии",
        layout: [
          { moduleId: "mod-corridor", position: [0, 0] },
          { moduleId: "mod-kitchen", position: [2, 0] },
          { moduleId: "mod-living-18", position: [5, 0] },
          { moduleId: "mod-living-18", position: [2, 3] },
          { moduleId: "mod-bath-9", position: [5, 3] },
          { moduleId: "mod-tech-6", position: [8, 0] },
        ],
      },
    ],
  },
  {
    id: "frame-family-110",
    name: "Каркасный «Семейный 110»",
    tagline: "Двухэтажный каркасник для большой семьи",
    description:
      "Два полноценных этажа, каркас на основе LVL-балок. Вертикальный сайдинг сверху, белый сайдинг снизу, металлочерепица. 3 спальни, 2 санузла, гостиная-столовая, котельная, гараж-навес.",
    construction: "frame",
    area: 110,
    bedrooms: 3,
    daysToBuild: 50,
    icon: "Users",
    previewImage: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/c02ef176-ad0a-4373-8558-a4a039cc9d22.jpg",
    forWhom: "Семья 4-5 человек, постоянное проживание",
    basePrice: 4790000,
    layout: [
      { moduleId: "mod-corridor", position: [0, 0] },
      { moduleId: "mod-kitchen", position: [2, 0] },
      { moduleId: "mod-living-27", position: [5, 0] },
      { moduleId: "mod-bath-9", position: [8, 0] },
      { moduleId: "mod-living-18", position: [0, 3] },
      { moduleId: "mod-living-18", position: [3, 3] },
      { moduleId: "mod-living-18", position: [6, 3] },
      { moduleId: "mod-bath-9", position: [9, 3] },
      { moduleId: "mod-tech-6", position: [11, 0] },
    ],
    variants: [
      {
        id: "A",
        name: "Стандарт",
        description: "3 спальни на 2 этаже, 2 санузла",
        layout: [
          { moduleId: "mod-corridor", position: [0, 0] },
          { moduleId: "mod-kitchen", position: [2, 0] },
          { moduleId: "mod-living-27", position: [5, 0] },
          { moduleId: "mod-bath-9", position: [8, 0] },
          { moduleId: "mod-living-18", position: [0, 3] },
          { moduleId: "mod-living-18", position: [3, 3] },
          { moduleId: "mod-living-18", position: [6, 3] },
          { moduleId: "mod-bath-9", position: [9, 3] },
          { moduleId: "mod-tech-6", position: [11, 0] },
        ],
      },
      {
        id: "B",
        name: "С террасой",
        description: "Большая летняя терраса вместо одной спальни",
        layout: [
          { moduleId: "mod-corridor", position: [0, 0] },
          { moduleId: "mod-kitchen", position: [2, 0] },
          { moduleId: "mod-living-27", position: [5, 0] },
          { moduleId: "mod-bath-9", position: [8, 0] },
          { moduleId: "mod-living-18", position: [0, 3] },
          { moduleId: "mod-living-18", position: [3, 3] },
          { moduleId: "mod-bath-9", position: [9, 3] },
          { moduleId: "mod-tech-6", position: [11, 0] },
          { moduleId: "mod-terrace", position: [6, 3] },
        ],
      },
      {
        id: "C",
        name: "Расширенный",
        description: "Дополнительная гостиная для гостей",
        layout: [
          { moduleId: "mod-corridor", position: [0, 0] },
          { moduleId: "mod-kitchen", position: [2, 0] },
          { moduleId: "mod-living-27", position: [5, 0] },
          { moduleId: "mod-living-18", position: [8, 0] },
          { moduleId: "mod-bath-9", position: [11, 0] },
          { moduleId: "mod-living-18", position: [0, 3] },
          { moduleId: "mod-living-18", position: [3, 3] },
          { moduleId: "mod-living-18", position: [6, 3] },
          { moduleId: "mod-bath-9", position: [9, 3] },
          { moduleId: "mod-tech-6", position: [11, 3] },
        ],
      },
    ],
  },
  {
    id: "frame-cottage-75",
    name: "Каркасный «Дача 75»",
    tagline: "Уютный каркасник с мансардой",
    description:
      "Каркасный дом с эксплуатируемой мансардой. Тёмно-зелёная вертикальная имитация бруса, металлочерепица, большая открытая веранда. Идеально для летнего и круглогодичного отдыха.",
    construction: "frame",
    area: 75,
    bedrooms: 2,
    daysToBuild: 35,
    icon: "TreePine",
    previewImage: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/4d36573f-b6b2-42d1-b548-0e624496d7ef.jpg",
    forWhom: "Дача, СНТ, выходные на природе",
    basePrice: 2890000,
    layout: [
      { moduleId: "mod-corridor", position: [0, 0] },
      { moduleId: "mod-kitchen", position: [2, 0] },
      { moduleId: "mod-living-27", position: [5, 0] },
      { moduleId: "mod-bath-9", position: [8, 0] },
      { moduleId: "mod-living-18", position: [2, 3] },
      { moduleId: "mod-living-18", position: [5, 3] },
      { moduleId: "mod-tech-6", position: [8, 3] },
      { moduleId: "mod-terrace", position: [0, 6] },
    ],
    variants: [
      {
        id: "A",
        name: "С мансардой",
        description: "2 спальни на мансарде, веранда внизу",
        layout: [
          { moduleId: "mod-corridor", position: [0, 0] },
          { moduleId: "mod-kitchen", position: [2, 0] },
          { moduleId: "mod-living-27", position: [5, 0] },
          { moduleId: "mod-bath-9", position: [8, 0] },
          { moduleId: "mod-living-18", position: [2, 3] },
          { moduleId: "mod-living-18", position: [5, 3] },
          { moduleId: "mod-tech-6", position: [8, 3] },
          { moduleId: "mod-terrace", position: [0, 6] },
        ],
      },
      {
        id: "B",
        name: "Одноэтажный",
        description: "Без мансарды, всё на одном уровне",
        layout: [
          { moduleId: "mod-corridor", position: [0, 0] },
          { moduleId: "mod-kitchen", position: [2, 0] },
          { moduleId: "mod-living-27", position: [5, 0] },
          { moduleId: "mod-living-18", position: [8, 0] },
          { moduleId: "mod-living-18", position: [11, 0] },
          { moduleId: "mod-bath-9", position: [11, 3] },
          { moduleId: "mod-tech-6", position: [8, 3] },
          { moduleId: "mod-terrace", position: [2, 3] },
        ],
      },
    ],
  },
  {
    id: "frame-barn-130",
    name: "Каркасный «Барн 130»",
    tagline: "Современный barn-house с асимметричной кровлей",
    description:
      "Модный barn-style каркасный дом. Чёрная вертикальная фасадная доска, асимметричная кровля из чёрного фальца, высокие вертикальные окна. 3 спальни, 2 санузла, кабинет, гостиная-кухня open-space.",
    construction: "frame",
    area: 130,
    bedrooms: 3,
    daysToBuild: 55,
    icon: "Mountain",
    previewImage: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/2bdc1f3f-cd93-4b01-bc84-389025c4dd48.jpg",
    forWhom: "Современная семья, ИЖС, постоянное жильё",
    basePrice: 5690000,
    layout: [
      { moduleId: "mod-corridor", position: [0, 0] },
      { moduleId: "mod-kitchen", position: [2, 0] },
      { moduleId: "mod-living-27", position: [5, 0] },
      { moduleId: "mod-bath-9", position: [8, 0] },
      { moduleId: "mod-living-27", position: [0, 3] },
      { moduleId: "mod-living-18", position: [3, 3] },
      { moduleId: "mod-living-18", position: [6, 3] },
      { moduleId: "mod-bath-9", position: [9, 3] },
      { moduleId: "mod-tech-6", position: [11, 0] },
      { moduleId: "mod-terrace", position: [11, 3] },
    ],
    variants: [
      {
        id: "A",
        name: "Open-Space",
        description: "Одна большая гостиная-кухня без перегородок",
        layout: [
          { moduleId: "mod-corridor", position: [0, 0] },
          { moduleId: "mod-kitchen", position: [2, 0] },
          { moduleId: "mod-living-27", position: [5, 0] },
          { moduleId: "mod-bath-9", position: [8, 0] },
          { moduleId: "mod-living-27", position: [0, 3] },
          { moduleId: "mod-living-18", position: [3, 3] },
          { moduleId: "mod-living-18", position: [6, 3] },
          { moduleId: "mod-bath-9", position: [9, 3] },
          { moduleId: "mod-tech-6", position: [11, 0] },
          { moduleId: "mod-terrace", position: [11, 3] },
        ],
      },
      {
        id: "B",
        name: "С разделёнными зонами",
        description: "Чёткое деление: дневная и ночная зоны",
        layout: [
          { moduleId: "mod-corridor", position: [0, 0] },
          { moduleId: "mod-kitchen", position: [2, 0] },
          { moduleId: "mod-living-27", position: [5, 0] },
          { moduleId: "mod-living-18", position: [8, 0] },
          { moduleId: "mod-bath-9", position: [11, 0] },
          { moduleId: "mod-living-18", position: [0, 3] },
          { moduleId: "mod-living-18", position: [3, 3] },
          { moduleId: "mod-living-18", position: [6, 3] },
          { moduleId: "mod-bath-9", position: [9, 3] },
          { moduleId: "mod-tech-6", position: [11, 3] },
        ],
      },
    ],
  },
  {
    id: "frame-starter-45",
    name: "Каркасный «Старт 45»",
    tagline: "Бюджетный каркасник на старт — 45 м²",
    description:
      "Самый доступный каркасный дом для постоянного проживания. Бежевый сайдинг, металлическая кровля, простая прямоугольная форма. Минимум — но всё необходимое: кухня-гостиная, спальня, санузел, котельная.",
    construction: "frame",
    area: 45,
    bedrooms: 1,
    daysToBuild: 25,
    icon: "Sprout",
    previewImage: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/3bc6d64e-ce28-420b-9a9b-1d2e3f474606.jpg",
    forWhom: "Молодая семья, первый дом, минимальный бюджет",
    basePrice: 1890000,
    layout: [
      { moduleId: "mod-corridor", position: [0, 0] },
      { moduleId: "mod-kitchen", position: [2, 0] },
      { moduleId: "mod-living-18", position: [2, 3] },
      { moduleId: "mod-bath-9", position: [5, 0] },
      { moduleId: "mod-tech-6", position: [5, 3] },
    ],
    variants: [
      {
        id: "A",
        name: "Стандарт",
        description: "Кухня и спальня раздельные",
        layout: [
          { moduleId: "mod-corridor", position: [0, 0] },
          { moduleId: "mod-kitchen", position: [2, 0] },
          { moduleId: "mod-living-18", position: [2, 3] },
          { moduleId: "mod-bath-9", position: [5, 0] },
          { moduleId: "mod-tech-6", position: [5, 3] },
        ],
      },
      {
        id: "B",
        name: "Студия",
        description: "Объединённая кухня-гостиная",
        layout: [
          { moduleId: "mod-corridor", position: [0, 0] },
          { moduleId: "mod-living-27", position: [2, 0] },
          { moduleId: "mod-bath-9", position: [5, 3] },
          { moduleId: "mod-tech-6", position: [2, 3] },
        ],
      },
    ],
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

export const CONSTRUCTION_LABELS: Record<ConstructionType, string> = {
  modular: "Модульные",
  frame: "Каркасные",
  futuristic: "Футуристичные",
};

export const CONSTRUCTION_ICONS: Record<ConstructionType, string> = {
  modular: "Boxes",
  frame: "Hammer",
  futuristic: "Sparkles",
};