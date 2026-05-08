/**
 * Каталог оборудования и шаблонов для инженерных узлов.
 * Котельные, тепловые пункты, насосные станции.
 *
 * Данные ориентировочные, цены — рынок РФ 2025-2026.
 * В проде заменить на запрос к таблице engineering_equipment в PostgreSQL.
 */

export type EquipmentCategory =
  | "boiler"           // котёл
  | "pump"             // насос
  | "expansion_tank"   // расширительный бак
  | "boiler_tank"      // бойлер косвенного нагрева
  | "manifold"         // коллектор / гребёнка
  | "valve"            // запорная арматура
  | "filter"           // фильтр-грязевик
  | "safety_group"     // группа безопасности
  | "controller"       // автоматика
  | "chimney"          // дымоход
  | "pipe"             // трубы / монтаж
  | "gas_tank"         // газгольдер (СУГ, подземный/наземный)
  | "gas_cylinder"     // баллон газовый
  | "gas_regulator"    // редуктор / РДНК
  | "gas_meter"        // счётчик газа
  | "gas_detector"     // сигнализатор / газоанализатор
  | "evaporator"       // испаритель СУГ
  | "service";         // работы

export interface EquipmentItem {
  id: string;
  category: EquipmentCategory;
  name: string;
  brand?: string;
  /** Технические характеристики кратко (для подписи на 3D) */
  specs: string;
  /** Полное описание (для модалки) */
  description: string;
  /** Габариты в метрах [ширина, высота, глубина] для 3D */
  size: [number, number, number];
  /** Базовая цена в рублях за единицу (Москва) */
  price: number;
  /** Единица измерения для номенклатуры */
  unit: "шт" | "компл" | "м" | "м2" | "услуга";
  /** Цвет на 3D-схеме (HEX) */
  color: string;
  /** Артикул / код производителя */
  sku?: string;
}

/* ────────────────── ОБОРУДОВАНИЕ ────────────────── */

export const EQUIPMENT: EquipmentItem[] = [
  // КОТЛЫ ГАЗОВЫЕ
  {
    id: "boiler-baxi-24",
    category: "boiler",
    name: "Газовый котёл BAXI Eco Four 24F",
    brand: "BAXI",
    specs: "24 кВт · двухконтурный · турбо",
    description:
      "Настенный двухконтурный газовый котёл. Закрытая камера сгорания, ЖК-дисплей, защита от замерзания, перегрева и блокировки насоса.",
    size: [0.4, 0.73, 0.3],
    price: 78000,
    unit: "шт",
    color: "#e8e8ea",
    sku: "7659670",
  },
  {
    id: "boiler-protherm-50",
    category: "boiler",
    name: "Газовый котёл Protherm Гепард 50 KTV",
    brand: "Protherm",
    specs: "50 кВт · напольный · конденсационный",
    description:
      "Напольный конденсационный котёл с КПД до 109% по низшей теплоте сгорания. Подходит для домов до 500 м².",
    size: [0.6, 1.4, 0.65],
    price: 245000,
    unit: "шт",
  color: "#cfd5dc",
  },
  {
    id: "boiler-vitodens-100",
    category: "boiler",
    name: "Viessmann Vitodens 100-W 35",
    brand: "Viessmann",
    specs: "35 кВт · конденсационный · Wi-Fi",
    description:
      "Премиальный настенный конденсационный котёл. Модуляция 1:6, встроенный модуль Vitoconnect для удалённого управления.",
    size: [0.45, 0.85, 0.36],
    price: 215000,
    unit: "шт",
    color: "#f5f5f7",
    sku: "B1HE068",
  },

  // НАСОСЫ
  {
    id: "pump-grundfos-25-40",
    category: "pump",
    name: "Циркуляционный насос Grundfos UPS 25-40",
    brand: "Grundfos",
    specs: "Hmax 4 м · 3 скорости · 180 мм",
    description:
      "Надёжный циркуляционный насос для систем отопления частного дома до 200 м². Чугунный корпус, мокрый ротор.",
    size: [0.18, 0.13, 0.13],
    price: 14500,
    unit: "шт",
    color: "#ff6f3c",
  },
  {
    id: "pump-wilo-yonos",
    category: "pump",
    name: "Энергоэффективный насос Wilo Yonos PICO 25/1-6",
    brand: "Wilo",
    specs: "Hmax 6 м · ЕЕI ≤ 0.20 · авторегулировка",
    description:
      "Электронно-управляемый насос класса А. Автоматически подстраивается под нагрузку, экономит до 80% электроэнергии.",
    size: [0.18, 0.16, 0.13],
    price: 26500,
    unit: "шт",
    color: "#1ea54a",
  },

  // БОЙЛЕРЫ
  {
    id: "tank-drazice-100",
    category: "boiler_tank",
    name: "Бойлер косвенного нагрева Drazice OKC 100 NTR",
    brand: "Drazice",
    specs: "100 л · одинарный теплообменник · эмаль",
    description:
      "Эмалированный бак с магниевым анодом. Подключение к одноконтурному котлу для приготовления ГВС.",
    size: [0.52, 0.95, 0.52],
    price: 42000,
    unit: "шт",
    color: "#5a8db8",
  },
  {
    id: "tank-drazice-200",
    category: "boiler_tank",
    name: "Бойлер Drazice OKC 200 NTR",
    brand: "Drazice",
    specs: "200 л · теплообменник 1.0 м² · эмаль",
    description: "Бойлер на семью 4-5 человек. Теплоизоляция 50 мм пенополиуретан. Гарантия на бак 5 лет.",
    size: [0.58, 1.25, 0.58],
    price: 68000,
    unit: "шт",
    color: "#5a8db8",
  },

  // РАСШИРИТЕЛЬНЫЕ БАКИ
  {
    id: "expansion-reflex-12",
    category: "expansion_tank",
    name: "Расширительный бак Reflex NG 12",
    brand: "Reflex",
    specs: "12 л · 6 бар · красный",
    description: "Мембранный бак для систем отопления. Сменная мембрана EPDM, рабочая температура до 120 °C.",
    size: [0.28, 0.28, 0.28],
    price: 4800,
    unit: "шт",
    color: "#c0392b",
  },
  {
    id: "expansion-reflex-25",
    category: "expansion_tank",
    name: "Расширительный бак Reflex NG 25",
    brand: "Reflex",
    specs: "25 л · 6 бар",
    description: "Бак для котельных средней мощности 30-60 кВт.",
    size: [0.32, 0.42, 0.32],
    price: 7200,
    unit: "шт",
    color: "#c0392b",
  },

  // КОЛЛЕКТОРЫ
  {
    id: "manifold-3",
    category: "manifold",
    name: "Коллектор стальной 3 контура",
    specs: "DN50 · 3 выхода · 1″",
    description: "Распределительный коллектор для подключения 3 контуров отопления (радиаторы / тёплый пол / ГВС).",
    size: [0.7, 0.18, 0.12],
    price: 18500,
    unit: "шт",
    color: "#7d8a99",
  },
  {
    id: "manifold-5",
    category: "manifold",
    name: "Гидрострелка + коллектор 5 контуров",
    specs: "DN65 · 5 выходов · с термометрами",
    description:
      "Гидравлический разделитель совмещённый с коллектором. Балансирует системы с разной гидравликой (радиаторы + тёплый пол + бассейн).",
    size: [0.95, 0.22, 0.14],
    price: 36800,
    unit: "шт",
    color: "#7d8a99",
  },

  // ГРУППА БЕЗОПАСНОСТИ
  {
    id: "safety-watts",
    category: "safety_group",
    name: "Группа безопасности котла Watts KSG",
    brand: "Watts",
    specs: "Манометр + воздухоотводчик + клапан 3 бар",
    description: "Обязательный элемент любой котельной. Защищает от превышения давления и завоздушивания.",
    size: [0.18, 0.22, 0.1],
    price: 3900,
    unit: "компл",
    color: "#d4a017",
  },

  // ФИЛЬТРЫ
  {
    id: "filter-magnetic",
    category: "filter",
    name: "Фильтр магнитный Honeywell FK06-1\"",
    brand: "Honeywell",
    specs: "100 мкм · обратная промывка · 1″",
    description: "Защита котла и насосов от шлама и металлических частиц. Самопромывной.",
    size: [0.15, 0.2, 0.1],
    price: 8200,
    unit: "шт",
    color: "#34495e",
  },

  // АВТОМАТИКА
  {
    id: "controller-zont",
    category: "controller",
    name: "GSM/Wi-Fi термостат ZONT H-1V",
    brand: "ZONT",
    specs: "Управление по 1 контуру · GSM + Wi-Fi · -55…+125 °C",
    description:
      "Удалённое управление котельной со смартфона. Отслеживает температуру, давление, статус котла. SMS-оповещения при авариях.",
    size: [0.16, 0.1, 0.04],
    price: 12500,
    unit: "шт",
    color: "#16a085",
  },

  // ДЫМОХОДЫ
  {
    id: "chimney-coax",
    category: "chimney",
    name: "Коаксиальный дымоход 60/100 мм, 1 м",
    specs: "Нерж. + оцинковка · L=1000 мм",
    description: "Комплект коаксиального дымоудаления для турбированного котла.",
    size: [0.1, 1.0, 0.1],
    price: 4200,
    unit: "м",
    color: "#95a5a6",
  },

  // ГАЗГОЛЬДЕРЫ (СУГ — пропан-бутан, автономная газификация)
  {
    id: "gas-tank-2700",
    category: "gas_tank",
    name: "Газгольдер Real-Invest 2700 л",
    brand: "Реал-Инвест",
    specs: "2700 л · подземный · ВДГО",
    description:
      "Стандартный объём для дома до 200 м². Подземное размещение, заправка раз в 6-8 месяцев. Высокие горловины для удобного обслуживания.",
    size: [1.25, 1.25, 4.6],
    price: 165000,
    unit: "шт",
    color: "#d97706",
    sku: "RI-2700-G",
  },
  {
    id: "gas-tank-4850",
    category: "gas_tank",
    name: "Газгольдер Chemet 4850 л",
    brand: "Chemet",
    specs: "4850 л · подземный · с мультиклапаном",
    description:
      "Польский газгольдер премиум-класса для домов 250-500 м². Срок службы 30 лет. Мультиклапан Rego, высокая горловина.",
    size: [1.4, 1.4, 5.7],
    price: 295000,
    unit: "шт",
    color: "#d97706",
    sku: "CH-4850",
  },
  {
    id: "gas-tank-6400",
    category: "gas_tank",
    name: "Газгольдер Antonio Merloni 6400 л",
    brand: "Antonio Merloni",
    specs: "6400 л · подземный · итальянское качество",
    description:
      "Для крупных коттеджей 500-700 м² или мини-производств. Стандарт EN 12542. Антикоррозийное покрытие.",
    size: [1.5, 1.5, 6.4],
    price: 385000,
    unit: "шт",
    color: "#d97706",
  },

  // БАЛЛОНЫ ГАЗОВЫЕ
  {
    id: "gas-cyl-50",
    category: "gas_cylinder",
    name: "Баллон газовый 50 л (стальной)",
    specs: "50 л · 1.6 МПа · ГОСТ 15860",
    description:
      "Стандартный пропан-бутановый баллон. Используется для отопления, ГВС или подключения к плите. Высота 1300 мм.",
    size: [0.3, 1.3, 0.3],
    price: 4200,
    unit: "шт",
    color: "#dc2626",
  },
  {
    id: "gas-cyl-composite",
    category: "gas_cylinder",
    name: "Композитный баллон HEXAGON Ragasco 33 л",
    brand: "Ragasco",
    specs: "33 л · норвежский · взрывобезопасный",
    description:
      "Лёгкий полупрозрачный композитный баллон. Не ржавеет, не взрывается при пожаре, виден остаток газа. Срок службы 20 лет.",
    size: [0.3, 0.6, 0.3],
    price: 9800,
    unit: "шт",
    color: "#fbbf24",
  },
  {
    id: "gas-cyl-rampa-4",
    category: "gas_cylinder",
    name: "Газовая рампа на 4 баллона",
    specs: "Коллектор + клапаны + редуктор · 4 × 50 л",
    description:
      "Готовая баллонная установка для дома до 80 м². Автоматическое переключение между группами баллонов.",
    size: [1.6, 1.4, 0.4],
    price: 38500,
    unit: "компл",
    color: "#dc2626",
  },

  // РЕДУКТОРЫ И РЕГУЛЯТОРЫ
  {
    id: "gas-reg-rdnk",
    category: "gas_regulator",
    name: "Регулятор давления РДНК-50",
    specs: "Q до 50 м³/ч · вход до 1.2 МПа · ГРПШ",
    description:
      "Регулятор низкого давления. Снижает входное давление с магистрали или газгольдера до 3-5 кПа для котла.",
    size: [0.25, 0.32, 0.18],
    price: 18500,
    unit: "шт",
    color: "#475569",
  },
  {
    id: "gas-reg-cavagna",
    category: "gas_regulator",
    name: "Редуктор Cavagna 1.5 кг/ч",
    brand: "Cavagna Group",
    specs: "1.5 кг/ч · 30 мбар · с предохранителем",
    description:
      "Итальянский бытовой редуктор на пропан-бутан. Защита от превышения давления (PRV) и перетока (OPSO).",
    size: [0.12, 0.1, 0.08],
    price: 3400,
    unit: "шт",
    color: "#475569",
  },

  // СЧЁТЧИКИ ГАЗА
  {
    id: "gas-meter-bk-g4",
    category: "gas_meter",
    name: "Счётчик газа BK-G4 ELSTER",
    brand: "Elster",
    specs: "Q 0.04-6 м³/ч · бытовой · с термокомпенсацией",
    description:
      "Мембранный счётчик на дом до 200 м². Класс точности 1.5. Сертификация ОИТ, поверка раз в 12 лет.",
    size: [0.22, 0.22, 0.16],
    price: 6800,
    unit: "шт",
    color: "#0ea5e9",
  },

  // СИГНАЛИЗАТОРЫ ГАЗА
  {
    id: "gas-detector-kenar",
    category: "gas_detector",
    name: "Сигнализатор СИКЗ-И-СО-ПБ Kenar",
    brand: "Кенар",
    specs: "Метан + СО + клапан · 220 В",
    description:
      "Российский сертифицированный сигнализатор. При утечке газа или превышении CO автоматически перекрывает магистраль клапаном.",
    size: [0.13, 0.09, 0.05],
    price: 7500,
    unit: "компл",
    color: "#facc15",
  },
  {
    id: "gas-detector-seitron",
    category: "gas_detector",
    name: "Сигнализатор Seitron RGYMET",
    brand: "Seitron",
    specs: "Метан · итальянский · с реле",
    description:
      "Итальянский настенный газоанализатор для котельной. Звуковой и световой сигнал, выход на электромагнитный клапан.",
    size: [0.12, 0.08, 0.04],
    price: 5200,
    unit: "шт",
    color: "#facc15",
  },

  // ИСПАРИТЕЛИ СУГ
  {
    id: "gas-evap-200",
    category: "evaporator",
    name: "Испаритель СУГ 200 кг/ч",
    specs: "200 кг/ч · электрический · 24 кВт",
    description:
      "Принудительный испаритель для зимней эксплуатации газгольдера. Решает проблему «газ не идёт в мороз» при больших расходах.",
    size: [0.55, 1.1, 0.45],
    price: 285000,
    unit: "шт",
    color: "#fb7185",
  },

  // РАБОТЫ
  {
    id: "service-install",
    category: "service",
    name: "Монтаж и пусконаладка котельной",
    specs: "Под ключ · с гарантией 2 года",
    description:
      "Полный комплекс работ: разводка трубопроводов, установка и подключение оборудования, опрессовка, настройка автоматики, ввод в эксплуатацию.",
    size: [0, 0, 0],
    price: 95000,
    unit: "услуга",
    color: "#000",
  },
  {
    id: "service-gas-project",
    category: "service",
    name: "Проект газоснабжения дома",
    specs: "Согласование с газовой службой · от 14 дней",
    description:
      "Разработка и согласование проектной документации в Газпром Газораспределение. Включает технические условия, рабочий проект, экспертизу.",
    size: [0, 0, 0],
    price: 45000,
    unit: "услуга",
    color: "#000",
  },
  {
    id: "service-gas-install",
    category: "service",
    name: "Монтаж газгольдера + обвязка",
    specs: "Котлован · обвязка · испытания · акт",
    description:
      "Земляные работы, установка газгольдера, монтаж газопровода низкого давления до котла, опрессовка, ввод в эксплуатацию.",
    size: [0, 0, 0],
    price: 145000,
    unit: "услуга",
    color: "#000",
  },
  {
    id: "service-pipes",
    category: "pipe",
    name: "Трубопроводы и фитинги",
    specs: "Сталь / медь / PPR · в зависимости от проекта",
    description: "Стоимость материалов трубопроводов, фитингов, кронштейнов, изоляции.",
    size: [0, 0, 0],
    price: 38000,
    unit: "компл",
    color: "#000",
  },
];

/* ────────────────── ШАБЛОНЫ КОТЕЛЬНЫХ ────────────────── */

export interface NodeTemplate {
  id: string;
  name: string;
  /** Назначение и характеристика */
  purpose: string;
  /** Площадь обслуживаемого здания, м² */
  forArea: string;
  /** Мощность котла */
  power: string;
  /** Габариты помещения котельной [Д, В, Г], м */
  roomSize: [number, number, number];
  /** Размещённое оборудование */
  layout: NodePlacement[];
  /** Иконка lucide для карточки */
  icon: string;
}

export interface NodePlacement {
  equipmentId: string;
  /** Позиция в комнате [x, y, z] метров от левого нижнего угла */
  position: [number, number, number];
  /** Поворот по Y, радианы */
  rotationY?: number;
  /** Количество (для повторяющихся) */
  count?: number;
}

export const NODE_TEMPLATES: NodeTemplate[] = [
  {
    id: "tpl-house-100",
    name: "Дом до 150 м²",
    purpose: "Газовая котельная для частного дома",
    forArea: "до 150 м²",
    power: "24 кВт",
    roomSize: [3.0, 2.5, 2.5],
    icon: "Home",
    layout: [
      { equipmentId: "boiler-baxi-24", position: [0.6, 1.0, 0.4] },
      { equipmentId: "tank-drazice-100", position: [1.4, 0.5, 0.4] },
      { equipmentId: "pump-grundfos-25-40", position: [0.4, 0.6, 0.4] },
      { equipmentId: "expansion-reflex-12", position: [2.1, 0.6, 0.4] },
      { equipmentId: "manifold-3", position: [2.0, 1.6, 0.4] },
      { equipmentId: "safety-watts", position: [0.9, 1.5, 0.4] },
      { equipmentId: "filter-magnetic", position: [1.1, 0.6, 0.4] },
      { equipmentId: "controller-zont", position: [2.4, 1.7, 0.3] },
      { equipmentId: "chimney-coax", position: [0.6, 2.0, 0.4] },
    ],
  },
  {
    id: "tpl-house-300",
    name: "Дом 200-350 м²",
    purpose: "Котельная среднего класса с 5 контурами",
    forArea: "200-350 м²",
    power: "50 кВт",
    roomSize: [4.0, 2.7, 3.0],
    icon: "Building",
    layout: [
      { equipmentId: "boiler-protherm-50", position: [0.7, 0.7, 0.5] },
      { equipmentId: "tank-drazice-200", position: [1.8, 0.65, 0.5] },
      { equipmentId: "pump-wilo-yonos", position: [0.5, 0.4, 0.5], count: 2 },
      { equipmentId: "expansion-reflex-25", position: [2.6, 0.7, 0.5] },
      { equipmentId: "manifold-5", position: [2.5, 1.7, 0.5] },
      { equipmentId: "safety-watts", position: [1.0, 1.6, 0.5] },
      { equipmentId: "filter-magnetic", position: [1.2, 0.5, 0.5] },
      { equipmentId: "controller-zont", position: [3.2, 1.8, 0.4] },
      { equipmentId: "chimney-coax", position: [0.7, 2.2, 0.5] },
    ],
  },
  {
    id: "tpl-house-600",
    name: "Дом 500-700 м² · премиум",
    purpose: "Каскадная котельная Viessmann + теплоаккумулятор",
    forArea: "500-700 м²",
    power: "70 кВт (2×35)",
    roomSize: [5.0, 2.9, 3.5],
    icon: "Castle",
    layout: [
      { equipmentId: "boiler-vitodens-100", position: [0.7, 1.0, 0.5], count: 2 },
      { equipmentId: "tank-drazice-200", position: [2.0, 0.7, 0.5] },
      { equipmentId: "pump-wilo-yonos", position: [0.5, 0.5, 0.5], count: 3 },
      { equipmentId: "expansion-reflex-25", position: [3.2, 0.8, 0.5] },
      { equipmentId: "manifold-5", position: [3.0, 1.8, 0.5] },
      { equipmentId: "safety-watts", position: [1.2, 1.7, 0.5], count: 2 },
      { equipmentId: "filter-magnetic", position: [1.4, 0.5, 0.5] },
      { equipmentId: "controller-zont", position: [4.0, 2.0, 0.4] },
      { equipmentId: "chimney-coax", position: [0.7, 2.4, 0.5], count: 2 },
    ],
  },
  {
    id: "tpl-gasholder-2700",
    name: "Автономная газификация · 200 м²",
    purpose: "Газгольдер 2700 л + котёл BAXI · решение «под ключ» SUPER ГАЗ",
    forArea: "до 200 м²",
    power: "24 кВт + 2700 л СУГ",
    roomSize: [6.0, 2.7, 3.0],
    icon: "Fuel",
    layout: [
      { equipmentId: "gas-tank-2700", position: [0.4, 0.7, 0.7] },
      { equipmentId: "gas-reg-rdnk", position: [2.6, 1.4, 0.3] },
      { equipmentId: "gas-meter-bk-g4", position: [3.0, 1.4, 0.3] },
      { equipmentId: "boiler-baxi-24", position: [3.5, 1.0, 0.4] },
      { equipmentId: "tank-drazice-100", position: [4.5, 0.5, 0.4] },
      { equipmentId: "pump-grundfos-25-40", position: [3.3, 0.6, 0.4] },
      { equipmentId: "expansion-reflex-12", position: [5.2, 0.6, 0.4] },
      { equipmentId: "safety-watts", position: [3.6, 1.7, 0.4] },
      { equipmentId: "gas-detector-kenar", position: [4.8, 1.9, 0.4] },
      { equipmentId: "controller-zont", position: [5.4, 1.7, 0.3] },
      { equipmentId: "chimney-coax", position: [3.5, 2.0, 0.4] },
    ],
  },
  {
    id: "tpl-gasholder-4850",
    name: "Газгольдер 4850 л · дом 350 м²",
    purpose: "СУГ Chemet + конденсационный котёл · полная автоматика",
    forArea: "250-400 м²",
    power: "50 кВт + 4850 л СУГ",
    roomSize: [7.0, 2.8, 3.5],
    icon: "Flame",
    layout: [
      { equipmentId: "gas-tank-4850", position: [0.4, 0.7, 0.7] },
      { equipmentId: "gas-reg-rdnk", position: [3.4, 1.5, 0.5] },
      { equipmentId: "gas-meter-bk-g4", position: [3.8, 1.5, 0.5] },
      { equipmentId: "boiler-protherm-50", position: [4.3, 0.7, 0.5] },
      { equipmentId: "tank-drazice-200", position: [5.5, 0.7, 0.5] },
      { equipmentId: "pump-wilo-yonos", position: [4.1, 0.4, 0.5], count: 2 },
      { equipmentId: "expansion-reflex-25", position: [6.2, 0.8, 0.5] },
      { equipmentId: "manifold-5", position: [4.5, 1.8, 0.5] },
      { equipmentId: "safety-watts", position: [4.6, 1.7, 0.5] },
      { equipmentId: "gas-detector-seitron", position: [3.6, 2.1, 0.5] },
      { equipmentId: "controller-zont", position: [6.2, 1.8, 0.4] },
      { equipmentId: "chimney-coax", position: [4.3, 2.2, 0.5] },
    ],
  },
  {
    id: "tpl-cylinder",
    name: "Дача · баллонная установка",
    purpose: "Композитные баллоны + котёл · быстрый старт без газгольдера",
    forArea: "до 100 м²",
    power: "24 кВт · 4 баллона",
    roomSize: [2.6, 2.4, 2.4],
    icon: "Cylinder",
    layout: [
      { equipmentId: "gas-cyl-rampa-4", position: [0.4, 0.7, 0.3] },
      { equipmentId: "gas-reg-cavagna", position: [2.0, 1.3, 0.3] },
      { equipmentId: "gas-meter-bk-g4", position: [1.7, 1.4, 0.3] },
      { equipmentId: "boiler-baxi-24", position: [1.2, 1.0, 0.4] },
      { equipmentId: "pump-grundfos-25-40", position: [1.0, 0.6, 0.4] },
      { equipmentId: "expansion-reflex-12", position: [2.2, 0.6, 0.4] },
      { equipmentId: "safety-watts", position: [1.5, 1.7, 0.4] },
      { equipmentId: "gas-detector-kenar", position: [0.5, 1.9, 0.3] },
      { equipmentId: "chimney-coax", position: [1.2, 2.0, 0.4] },
    ],
  },
];

/* ────────────────── HELPERS ────────────────── */

export function getEquipment(id: string): EquipmentItem | undefined {
  return EQUIPMENT.find((e) => e.id === id);
}

export interface BomRow {
  item: EquipmentItem;
  quantity: number;
  total: number;
}

/**
 * Собирает спецификацию (BOM) из шаблона котельной.
 * Добавляет автоматически работы и трубопроводы.
 */
export function buildBom(template: NodeTemplate, regionK = 1): BomRow[] {
  const map = new Map<string, BomRow>();

  for (const placement of template.layout) {
    const item = getEquipment(placement.equipmentId);
    if (!item) continue;
    const qty = placement.count ?? 1;
    if (map.has(item.id)) {
      const row = map.get(item.id)!;
      row.quantity += qty;
      row.total = Math.round(row.item.price * row.quantity * regionK);
    } else {
      map.set(item.id, {
        item,
        quantity: qty,
        total: Math.round(item.price * qty * regionK),
      });
    }
  }

  // авто-добавляем работы и трубопроводы
  const pipes = getEquipment("service-pipes")!;
  const install = getEquipment("service-install")!;
  map.set(pipes.id, { item: pipes, quantity: 1, total: Math.round(pipes.price * regionK) });
  map.set(install.id, { item: install, quantity: 1, total: Math.round(install.price * regionK) });

  // Если в шаблоне есть газгольдер — авто-добавляем услуги SUPER ГАЗ:
  // проект газоснабжения + монтаж газгольдера с обвязкой
  const hasGasHolder = template.layout.some((p) => {
    const eq = getEquipment(p.equipmentId);
    return eq?.category === "gas_tank";
  });
  if (hasGasHolder) {
    const project = getEquipment("service-gas-project");
    const gasInstall = getEquipment("service-gas-install");
    if (project) map.set(project.id, { item: project, quantity: 1, total: Math.round(project.price * regionK) });
    if (gasInstall) map.set(gasInstall.id, { item: gasInstall, quantity: 1, total: Math.round(gasInstall.price * regionK) });
  }

  return Array.from(map.values());
}

export function bomTotal(rows: BomRow[]): number {
  return rows.reduce((sum, r) => sum + r.total, 0);
}

export function formatRub(n: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(n);
}

export const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  boiler: "Котёл",
  pump: "Насос",
  expansion_tank: "Расширительный бак",
  boiler_tank: "Бойлер ГВС",
  manifold: "Коллектор",
  valve: "Арматура",
  filter: "Фильтр",
  safety_group: "Группа безопасности",
  controller: "Автоматика",
  chimney: "Дымоход",
  pipe: "Трубопроводы",
  gas_tank: "Газгольдер",
  gas_cylinder: "Баллон СУГ",
  gas_regulator: "Редуктор / РДНК",
  gas_meter: "Счётчик газа",
  gas_detector: "Сигнализатор газа",
  evaporator: "Испаритель",
  service: "Работы",
};