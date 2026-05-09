import Icon from "@/components/ui/icon";

type Mode = "catalog" | "constructor";

interface Props {
  mode: Mode;
  setMode: (m: Mode) => void;
  setLoadedId: (id: number | null) => void;
  startConstructor: () => void;
  savedProjectsCount: number;
  onOpenSavedProjects: () => void;
}

/**
 * Шапка раздела «Модульные дома»: заголовок + описание +
 * переключатель режимов (Каталог / Конструктор) + кнопка «Мои проекты».
 * Логика 1:1 перенесена из ModularHousesSection.tsx без изменений.
 */
export default function HousesHeader({
  mode,
  setMode,
  setLoadedId,
  startConstructor,
  savedProjectsCount,
  onOpenSavedProjects,
}: Props) {
  return (
    <>
      <div className="mb-8">
        <p className="t-meta text-primary mb-3">Модуль · Модульное домостроение</p>
        <h1 className="h-section text-foreground mb-3 flex items-center gap-3 flex-wrap">
          <span className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
            <Icon name="Boxes" size={24} className="text-primary" />
          </span>
          Модульные дома: каталог и конструктор
        </h1>
        <p className="t-lead max-w-3xl">
          17 готовых проектов: модульные, каркасные и футуристичные — от 18 до 141 м². Выбор планировок, конструктор drag-and-drop, смета «под ключ».
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <div className="inline-flex bg-secondary rounded-xl p-1 gap-1">
          <button
            onClick={() => { setMode("catalog"); setLoadedId(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              mode === "catalog" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon name="Grid3x3" size={13} />
            Каталог проектов
          </button>
          <button
            onClick={mode === "constructor" ? () => setMode("constructor") : startConstructor}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              mode === "constructor" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon name="Sparkles" size={13} />
            Конструктор
          </button>
        </div>

        <button
          onClick={onOpenSavedProjects}
          className="px-3 py-2 rounded-lg text-xs font-bold bg-card border border-border text-foreground flex items-center gap-1.5 hover:border-foreground/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Icon name="FolderOpen" size={12} />
          Мои проекты
          {savedProjectsCount > 0 && (
            <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[9px] t-num">
              {savedProjectsCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
}