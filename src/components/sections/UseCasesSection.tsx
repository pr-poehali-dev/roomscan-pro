import { useState } from "react";
import Icon from "@/components/ui/icon";
import { SCENARIOS, startScenario, useScenario, type ScenarioSection } from "@/lib/scenarios";

interface UseCase {
  id: string;
  title: string;
  icon: string;
  tagline: string;
  bullets: string[];
  audience: string;
  status: "live" | "beta" | "soon";
  scenarioId?: string; // привязка к флоу
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
    scenarioId: "designer-flow",
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
    scenarioId: "buy-sofa",
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
    scenarioId: "insurance",
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
    scenarioId: "renovation",
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

const channels = [
  { icon: "Smartphone", title: "Мобильное приложение", desc: "iOS / Android — основной инструмент сканирования" },
  { icon: "Globe", title: "Веб-платформа", desc: "Редактирование проектов в браузере" },
  { icon: "ShoppingBag", title: "Маркетплейс-интеграция", desc: "Кнопки «Открыть в 3D-планировщике» на товарах" },
  { icon: "Plug", title: "API для партнёров", desc: "Встраивание в CRM застройщиков и риелторов" },
  { icon: "Building", title: "Корпоративные лицензии", desc: "Дизайн-студии, страховые, застройщики" },
];

interface Props {
  onNavigate?: (section: ScenarioSection) => void;
}

export default function UseCasesSection({ onNavigate }: Props) {
  const [filter, setFilter] = useState<"all" | "live" | "beta" | "soon">("all");
  const [openCase, setOpenCase] = useState<string | null>(null);
  const [pickedScenario, setPickedScenario] = useState<string>(SCENARIOS[0].id);
  const { state: activeScenarioState, flow: activeFlow } = useScenario();

  const filtered = filter === "all" ? useCases : useCases.filter((c) => c.status === filter);
  const picked = SCENARIOS.find((s) => s.id === pickedScenario)!;

  const filterButtons: { id: typeof filter; label: string; count: number }[] = [
    { id: "all", label: "Все", count: useCases.length },
    { id: "live", label: "Доступно", count: useCases.filter((c) => c.status === "live").length },
    { id: "beta", label: "Бета", count: useCases.filter((c) => c.status === "beta").length },
    { id: "soon", label: "Скоро", count: useCases.filter((c) => c.status === "soon").length },
  ];

  const statusBadge = (s: UseCase["status"]) => {
    if (s === "live") return { label: "Доступно", cls: "bg-primary/10 text-primary" };
    if (s === "beta") return { label: "Бета", cls: "bg-yellow-500/10 text-yellow-500" };
    return { label: "Скоро", cls: "bg-border text-muted-foreground" };
  };

  const handleStartScenario = (scenarioId: string) => {
    startScenario(scenarioId);
    const flow = SCENARIOS.find((s) => s.id === scenarioId);
    if (flow && onNavigate) onNavigate(flow.steps[0].section);
  };

  return (
    <div className="animate-fade-in space-y-8 pb-24">
      {/* Hero */}
      <div>
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">
          {SCENARIOS.length} живых сценария · {useCases.length} сфер
        </p>
        <h2 className="text-3xl font-bold mb-2">Сценарии применения</h2>
        <p className="text-muted-foreground max-w-2xl">
          Выберите свою задачу — и мы проведём вас по всем нужным инструментам шаг за шагом.
          Сканирование, планировка, AI-стили, расчёты и экспорт — без необходимости разбираться самостоятельно.
        </p>
      </div>

      {/* ── ЖИВОЙ ВЫБОР СЦЕНАРИЯ ──────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Zap" size={16} className="text-primary" />
          <p className="text-xs font-mono uppercase tracking-widest text-primary">
            Выбери режим — пройди по шагам
          </p>
        </div>

        {/* Активный сценарий — большая плашка */}
        {activeScenarioState && activeFlow && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/40 rounded-xl p-4 mb-4 flex items-center gap-3 animate-fade-in">
            <div className="w-11 h-11 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Icon name={activeFlow.icon} size={22} className="text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-wider text-primary mb-0.5">
                Сейчас идёт сценарий
              </p>
              <p className="font-bold text-foreground truncate">{activeFlow.persona}</p>
              <p className="text-xs text-muted-foreground">
                Прогресс: {activeScenarioState.completed.length}/{activeFlow.steps.length} шагов
              </p>
            </div>
            <button
              onClick={() => {
                if (onNavigate) {
                  const next = activeFlow.steps.find((s) => !activeScenarioState.completed.includes(s.id));
                  if (next) onNavigate(next.section);
                }
              }}
              className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm flex items-center gap-1.5 shrink-0"
            >
              <Icon name="ArrowRight" size={13} />
              Продолжить
            </button>
          </div>
        )}

        {/* Табы выбора сценария */}
        <div className="flex gap-2 flex-wrap mb-4">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setPickedScenario(s.id)}
              className={`text-xs px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                pickedScenario === s.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              <Icon name={s.icon} size={13} />
              {s.persona}
            </button>
          ))}
        </div>

        {/* Карточка выбранного сценария */}
        <div className={`relative bg-card border border-border rounded-xl overflow-hidden`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${picked.color} opacity-30 pointer-events-none`} />
          <div className="relative p-5">
            <div className="flex items-start gap-3 mb-4 flex-wrap">
              <div className="w-12 h-12 bg-primary/15 rounded-xl flex items-center justify-center shrink-0">
                <Icon name={picked.icon} size={24} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg text-foreground">{picked.persona}</p>
                <p className="text-sm text-muted-foreground">{picked.goal}</p>
              </div>
              <div className="flex flex-col items-end gap-1 text-right">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary flex items-center gap-1">
                  <Icon name="Clock" size={9} />
                  {picked.estimate}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {picked.steps.length} шагов
                </span>
              </div>
            </div>

            {/* Шаги — карточки */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {picked.steps.map((step, i) => (
                <div
                  key={step.id}
                  className="bg-card/80 backdrop-blur border border-border rounded-lg p-3 flex items-start gap-2"
                >
                  <div className="w-7 h-7 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-center text-primary font-mono text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Icon name={step.icon} size={11} className="text-primary" />
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Итог + кнопка запуска */}
            <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-border">
              <div className="flex items-center gap-2 text-sm">
                <Icon name="TrendingUp" size={14} className="text-primary" />
                <p className="text-foreground font-semibold">{picked.outcome}</p>
              </div>
              <button
                onClick={() => handleStartScenario(picked.id)}
                disabled={!onNavigate}
                className="bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                <Icon name="Play" size={14} />
                Запустить сценарий
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Фильтры сфер по статусу */}
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Сферы применения
        </p>
        <div className="flex gap-2 flex-wrap mb-4">
          {filterButtons.map((b) => (
            <button
              key={b.id}
              onClick={() => setFilter(b.id)}
              className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-2 ${
                filter === b.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {b.label}
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  filter === b.id ? "bg-primary/20" : "bg-secondary"
                }`}
              >
                {b.count}
              </span>
            </button>
          ))}
        </div>

        {/* Сетка сфер */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const badge = statusBadge(c.status);
            const isOpen = openCase === c.id;
            const linkedFlow = c.scenarioId ? SCENARIOS.find((s) => s.id === c.scenarioId) : null;
            return (
              <div
                key={c.id}
                className={`bg-card border rounded-lg p-5 transition-all ${
                  isOpen ? "border-primary/50 shadow-lg shadow-primary/5" : "border-border hover:border-primary/30"
                }`}
              >
                <div
                  onClick={() => setOpenCase(isOpen ? null : c.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-11 h-11 rounded-lg flex items-center justify-center transition-colors ${
                        isOpen ? "bg-primary/15" : "bg-secondary"
                      }`}
                    >
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
                        <div
                          key={b}
                          className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed"
                        >
                          <Icon name="Check" size={11} className="text-primary mt-0.5 shrink-0" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                      {c.audience}
                    </span>
                    <Icon
                      name={isOpen ? "ChevronUp" : "ChevronDown"}
                      size={13}
                      className="text-muted-foreground"
                    />
                  </div>
                </div>

                {isOpen && linkedFlow && c.status !== "soon" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartScenario(linkedFlow.id);
                    }}
                    className="w-full mt-3 bg-primary text-primary-foreground font-bold py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-xs animate-fade-in"
                  >
                    <Icon name="Play" size={11} />
                    Запустить сценарий «{linkedFlow.persona}»
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Каналы внедрения */}
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Каналы внедрения
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {channels.map((ch) => (
            <div
              key={ch.title}
              className="bg-card border border-border rounded-lg p-4 flex items-start gap-3"
            >
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
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Дополнительные возможности
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: "FileBox", title: ".glb / .obj / .dwg", desc: "AutoCAD, 3ds Max, Blender" },
            { icon: "Users", title: "Совместная работа", desc: "Команда в одном проекте" },
            { icon: "History", title: "История версий", desc: "Сравнение и откат" },
            { icon: "BarChart3", title: "Аналитика", desc: "Стили, размеры, тренды" },
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
