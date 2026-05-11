/**
 * Учебный модуль RoomScan AI Academy.
 * 5 курсов × N уроков. Каждый урок — 3-6 шагов с подсказками и quiz.
 *
 * Категории шагов:
 * - intro: вводный экран
 * - feature: рассказ о функции (с CTA «Открыть раздел»)
 * - tip: совет / лайфхак
 * - quiz: вопрос с вариантами (нужен правильный ответ для прохождения)
 * - cta: финал урока — призыв сделать действие
 */

export type StepType = "intro" | "feature" | "tip" | "quiz" | "cta";

export interface QuizOption {
  label: string;
  correct?: boolean;
}

export interface LessonStep {
  type: StepType;
  icon: string;
  title: string;
  body: string;
  /** Буллеты для feature/tip шагов */
  bullets?: string[];
  /** Куда вести при нажатии CTA */
  navigateTo?: string;
  ctaLabel?: string;
  /** Для quiz */
  question?: string;
  options?: QuizOption[];
  /** Объяснение после ответа */
  explain?: string;
}

export interface Lesson {
  id: string;
  title: string;
  /** Короткий подзаголовок */
  subtitle: string;
  /** Иконка lucide */
  icon: string;
  /** Время в минутах */
  duration: number;
  steps: LessonStep[];
}

export type Difficulty = "Базовый" | "Средний" | "Продвинутый";

export interface Course {
  id: string;
  title: string;
  /** Кому курс */
  audience: string;
  /** Описание для карточки */
  desc: string;
  /** Иконка lucide */
  icon: string;
  /** Цвет акцента (tailwind класс) */
  accent: string;
  /** Уровень сложности */
  difficulty: Difficulty;
  /** Какой бейдж выдаётся после прохождения */
  badge: {
    name: string;
    icon: string;
  };
  lessons: Lesson[];
}

/* -------- Курсы -------- */

export const COURSES: Course[] = [
  {
    id: "beginner",
    title: "Старт: первое знакомство",
    audience: "Новичкам",
    desc: "За 10 минут пройдёте весь маршрут: сканирование → план → смета → экспорт. Поймёте, что умеет RoomScan AI.",
    icon: "Sparkles",
    accent: "from-emerald-500/15 to-emerald-500/0 border-emerald-500/30",
    difficulty: "Базовый",
    badge: { name: "Космонавт-новичок", icon: "Rocket" },
    lessons: [
      {
        id: "welcome",
        title: "Что такое RoomScan AI",
        subtitle: "Обзор возможностей",
        icon: "Compass",
        duration: 2,
        steps: [
          {
            type: "intro",
            icon: "Compass",
            title: "Привет! Это RoomScan AI",
            body: "Сервис превращает камеру смартфона в 3D-сканер комнаты. Вы получаете точный план, смету ремонта, AI-стили и AR-примерку мебели — всё в одном окне.",
            bullets: [
              "Сканирование за 30 секунд камерой телефона",
              "Планировщик 2D и 3D без установки программ",
              "Смета по 8 категориям работ — три тарифа",
              "Экспорт в PDF, GLB, USDZ, FBX, OBJ",
            ],
          },
          {
            type: "feature",
            icon: "Home",
            title: "Главная страница",
            body: "Все инструменты собраны на главной. Левое меню — список разделов. В правом верхнем углу — крошки и переключатель режимов.",
            navigateTo: "home",
            ctaLabel: "Открыть главную",
          },
          {
            type: "quiz",
            icon: "Brain",
            title: "Проверка внимания",
            body: "",
            question: "Что НЕ умеет RoomScan AI?",
            options: [
              { label: "Сканировать комнату телефоном" },
              { label: "Печатать дом на 3D-принтере", correct: true },
              { label: "Считать смету ремонта" },
              { label: "Подбирать стиль интерьера" },
            ],
            explain: "RoomScan AI работает в цифровом пространстве: сканирует, планирует, считает, рендерит. Физического 3D-принтера у нас нет — пока.",
          },
        ],
      },
      {
        id: "scan-flow",
        title: "Первое сканирование",
        subtitle: "Сделайте 3D-слепок комнаты",
        icon: "ScanLine",
        duration: 3,
        steps: [
          {
            type: "feature",
            icon: "ScanLine",
            title: "Раздел «Сканирование»",
            body: "Откройте сайт на смартфоне. Разрешите доступ к камере. Медленно поворачивайтесь на 360° — приложение покажет покрытие комнаты.",
            bullets: [
              "WebXR (Chrome Android) — самый точный режим",
              "Фотограмметрия по QR — для iPhone и старых Android",
              "На ПК — кнопка «Отправить ссылку себе на телефон»",
            ],
            navigateTo: "scan",
            ctaLabel: "Открыть сканирование",
          },
          {
            type: "tip",
            icon: "Lightbulb",
            title: "Совет космонавта",
            body: "Хорошее освещение и матовые поверхности дают точность до ±2 см. Зеркала, стекло и блестящие предметы лучше прикрыть тканью перед сканированием.",
          },
          {
            type: "quiz",
            icon: "Brain",
            title: "Контрольный вопрос",
            body: "",
            question: "Какое условие даёт максимальную точность сканирования?",
            options: [
              { label: "Темнота и приглушённый свет" },
              { label: "Яркое равномерное освещение", correct: true },
              { label: "Только дневной свет из одного окна" },
              { label: "Не имеет значения" },
            ],
            explain: "Алгоритму нужен контраст и видимая текстура поверхностей — это даёт равномерный яркий свет. Тёмные углы и блики создают «дыры» в скане.",
          },
        ],
      },
      {
        id: "planner-first",
        title: "Расставьте мебель",
        subtitle: "Планировщик 2D/3D",
        icon: "LayoutGrid",
        duration: 3,
        steps: [
          {
            type: "feature",
            icon: "LayoutGrid",
            title: "Планировщик",
            body: "После сканирования откройте «Планировщик» — там уже будет ваш план. Перетаскивайте мебель из каталога, меняйте размеры стен, добавляйте перегородки.",
            navigateTo: "planner",
            ctaLabel: "Открыть планировщик",
          },
          {
            type: "tip",
            icon: "MousePointer2",
            title: "Управление",
            body: "ЛКМ — выделить и тащить. ПКМ — повернуть на 90°. Колесо мыши — масштаб. Двойной клик по стене — изменить длину вручную.",
          },
          {
            type: "feature",
            icon: "Sofa",
            title: "Каталог мебели",
            body: "Откройте «Каталог мебели». Найдёте 80+ моделей от партнёров. Фильтры: бренд, стиль, цена, цвет.",
            navigateTo: "catalog",
            ctaLabel: "Открыть каталог",
          },
          {
            type: "cta",
            icon: "Trophy",
            title: "Старт пройден!",
            body: "Вы освоили базовый маршрут. Дальше — специализированные курсы под задачу: продать квартиру, сделать дизайн-проект, рассчитать смету.",
          },
        ],
      },
    ],
  },
  {
    id: "realtor",
    title: "Риелтор: продать квартиру дороже",
    audience: "Риелторам и собственникам",
    desc: "Хоумстейджинг, чек-лист подготовки, AI-стили для объявлений. Цель — поднять цену продажи на 5–15%.",
    icon: "TrendingUp",
    accent: "from-blue-500/15 to-blue-500/0 border-blue-500/30",
    difficulty: "Средний",
    badge: { name: "Мастер продаж", icon: "TrendingUp" },
    lessons: [
      {
        id: "staging-basics",
        title: "Что такое хоумстейджинг",
        subtitle: "Подготовка квартиры к продаже",
        icon: "Home",
        duration: 3,
        steps: [
          {
            type: "intro",
            icon: "TrendingUp",
            title: "Хоумстейджинг = +5–15% к цене",
            body: "По статистике, профессионально подготовленная квартира продаётся быстрее и дороже. RoomScan AI помогает рассчитать бюджет подготовки и спрогнозировать рост цены.",
            bullets: [
              "AI-анализ фото комнаты с GPT-4 Vision",
              "Чек-лист задач: уборка, ремонт, декор, фото",
              "Прогноз ROI: сколько вложить и сколько вернётся",
            ],
          },
          {
            type: "feature",
            icon: "TrendingUp",
            title: "Раздел «Хоумстейджинг»",
            body: "Загрузите фото комнаты, укажите текущую цену объявления. Через 30 секунд получите чек-лист, бюджет и прогноз новой цены.",
            navigateTo: "staging",
            ctaLabel: "Открыть хоумстейджинг",
          },
          {
            type: "quiz",
            icon: "Brain",
            title: "Проверка",
            body: "",
            question: "Что обычно даёт самый высокий ROI при подготовке к продаже?",
            options: [
              { label: "Замена окон" },
              { label: "Глубокая уборка и расхламление", correct: true },
              { label: "Капитальный ремонт" },
              { label: "Покупка новой мебели" },
            ],
            explain: "Уборка и расхламление — бесплатно или дёшево, но визуально увеличивают квартиру и убирают «личность» прошлых хозяев. Это позволяет покупателю представить себя в этой квартире.",
          },
        ],
      },
      {
        id: "ai-photos",
        title: "AI-стили для объявления",
        subtitle: "Фото пустой квартиры → 3 варианта интерьера",
        icon: "Wand2",
        duration: 3,
        steps: [
          {
            type: "feature",
            icon: "Wand2",
            title: "Раздел «AI-стили»",
            body: "Загрузите фото пустой или захламлённой комнаты. ИИ сгенерирует 3 варианта: скандинавский, лофт, минимализм. Используйте в объявлении на Авито/Циан для большего отклика.",
            navigateTo: "styles",
            ctaLabel: "Попробовать AI-стили",
          },
          {
            type: "tip",
            icon: "AlertTriangle",
            title: "Важно",
            body: "Указывайте в объявлении, что фото — «визуализация после стейджинга». Это законно и привлекает внимание, но покупателей нельзя вводить в заблуждение о текущем состоянии.",
          },
          {
            type: "cta",
            icon: "Trophy",
            title: "Готово!",
            body: "Теперь у вас есть инструменты: чек-лист подготовки, прогноз цены и красивые фото для объявления. Время продавать!",
          },
        ],
      },
    ],
  },
  {
    id: "designer",
    title: "Дизайнер: проект под ключ",
    audience: "Дизайнерам интерьера",
    desc: "От замера до экспорта PDF и спецификации для закупки. Конвертация моделей с 3ddd.ru, AR-примерка для клиента.",
    icon: "Palette",
    accent: "from-purple-500/15 to-purple-500/0 border-purple-500/30",
    difficulty: "Продвинутый",
    badge: { name: "Дизайнер-навигатор", icon: "Palette" },
    lessons: [
      {
        id: "measure",
        title: "Точный замер за 5 минут",
        subtitle: "Без рулетки и лазерного дальномера",
        icon: "Ruler",
        duration: 3,
        steps: [
          {
            type: "feature",
            icon: "ScanLine",
            title: "Замер фотограмметрией",
            body: "Отправьте клиенту QR-код. Он сделает обход на смартфоне за 30 секунд — вы получите точный план с размерами в личном кабинете.",
            navigateTo: "scan",
            ctaLabel: "Открыть сканирование",
          },
          {
            type: "tip",
            icon: "Sparkles",
            title: "Лайфхак",
            body: "Сохраняйте сканы в «Мои проекты» с понятными именами («Иванов — спальня», «Петров — кухня»). Дальше один клик — и план готов для планировщика.",
          },
        ],
      },
      {
        id: "models-from-3ddd",
        title: "Конвертер моделей с 3ddd.ru",
        subtitle: "FBX/OBJ → GLB + USDZ за 10 секунд",
        icon: "FileBox",
        duration: 4,
        steps: [
          {
            type: "feature",
            icon: "FileBox",
            title: "Раздел «Конвертер 3D»",
            body: "Скачайте модель с 3ddd.ru или Sketchfab в формате FBX или OBJ. Перетащите в конвертер — получите GLB (для веба и Android AR) и USDZ (для iPhone AR Quick Look).",
            bullets: [
              "Поддержка: FBX, OBJ, DAE, STL, PLY, 3DS, glTF",
              "Конвертация полностью в браузере, без серверов",
              "Сохраняется в вашу облачную библиотеку",
            ],
            navigateTo: "converter",
            ctaLabel: "Открыть конвертер",
          },
          {
            type: "tip",
            icon: "AlertTriangle",
            title: "Про формат .max",
            body: ".max — закрытый формат 3ds Max от Autodesk, конвертировать его в браузере нельзя. На странице модели в 3ddd.ru обычно есть архив с FBX/OBJ — используйте его.",
          },
          {
            type: "quiz",
            icon: "Brain",
            title: "Проверка",
            body: "",
            question: "Какой формат конвертер выдаёт для AR на iPhone?",
            options: [
              { label: ".glb" },
              { label: ".usdz", correct: true },
              { label: ".fbx" },
              { label: ".obj" },
            ],
            explain: "iPhone использует Apple AR Quick Look — он работает только с форматом USDZ. Наш конвертер автоматически делает обе версии: GLB (Android) и USDZ (iOS) из одного исходника.",
          },
        ],
      },
      {
        id: "deliverables",
        title: "Сдача проекта клиенту",
        subtitle: "PDF, спецификация, AR-ссылка",
        icon: "Share2",
        duration: 3,
        steps: [
          {
            type: "feature",
            icon: "Share2",
            title: "Экспорт в 6 форматах",
            body: "PDF для печати, GLB/USDZ для AR на телефоне клиента, OBJ/FBX для других программ, Excel для закупки материалов.",
            navigateTo: "export",
            ctaLabel: "Открыть экспорт",
          },
          {
            type: "cta",
            icon: "Trophy",
            title: "Готовый воркфлоу",
            body: "Замер → каталог + конвертер моделей → планировщик → AR-просмотр клиенту → PDF и смета. Профит!",
          },
        ],
      },
    ],
  },
  {
    id: "ar-master",
    title: "AR-примерка: мебель в комнате",
    audience: "Всем, у кого есть смартфон",
    desc: "Как примерить любой диван, шкаф или светильник в реальной комнате через камеру телефона. iOS и Android.",
    icon: "Smartphone",
    accent: "from-orange-500/15 to-orange-500/0 border-orange-500/30",
    difficulty: "Базовый",
    badge: { name: "AR-исследователь", icon: "Smartphone" },
    lessons: [
      {
        id: "ar-basics",
        title: "Как работает AR на сайте",
        subtitle: "Без скачивания приложений",
        icon: "Smartphone",
        duration: 3,
        steps: [
          {
            type: "intro",
            icon: "Smartphone",
            title: "AR прямо в браузере",
            body: "На iPhone — Safari запускает Apple AR Quick Look. На Android — Chrome открывает Google Scene Viewer. Никаких App Store, никаких сторонних приложений.",
            bullets: [
              "iOS Safari: формат USDZ через AR Quick Look",
              "Android Chrome: формат GLB через Scene Viewer",
              "Размеры моделей соответствуют реальным сантиметрам",
            ],
          },
          {
            type: "feature",
            icon: "Sofa",
            title: "Каталог мебели",
            body: "Откройте каталог, выберите модель, нажмите кнопку AR в правом верхнем углу 3D-превью. Наведите камеру на пол комнаты — мебель встанет в реальном масштабе.",
            navigateTo: "catalog",
            ctaLabel: "Открыть каталог мебели",
          },
          {
            type: "feature",
            icon: "Store",
            title: "Российские бренды",
            body: "В разделе «Российские бренды» — Like Lodka, Sarosco, Svetholl и другие. Все модели тоже доступны в AR.",
            navigateTo: "brands",
            ctaLabel: "Открыть бренды",
          },
          {
            type: "quiz",
            icon: "Brain",
            title: "Проверка",
            body: "",
            question: "В каком браузере на iPhone работает AR?",
            options: [
              { label: "Chrome" },
              { label: "Safari", correct: true },
              { label: "Firefox" },
              { label: "Yandex" },
            ],
            explain: "Apple AR Quick Look работает только в Safari. Если открыли ссылку в Chrome или Telegram — нажмите «Открыть в Safari».",
          },
        ],
      },
    ],
  },
  {
    id: "renovation",
    title: "Ремонт по смете",
    audience: "Тем, кто делает ремонт",
    desc: "Калькулятор сметы, окна и двери, инженерные узлы. Получите PDF-смету и список материалов для закупки.",
    icon: "Calculator",
    accent: "from-yellow-500/15 to-yellow-500/0 border-yellow-500/30",
    difficulty: "Средний",
    badge: { name: "Прораб-стратег", icon: "HardHat" },
    lessons: [
      {
        id: "estimate",
        title: "Калькулятор сметы",
        subtitle: "8 категорий работ, 3 тарифа",
        icon: "Calculator",
        duration: 4,
        steps: [
          {
            type: "feature",
            icon: "Calculator",
            title: "Раздел «Смета ремонта»",
            body: "Укажите площадь, число комнат, количество окон и дверей. Выберите тариф — Эконом, Стандарт или Премиум. Через 10 секунд получите смету по 8 категориям.",
            bullets: [
              "Демонтаж, черновые, чистовые работы",
              "Сантехника, электрика, потолки",
              "Региональные коэффициенты для разных городов",
            ],
            navigateTo: "calc",
            ctaLabel: "Открыть смету",
          },
          {
            type: "tip",
            icon: "Lightbulb",
            title: "Совет",
            body: "Сделайте 3 расчёта: Эконом, Стандарт, Премиум. Покажите подрядчику — это поможет торговаться и понимать, за что именно вы платите.",
          },
        ],
      },
      {
        id: "openings",
        title: "Окна и двери",
        subtitle: "ПВХ, алюминий, дерево",
        icon: "DoorOpen",
        duration: 3,
        steps: [
          {
            type: "feature",
            icon: "DoorOpen",
            title: "Раздел «Окна и двери»",
            body: "Точный расчёт окон ПВХ/алюминий/дерево и межкомнатных/входных дверей с установкой. Количество подставляется автоматически из вашего скана.",
            navigateTo: "openings",
            ctaLabel: "Открыть калькулятор",
          },
          {
            type: "feature",
            icon: "Settings2",
            title: "Инженерные узлы",
            body: "Электрощит, водомерный узел, коллектор отопления — типовые схемы со спецификацией и сметой. Удобно для технадзора и подрядчика.",
            navigateTo: "engineering",
            ctaLabel: "Открыть инженерку",
          },
          {
            type: "cta",
            icon: "Trophy",
            title: "Готовый комплект",
            body: "Теперь у вас есть полный бюджет ремонта: работы + материалы + окна/двери + инженерка. Можно идти к подрядчикам.",
          },
        ],
      },
    ],
  },
];

export function getCourse(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function getLesson(courseId: string, lessonId: string): Lesson | undefined {
  return getCourse(courseId)?.lessons.find((l) => l.id === lessonId);
}

export const TOTAL_LESSONS = COURSES.reduce((sum, c) => sum + c.lessons.length, 0);
