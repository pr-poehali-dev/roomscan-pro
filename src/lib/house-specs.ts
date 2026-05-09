/**
 * Подробные технические характеристики проектов:
 * фундамент, стены, кровля, окна, инженерия, гарантии, комплектация.
 *
 * Базовые спецификации задаются по типу конструкции, отдельные проекты
 * могут переопределять любые поля через HOUSE_SPEC_OVERRIDES.
 */

import { ConstructionType, ModularHouseProject } from "./modular-houses";

export interface FoundationSpec {
  type: string;
  description: string;
}

export interface WallSpec {
  /** Конструкция стены (например: "Каркас 50×150 + ОСП-3") */
  construction: string;
  /** Толщина наружной стены, мм */
  thickness: number;
  /** Утеплитель и его толщина */
  insulation: string;
  /** Наружная отделка */
  exterior: string;
  /** Внутренняя отделка */
  interior: string;
  /** Класс шумоизоляции */
  soundProofing: string;
}

export interface RoofSpec {
  /** Тип кровли (плоская / двускатная / односкатная) */
  type: string;
  /** Материал покрытия */
  material: string;
  /** Угол уклона, ° */
  pitch: number;
  /** Утепление кровли */
  insulation: string;
}

export interface WindowsSpec {
  /** Профиль */
  profile: string;
  /** Стеклопакет */
  glazing: string;
  /** Площадь остекления, м² */
  area: number;
  /** Количество окон в проекте */
  count: number;
}

export interface UtilitiesSpec {
  /** Отопление */
  heating: string;
  /** Электрика */
  electricity: string;
  /** Водоснабжение и канализация */
  plumbing: string;
  /** Вентиляция */
  ventilation: string;
  /** Класс энергоэффективности */
  energyClass: "A++" | "A+" | "A" | "B" | "C";
}

export interface WarrantySpec {
  /** Конструктив, лет */
  structure: number;
  /** Инженерия, лет */
  engineering: number;
  /** Отделка, лет */
  finishing: number;
}

export interface HouseFullSpec {
  foundation: FoundationSpec;
  walls: WallSpec;
  roof: RoofSpec;
  windows: WindowsSpec;
  utilities: UtilitiesSpec;
  warranty: WarrantySpec;
  /** Высота потолков, м */
  ceilingHeight: number;
  /** Количество этажей */
  floors: number;
  /** Количество санузлов */
  bathrooms: number;
  /** Что входит в стоимость */
  included: string[];
  /** Что НЕ входит в стоимость */
  excluded: string[];
}

/* ────────────────── БАЗОВЫЕ СПЕКИ ПО ТИПУ ────────────────── */

const BASE_BY_TYPE: Record<ConstructionType, HouseFullSpec> = {
  modular: {
    foundation: {
      type: "Свайно-винтовой",
      description: "Винтовые сваи Ø108 мм, длина 2.5 м, 6-12 шт. в зависимости от площади. Не требует земляных работ, монтаж за 1 день.",
    },
    walls: {
      construction: "Каркас 50×150 (LVL) + ОСП-3 12 мм + ветрозащита + контробрешётка",
      thickness: 200,
      insulation: "Каменная вата ROCKWOOL Лайт Баттс Скандик 200 мм (λ=0.036)",
      exterior: "Фиброцементный сайдинг или планкен из лиственницы",
      interior: "Гипсокартон 12.5 мм + покраска / обои под покраску",
      soundProofing: "52 дБ (стандарт жилого помещения)",
    },
    roof: {
      type: "Плоская с уклоном 3°",
      material: "Мембрана ПВХ Logicroof V-RP 1.5 мм",
      pitch: 3,
      insulation: "ППС-XPS 200 мм + пароизоляция",
    },
    windows: {
      profile: "REHAU Blitz 60 мм, белый",
      glazing: "Двухкамерный стеклопакет 4-10-4-10-4i (i-стекло)",
      area: 0,
      count: 0,
    },
    utilities: {
      heating: "Электрический конвектор + тёплый пол в санузле (опция: газовый котёл)",
      electricity: "Внутренняя разводка ВВГнг-LS, щит на 12 модулей, УЗО, заземление",
      plumbing: "ПП-трубы PN20 (горячая/холодная), канализация Ø50/110 мм с уклоном",
      ventilation: "Приточно-вытяжная с рекуператором (КПД до 80%)",
      energyClass: "A",
    },
    warranty: {
      structure: 25,
      engineering: 5,
      finishing: 2,
    },
    ceilingHeight: 2.7,
    floors: 1,
    bathrooms: 1,
    included: [
      "Заводская сборка модулей",
      "Доставка на участок до 200 км от МКАД",
      "Монтаж на готовый фундамент",
      "Свайно-винтовой фундамент",
      "Чистовая внутренняя отделка стен и потолка",
      "Окна с откосами и подоконниками",
      "Электрика с автоматами и розетками",
      "Сантехника: душевая кабина, унитаз, раковина, бойлер 50 л",
      "Внутренние двери, входная металлическая дверь",
      "Гарантия 25 лет на конструктив",
    ],
    excluded: [
      "Земельные работы и подготовка участка",
      "Подключение к магистральным сетям (электричество/газ/вода)",
      "Септик или станция биоочистки",
      "Меблировка и бытовая техника",
      "Декоративная отделка (плитка, ламинат сверх базы)",
      "Ландшафт и благоустройство участка",
      "Гараж, навес, забор",
      "Кондиционирование (опция)",
    ],
  },

  futuristic: {
    foundation: {
      type: "Монолитная плита УШП",
      description: "Утеплённая шведская плита 250 мм с интегрированным тёплым полом и инженерными вводами. Идеально для пучинистых грунтов.",
    },
    walls: {
      construction: "Несущий металлокаркас + сэндвич-панель + наружное утепление",
      thickness: 280,
      insulation: "PIR-плиты 200 мм (λ=0.022) + минвата 80 мм",
      exterior: "Архитектурный бетон / композитные панели HPL / черный фальц",
      interior: "Микроцемент или декоративная штукатурка по выбору",
      soundProofing: "58 дБ (улучшенная)",
    },
    roof: {
      type: "Эксплуатируемая плоская",
      material: "Мембрана ПВХ премиум + террасная доска / гравий",
      pitch: 2,
      insulation: "PIR 250 мм + инверсионная схема",
    },
    windows: {
      profile: "Алюминий Schüco AWS 75 SI+ (тёплый профиль)",
      glazing: "Двухкамерный энергосберегающий триплекс 4i-12Ar-4-12Ar-6i",
      area: 0,
      count: 0,
    },
    utilities: {
      heating: "Тепловой насос воздух-вода + водяной тёплый пол по всей площади",
      electricity: "Умный дом KNX, резервное питание, подготовка под СЭС на крыше",
      plumbing: "Фильтрация воды 5 ступеней, рециркуляция ГВС",
      ventilation: "Приточно-вытяжная с рекуператором + увлажнение, КПД 92%",
      energyClass: "A++",
    },
    warranty: {
      structure: 30,
      engineering: 7,
      finishing: 3,
    },
    ceilingHeight: 3.0,
    floors: 1,
    bathrooms: 2,
    included: [
      "Архитектурный проект и дизайн-концепция",
      "Монолитная УШП с тёплым полом",
      "Премиум-материалы фасада (бетон/HPL/фальц)",
      "Панорамное остекление с тёплым алюминием",
      "Интегрированная LED-подсветка фасада",
      "Тепловой насос + водяной тёплый пол",
      "Рекуператор и приточно-вытяжная вентиляция",
      "Базовая система «Умный дом» KNX",
      "Фильтрация воды и рециркуляция ГВС",
      "Гарантия 30 лет на конструктив",
    ],
    excluded: [
      "Земельные работы и геология",
      "Подключение к магистральным сетям",
      "Солнечные панели (готова инфраструктура)",
      "Меблировка и встроенная техника",
      "Бассейн / сауна / СПА-зона",
      "Ландшафтный дизайн",
      "Гараж и навесы",
      "Системы безопасности (опция)",
    ],
  },

  frame: {
    foundation: {
      type: "Свайно-винтовой или ленточный мелкозаглубленный",
      description: "Винтовые сваи Ø108×2500 либо МЗЛ 400×600 мм для участков с устойчивым грунтом. Расчёт по геологии.",
    },
    walls: {
      construction: "Каркас 50×150 + ОСП-3 + ветрозащита Tyvek + контробрешётка",
      thickness: 200,
      insulation: "Каменная вата 200 мм + пароизоляция Изоспан",
      exterior: "Имитация бруса / планкен / горизонтальный сайдинг",
      interior: "Гипсокартон + обои или вагонка",
      soundProofing: "48 дБ",
    },
    roof: {
      type: "Двускатная, уклон 30°",
      material: "Металлочерепица Grand Line 0.5 мм или мягкая черепица",
      pitch: 30,
      insulation: "Каменная вата 200 мм между стропил",
    },
    windows: {
      profile: "REHAU Delight-Design 70 мм, белый",
      glazing: "Двухкамерный стеклопакет 4-10-4-10-4i",
      area: 0,
      count: 0,
    },
    utilities: {
      heating: "Электрокотёл 6-9 кВт + радиаторы (опция: газовый/твердотопливный)",
      electricity: "Щит на 16 модулей, УЗО, заземление, ВВГнг-LS",
      plumbing: "ПП-трубы, канализация Ø50/110 мм, бойлер 80-100 л",
      ventilation: "Естественная + принудительная вытяжка из санузла и кухни",
      energyClass: "B",
    },
    warranty: {
      structure: 20,
      engineering: 5,
      finishing: 2,
    },
    ceilingHeight: 2.7,
    floors: 1,
    bathrooms: 1,
    included: [
      "Каркас по проекту с учётом снеговой нагрузки",
      "Свайно-винтовой фундамент (до 12 свай)",
      "Утепление стен, пола и кровли 200 мм",
      "Кровля из металлочерепицы",
      "Окна с откосами и подоконниками",
      "Чистовая внутренняя отделка",
      "Электрика и сантехника по проекту",
      "Входная металлическая дверь",
      "Внутренние двери",
      "Гарантия 20 лет на конструктив",
    ],
    excluded: [
      "Геология и подготовка участка",
      "Подключение к сетям",
      "Септик / скважина",
      "Печь / камин (опция)",
      "Мебель и бытовая техника",
      "Финишная декоративная отделка сверх базы",
      "Ландшафт и благоустройство",
      "Гараж и хозблок",
    ],
  },
};

/* ────────────────── ИНДИВИДУАЛЬНЫЕ ПЕРЕОПРЕДЕЛЕНИЯ ────────────────── */

const HOUSE_SPEC_OVERRIDES: Record<string, Partial<HouseFullSpec>> = {
  "house-premium": {
    bathrooms: 2,
    floors: 1,
    ceilingHeight: 2.85,
    walls: {
      ...BASE_BY_TYPE.modular.walls,
      thickness: 240,
      insulation: "Каменная вата 240 мм (λ=0.036) + наружное утепление 50 мм",
      exterior: "Премиум-планкен из лиственницы + чёрный фальц",
      soundProofing: "55 дБ",
    },
    utilities: {
      ...BASE_BY_TYPE.modular.utilities,
      heating: "Газовый котёл + радиаторы + тёплый пол в санузлах",
      energyClass: "A+",
    },
    warranty: { structure: 30, engineering: 7, finishing: 3 },
  },

  "house-loft": {
    bathrooms: 1,
    floors: 1,
    ceilingHeight: 2.85,
  },

  "house-futuro-villa": {
    bathrooms: 2,
    floors: 1,
    ceilingHeight: 3.2,
    walls: {
      ...BASE_BY_TYPE.futuristic.walls,
      thickness: 320,
      exterior: "Архитектурный бетон + тиковый софит",
    },
  },

  "house-futuro-stack": {
    floors: 2,
    bathrooms: 2,
  },

  "frame-family-110": {
    floors: 2,
    bathrooms: 2,
  },

  "frame-cottage-75": {
    floors: 2,
    bathrooms: 1,
    roof: {
      ...BASE_BY_TYPE.frame.roof,
      type: "Двускатная с мансардой, уклон 35°",
      pitch: 35,
    },
  },

  "frame-barn-130": {
    floors: 2,
    bathrooms: 2,
    roof: {
      ...BASE_BY_TYPE.frame.roof,
      type: "Асимметричная двускатная (барн-стиль), уклон 35°/15°",
      material: "Чёрный фальц 0.5 мм",
      pitch: 35,
    },
    walls: {
      ...BASE_BY_TYPE.frame.walls,
      exterior: "Чёрная вертикальная имитация бруса с термообработкой",
    },
  },

  "frame-starter-45": {
    bathrooms: 1,
    walls: {
      ...BASE_BY_TYPE.frame.walls,
      thickness: 150,
      insulation: "Каменная вата 150 мм",
      soundProofing: "44 дБ",
    },
    warranty: { structure: 15, engineering: 3, finishing: 1 },
  },
};

/* ────────────────── HELPER ────────────────── */

/** Считает количество и площадь окон по составу модулей проекта */
function calcWindows(project: ModularHouseProject): { count: number; area: number } {
  // Грубо: каждый жилой/кухонный модуль имеет 2 окна, технический/санузел — 1
  let count = 0;
  for (const placement of project.layout) {
    const id = placement.moduleId;
    if (id.startsWith("mod-living") || id.startsWith("mod-kitchen")) count += 2;
    else if (id.startsWith("mod-bath") || id.startsWith("mod-tech") || id.startsWith("mod-corridor")) count += 1;
  }
  // Средняя площадь окна: модульные/каркасные ~2 м², футуристичные ~4.5 м²
  const avgArea = project.construction === "futuristic" ? 4.5 : 2;
  return { count, area: Math.round(count * avgArea * 10) / 10 };
}

/** Возвращает полную спецификацию проекта (база по типу + переопределения) */
export function getHouseFullSpec(project: ModularHouseProject): HouseFullSpec {
  const base = BASE_BY_TYPE[project.construction];
  const override = HOUSE_SPEC_OVERRIDES[project.id] ?? {};
  const win = calcWindows(project);

  return {
    ...base,
    ...override,
    foundation: override.foundation ?? base.foundation,
    walls: override.walls ?? base.walls,
    roof: override.roof ?? base.roof,
    utilities: override.utilities ?? base.utilities,
    warranty: override.warranty ?? base.warranty,
    windows: {
      ...base.windows,
      ...override.windows,
      count: win.count,
      area: win.area,
    },
    included: override.included ?? base.included,
    excluded: override.excluded ?? base.excluded,
  };
}
