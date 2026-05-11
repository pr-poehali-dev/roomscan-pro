import Icon from "@/components/ui/icon";
import type { DetectionResponse } from "./constants";

/**
 * Нижняя панель кнопок управления:
 * — до анализа: «Распознать»
 * — после анализа: «Импорт в Планировщик» + «Переанализировать»
 * — всегда: «Сбросить»
 */
interface Props {
  result: DetectionResponse | null;
  analyzing: boolean;
  excludedCount: number;
  onAnalyze: () => void;
  onImport: () => void;
  onReset: () => void;
}

export default function VisionActions({
  result,
  analyzing,
  excludedCount,
  onAnalyze,
  onImport,
  onReset,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!result ? (
        <button
          onClick={onAnalyze}
          disabled={analyzing}
          className="flex-1 min-w-[200px] bg-primary text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 shadow-lg shadow-primary/20"
        >
          <Icon
            name={analyzing ? "Loader2" : "ScanSearch"}
            size={16}
            className={analyzing ? "animate-spin" : ""}
          />
          {analyzing ? "Анализирую…" : "Распознать объекты"}
        </button>
      ) : (
        <>
          <button
            onClick={onImport}
            className="flex-1 min-w-[200px] bg-primary text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Icon name="LayoutGrid" size={16} />
            Импорт в Планировщик
            <span className="text-[10px] font-mono opacity-80">
              {result.objects.length - excludedCount} шт
            </span>
          </button>
          <button
            onClick={onAnalyze}
            className="px-4 py-3 rounded-xl bg-secondary text-foreground font-bold text-sm hover:bg-secondary/70 transition-colors"
          >
            <Icon name="RotateCcw" size={13} className="inline mr-1" />
            Переанализировать
          </button>
        </>
      )}
      <button
        onClick={onReset}
        className="px-3 py-3 rounded-xl text-muted-foreground hover:text-destructive text-sm font-bold flex items-center gap-1.5"
      >
        <Icon name="X" size={13} />
        Сбросить
      </button>
    </div>
  );
}
