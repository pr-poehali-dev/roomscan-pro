import { useState } from "react";
import Icon from "@/components/ui/icon";

interface UseCase {
  id: string;
  title: string;
  icon: string;
  tagline: string;
  bullets: string[];
  audience: string;
  status: "live" | "beta" | "soon";
}

const useCases: UseCase[] = [
  {
    id: "interior",
    title: "Дизайн интерьера и ремонт",
    icon: "Paintbrush",
    tagline: "Визуализация ремонта до первого мазка",
    bullets: [
      "3D-модель комнаты → подбор цветов, пола, света",
      "Виртуальная расстановка мебели из каталога",
      "Технические чертежи с размерами для строителей",
      "ИИ-стили: сканди, лофт, классика",
    ],
    audience: "Дизайнеры, домовладельцы",
    status: "live",
  },
  {
    id: "realestate",
    title: "Недвижимость и архитектура",
    icon: "Building2",
    tagline: "Виртуальные туры и BIM-документация",
    bullets: [
      "3D-модели квартир для онлайн-показов",
      "Оценка перепланировок до ремонта",
      "Экспорт в Revit / ArchiCAD (BIM)",
      "Аудит состояния перед арендой",
    ],
    audience: "Риелторы, архитекторы",
    status: "beta",
  },
  {
    id: "ecom",
    title: "E-commerce: примерка мебели",
    icon: "ShoppingBag",
    tagline: "Размести товар в своём интерьере",
    bullets: [
      "AR-каталоги: 3D-модели в масштабе через камеру",
      "Проверка габаритов до покупки",
      "Персональные рекомендации по стилю",
      "Интеграция с маркетплейсами (Hoff, Avito)",
    ],
    audience: "Ретейл, маркетплейсы",
    status: "beta",
  },
  {
    id: "insurance",
    title: "Страхование и оценка ущерба",
    icon: "ShieldAlert",
    tagline: "Фиксация повреждений за 5 минут",
    bullets: [
      "Сканирование после затопления / пожара",
      "3D-архив имущества для страховых случаев",
      "Автоотчёт с площадью повреждений",
      "Геопривязка и таймстамп",
    ],
    audience: "Страховые агенты, оценщики",
    status: "soon",
  },
  {
    id: "education",
    title: "Образование и тренинги",
    icon: "GraduationCap",
    tagline: "VR-симуляторы для архитектурных вузов",
    bullets: [
      "Учебные проекты по дизайну",
      "VR-тренажёры по ремонту и планировке",
      "Визуализация исторических интерьеров",
      "Интерактивные пособия",
    ],
    audience: "Вузы, курсы",
    status: "soon",
  },
  {
    id: "construction",
    title: "Строительство и ремонт",
    icon: "HardHat",
    tagline: "Замена рулетки на смартфон",
    bullets: [
      "Автозамеры площади, высоты, углов",
      "Сравнение факта с проектной моделью",
      "Планирование коммуникаций (розетки, трубы)",
      "Контроль качества подрядчика",
    ],
    audience: "Прорабы, строители",
    status: "live",
  },
  {
    id: "ar",
    title: "AR-развлечения и геймификация",
    icon: "Gamepad2",
    tagline: "Превратите квартиру в игровую сцену",
    bullets: [
      "AR-квесты с поиском объектов",
      "Тематические фильтры (космос, замок)",
      "Соцсети: маски, привязанные к комнате",
      "AR-демо для брендов",
    ],
    audience: "Геймдев, маркетинг",
    status: "soon",
  },
  {
    id: "social",
    title: "Социальные проекты",
    icon: "Accessibility",
    tagline: "Доступная среда и реставрация",
    bullets: [
      "Проектирование пандусов и поручней",
      "Адаптация квартир под МГН",
      "Цифровые копии исторических интерьеров",
      "Сохранение культурного наследия",
    ],
    audience: "НКО, музеи",
    status: "beta",
  },
  {
    id: "corporate",
    title: "Корпоративные решения",
    icon: "Briefcase",
    tagline: "Управление офисами и активами",
    bullets: [
      "Анализ использования пространства",
      "Виртуальные встречи с клиентами",
      "Учёт мебели и оборудования",
      "API для CRM и ERP",
    ],
    audience: "Дизайн-студии, корпорации",
    status: "beta",
  },
];

interface Scenario {
  id: string;
  persona: string;
  goal: string;
  steps: string[];
  outcome: string;
  icon: string;
}

const scenarios: Scenario[] = [
  {
    id: "sofa",
    persona: "Покупатель дивана",
    goal: "Убедиться, что новый диван впишется в гостиную",
    icon: "Sofa",
    steps: [
      "Сканирует гостиную через приложение",
      "Загружает 3D-модель дивана из каталога магазина",
      "Размещает виртуально, проверяет проходы",
      "Меняет цвет обивки, оценивает с обоями",
      "Оформляет заказ с гарантией габаритов",
    ],
    outcome: "Возврат мебели → 0%. Конверсия в покупку → +28%.",
  },
  {
    id: "designer",
    persona: "Дизайнер ↔ Заказчик",
    goal: "Согласовать проект интерьера удалённо",
    icon: "PencilRuler",
    steps: [
      "Заказчик присылает 3D-скан квартиры",
      "Дизайнер расставляет мебель и отделку в браузере",
      "Отправляет интерактивную ссылку",
      "Клиент «ходит» по проекту в VR",
      "Правки в реальном времени",
    ],
    outcome: "Цикл согласования: с 2 недель до 2 дней.",
  },
  {
    id: "insurance",
    persona: "Страховой агент",
    goal: "Зафиксировать ущерб от затопления",
    icon: "Droplets",
    steps: [
      "Приезжает на объект, сканирует комнату",
      "ИИ выделяет зоны с повреждениями",
      "Авторасчёт площади ущерба",
      "Генерация фотореалистичной модели",
      "Отправка отчёта в офис для компенсации",
    ],
    outcome: "Время на оценку: с 2 часов до 15 минут.",
  },
];

const channels = [
  { icon: "Smartphone", title: "Мобильное приложение", desc: "iOS / Android — основной инструмент сканирования" },
  { icon: "Globe", title: "Веб-платформа", desc: "Редактирование проектов в браузере" },
  { icon: "ShoppingBag", title: "Маркетплейс-интеграция", desc: "Кнопки «Открыть в 3D-планировщике» на товарах" },
  { icon: "Plug", title: "API для партнёров", desc: "Встраивание в CRM застройщиков и риелторов" },
  { icon: "Building", title: "Корпоративные лицензии", desc: "Дизайн-студии, страховые, застройщики" },
];

export default function UseCasesSection() {
  const [filter, setFilter] = useState<"all" | "live" | "beta" | "soon">("all");
  const [openCase, setOpenCase] = useState<string | null>(null);
  const [openScen, setOpenScen] = useState<string>(scenarios[0].id);

  const filtered = filter === "all" ? useCases : useCases.filter((c) => c.status === filter);

  const filterButtons: { id: typeof filter; label: string; count: number }[] = [
    { id: "all",  label: "Все",       count: useCases.length },
    { id: "live", label: "Доступно",  count: useCases.filter((c) => c.status === "live").length },
    { id: "beta", label: "Бета",      count: useCases.filter((c) => c.status === "beta").length },
    { id: "soon", label: "Скоро",     count: useCases.filter((c) => c.status === "soon").length },
  ];

  const statusBadge = (s: UseCase["status"]) => {
    if (s === "live") return { label: "Доступно", cls: "bg-primary/10 text-primary" };
    if (s === "beta") return { label: "Бета",      cls: "bg-yellow-500/10 text-yellow-500" };
    return { label: "Скоро", cls: "bg-border text-muted-foreground" };
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Hero */}
      <div>
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">9 сфер · 3 сценария</p>
        <h2 className="text-3xl font-bold mb-2">Сценарии применения</h2>
        <p className="text-muted-foreground max-w-2xl">
          RoomScan AI — это не просто сканер. Это платформа для дизайна, недвижимости,
          ретейла, страхования и корпоративных решений. Выберите свою задачу.
        </p>
      </div>

      {/* Фильтры по статусу */}
      <div className="flex gap-2 flex-wrap">
        {filterButtons.map((b) => (
          <button
            key={b.id}
            onClick={() => setFilter(b.id)}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-2 ${
              filter === b.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {b.label}
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
              filter === b.id ? "bg-primary/20" : "bg-secondary"
            }`}>
              {b.count}
            </span>
          </button>
        ))}
      </div>

      {/* Сетка сфер применения */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const badge = statusBadge(c.status);
          const isOpen = openCase === c.id;
          return (
            <div
              key={c.id}
              onClick={() => setOpenCase(isOpen ? null : c.id)}
              className={`bg-card border rounded-lg p-5 cursor-pointer transition-all ${
                isOpen ? "border-primary/50 shadow-lg shadow-primary/5" : "border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center transition-colors ${
                  isOpen ? "bg-primary/15" : "bg-secondary"
                }`}>
                  <Icon name={c.icon} size={22} className="text-primary" />
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
              <p className="font-bold text-foreground mb-1">{c.title}</p>
              <p className="text-xs text-muted-foreground mb-3">{c.tagline}</p>

              {isOpen && (
                <div className="space-y-2 mb-3 animate-fade-in">
                  {c.bullets.map((b) => (
                    <div key={b} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                      <Icon name="Check" size={11} className="text-primary mt-0.5 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{c.audience}</span>
                <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={13} className="text-muted-foreground" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Живые сценарии */}
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Как это работает на практике</p>

        <div className="flex gap-2 flex-wrap mb-4">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => setOpenScen(s.id)}
              className={`text-xs px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                openScen === s.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              <Icon name={s.icon} size={13} />
              {s.persona}
            </button>
          ))}
        </div>

        {scenarios.filter((s) => s.id === openScen).map((s) => (
          <div key={s.id} className="bg-card border border-border rounded-lg p-5 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name={s.icon} size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">{s.persona}</p>
                <p className="text-xs text-muted-foreground">{s.goal}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {s.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-center text-primary font-mono text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed pt-0.5">{step}</p>
                </div>
              ))}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-2">
              <Icon name="TrendingUp" size={14} className="text-primary shrink-0" />
              <p className="text-sm text-foreground font-semibold">{s.outcome}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Каналы внедрения */}
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Каналы внедрения</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {channels.map((ch) => (
            <div key={ch.title} className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Icon name={ch.icon} size={16} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm">{ch.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{ch.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Дополнительные возможности */}
      <div className="bg-card border border-border rounded-lg p-5">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Дополнительные возможности</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: "FileBox",  title: ".glb / .obj / .dwg", desc: "AutoCAD, 3ds Max, Blender" },
            { icon: "Users",    title: "Совместная работа",    desc: "Команда в одном проекте" },
            { icon: "History",  title: "История версий",       desc: "Сравнение и откат" },
            { icon: "BarChart3", title: "Аналитика",           desc: "Стили, размеры, тренды" },
          ].map((f) => (
            <div key={f.title} className="space-y-1">
              <div className="flex items-center gap-2">
                <Icon name={f.icon} size={14} className="text-primary" />
                <p className="text-sm font-semibold text-foreground">{f.title}</p>
              </div>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
