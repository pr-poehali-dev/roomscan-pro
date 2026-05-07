import { useEffect, useState } from "react";

export type ScenarioSection = "scan" | "planner" | "catalog" | "styles" | "calc" | "export";

export interface ScenarioStep {
  id: string;
  title: string;
  description: string;
  section: ScenarioSection;
  icon: string;
  hint?: string;
}

export interface ScenarioFlow {
  id: string;
  persona: string;
  goal: string;
  icon: string;
  color: string;
  outcome: string;
  estimate: string;
  steps: ScenarioStep[];
}

export const SCENARIOS: ScenarioFlow[] = [
  {
    id: "buy-sofa",
    persona: "Покупатель мебели",
    goal: "Подобрать диван, который точно впишется в гостиную",
    icon: "Sofa",
    color: "from-blue-500/20 to-purple-500/20",
    outcome: "Точные размеры · меньше возвратов",
    estimate: "10–15 минут",
    steps: [
      {
        id: "scan-room",
        title: "Сканируем гостиную",
        description: "Снимите комнату на телефон, ИИ построит 3D-модель и обмерит её.",
        section: "scan",
        icon: "ScanLine",
        hint: "Двигайтесь медленно, охватите все стены",
      },
      {
        id: "pick-sofa",
        title: "Выбираем диван из каталога",
        description: "Откройте каталог мебели и добавьте понравившийся диван в проект.",
        section: "catalog",
        icon: "Sofa",
        hint: "Можно фильтровать по цене и размеру",
      },
      {
        id: "place-plan",
        title: "Расставляем в планировщике",
        description: "Перетащите диван на план комнаты — увидите свободные проходы.",
        section: "planner",
        icon: "LayoutGrid",
        hint: "Зелёным подсвечиваются безопасные зоны",
      },
      {
        id: "calc-cost",
        title: "Проверяем бюджет",
        description: "В разделе «Расчёты» оцените общую стоимость покупки и доставки.",
        section: "calc",
        icon: "Calculator",
      },
    ],
  },
  {
    id: "designer-flow",
    persona: "Дизайнер интерьера",
    goal: "Согласовать проект с заказчиком за 2 дня вместо 2 недель",
    icon: "PencilRuler",
    color: "from-primary/20 to-cyan-500/20",
    outcome: "Быстрее согласование с заказчиком",
    estimate: "30–60 минут",
    steps: [
      {
        id: "import-scan",
        title: "Получаем 3D-скан квартиры",
        description: "Заказчик прислал скан — откройте сканер и загрузите его.",
        section: "scan",
        icon: "Upload",
      },
      {
        id: "ai-style",
        title: "Подбираем AI-стиль",
        description: "В разделе «AI-стили» примените сканди / лофт / классику одним кликом.",
        section: "styles",
        icon: "Wand2",
        hint: "ИИ сгенерирует 3 варианта за минуту",
      },
      {
        id: "furnish",
        title: "Расставляем мебель",
        description: "В планировщике соберите композицию из каталога и кастомных моделей.",
        section: "planner",
        icon: "LayoutGrid",
      },
      {
        id: "estimate",
        title: "Считаем смету",
        description: "Авторасчёт стоимости отделки, мебели и работ.",
        section: "calc",
        icon: "Calculator",
      },
      {
        id: "share",
        title: "Отправляем заказчику",
        description: "Экспортируйте интерактивную ссылку или PDF с визуализациями.",
        section: "export",
        icon: "Share2",
      },
    ],
  },
  {
    id: "insurance",
    persona: "Страховой агент",
    goal: "Зафиксировать ущерб от затопления за 15 минут",
    icon: "Droplets",
    color: "from-red-500/20 to-orange-500/20",
    outcome: "Время оценки: с 2 часов до 15 минут",
    estimate: "10–20 минут",
    steps: [
      {
        id: "scan-damage",
        title: "Сканируем повреждённое помещение",
        description: "Запустите сканер на месте и снимите все пострадавшие зоны.",
        section: "scan",
        icon: "ScanLine",
        hint: "ИИ автоматически выделит мокрые поверхности",
      },
      {
        id: "measure",
        title: "Считаем площадь ущерба",
        description: "В разделе «Расчёты» получите сумму по тарифам страховой компании.",
        section: "calc",
        icon: "Calculator",
      },
      {
        id: "report",
        title: "Формируем отчёт",
        description: "Экспорт в PDF с фотографиями, замерами и геопривязкой.",
        section: "export",
        icon: "FileText",
      },
    ],
  },
  {
    id: "renovation",
    persona: "Домовладелец, делающий ремонт",
    goal: "Спланировать ремонт и купить материалы без ошибок",
    icon: "HardHat",
    color: "from-yellow-500/20 to-orange-500/20",
    outcome: "Перерасход материалов: 0%",
    estimate: "20–40 минут",
    steps: [
      {
        id: "scan-flat",
        title: "Снимаем квартиру до ремонта",
        description: "Полное сканирование всех комнат для базовой 3D-модели.",
        section: "scan",
        icon: "ScanLine",
      },
      {
        id: "try-styles",
        title: "Примеряем стили",
        description: "Выберите AI-стиль, чтобы понять, как будет выглядеть результат.",
        section: "styles",
        icon: "Wand2",
      },
      {
        id: "plan-furniture",
        title: "Расставляем будущую мебель",
        description: "Проверьте, что всё помещается и удобные проходы.",
        section: "planner",
        icon: "LayoutGrid",
      },
      {
        id: "materials",
        title: "Считаем материалы",
        description: "Площадь стен, пола, потолка → объёмы краски, плитки, ламината.",
        section: "calc",
        icon: "Calculator",
        hint: "Расчёт уже включает запас 7–10%",
      },
      {
        id: "send-builder",
        title: "Отдаём прорабу",
        description: "Экспорт чертежей и сметы — никаких устных пояснений.",
        section: "export",
        icon: "Share2",
      },
    ],
  },
];

// ── State management ────────────────────────────────────────────────────

const KEY = "roomscan:active_scenario";

interface ScenarioState {
  scenarioId: string;
  completed: string[]; // step ids
  startedAt: number;
}

export function loadScenarioState(): ScenarioState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ScenarioState) : null;
  } catch {
    return null;
  }
}

export function saveScenarioState(s: ScenarioState | null) {
  if (typeof window === "undefined") return;
  if (!s) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("scenario:changed"));
}

export function startScenario(scenarioId: string) {
  saveScenarioState({ scenarioId, completed: [], startedAt: Date.now() });
}

export function stopScenario() {
  saveScenarioState(null);
}

export function completeStep(stepId: string) {
  const s = loadScenarioState();
  if (!s) return;
  if (!s.completed.includes(stepId)) {
    saveScenarioState({ ...s, completed: [...s.completed, stepId] });
  }
}

export function useScenario() {
  const [state, setState] = useState<ScenarioState | null>(() => loadScenarioState());

  useEffect(() => {
    const handler = () => setState(loadScenarioState());
    window.addEventListener("scenario:changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("scenario:changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const flow = state ? SCENARIOS.find((s) => s.id === state.scenarioId) ?? null : null;
  const currentStepIdx = flow
    ? flow.steps.findIndex((s) => !state!.completed.includes(s.id))
    : -1;
  const currentStep = flow && currentStepIdx >= 0 ? flow.steps[currentStepIdx] : null;
  const isFinished = flow && currentStepIdx === -1;
  const progress = flow ? state!.completed.length / flow.steps.length : 0;

  return { state, flow, currentStep, currentStepIdx, isFinished, progress };
}