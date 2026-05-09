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
      <div className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-1">
          Модуль · Модульное домостроение
        </p>
        <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2 flex items-center gap-3 flex-wrap">
          <span className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center">
            <Icon name="Boxes" size={22} className="text-primary" />
          </span>
          Модульные дома: каталог и конструктор
        </h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          8 готовых проектов от 18 до 141 м² или свой дом из блок-модулей с drag-and-drop, сохранением и сметой «под ключ».
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div className="inline-flex bg-secondary rounded-xl p-1">
          <button
            onClick={() => { setMode("catalog"); setLoadedId(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              mode === "catalog" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
            }`}
          >
            <Icon name="Grid3x3" size={13} />
            Каталог проектов
          </button>
          <button
            onClick={mode === "constructor" ? () => setMode("constructor") : startConstructor}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              mode === "constructor" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
            }`}
          >
            <Icon name="Sparkles" size={13} />
            Конструктор
          </button>
        </div>

        <button
          onClick={onOpenSavedProjects}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-foreground flex items-center gap-1.5"
        >
          <Icon name="FolderOpen" size={12} />
          Мои проекты
          {savedProjectsCount > 0 && (
            <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[9px]">
              {savedProjectsCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
}
