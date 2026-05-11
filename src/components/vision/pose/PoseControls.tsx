import Icon from "@/components/ui/icon";

/**
 * Блок с превью фото + полями подсказок размеров + кнопкой анализа.
 * Используется на этапе, когда фото уже загружено, до и после первой попытки.
 */
interface Props {
  imageData: string;
  hintW: number;
  hintD: number;
  loading: boolean;
  hasResult: boolean;
  onReset: () => void;
  onChangeHintW: (n: number) => void;
  onChangeHintD: (n: number) => void;
  onAnalyze: () => void;
}

export default function PoseControls({
  imageData,
  hintW,
  hintD,
  loading,
  hasResult,
  onReset,
  onChangeHintW,
  onChangeHintD,
  onAnalyze,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <img src={imageData} alt="фото комнаты" className="w-full aspect-video object-cover" />
        <div className="p-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-mono">Исходное фото</p>
          <button
            onClick={onReset}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <Icon name="X" size={12} />
            Сбросить
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Подсказка размеров (опционально)
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-muted-foreground">Ширина, см</span>
            <input
              type="number"
              value={hintW}
              onChange={(e) => onChangeHintW(Number(e.target.value) || 450)}
              min={150}
              max={2000}
              className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-mono"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Глубина, см</span>
            <input
              type="number"
              value={hintD}
              onChange={(e) => onChangeHintD(Number(e.target.value) || 380)}
              min={150}
              max={2000}
              className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-mono"
            />
          </label>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Если знаете площадь — укажите ширину и глубину. Если нет — оставьте по умолчанию,
          AI оценит сам.
        </p>
        <button
          onClick={onAnalyze}
          disabled={loading}
          className="w-full bg-primary text-primary-foreground font-bold text-sm py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Icon name="Loader" size={15} className="animate-spin" />
              Анализирую позу комнаты…
            </>
          ) : hasResult ? (
            <>
              <Icon name="RefreshCw" size={15} />
              Распознать ещё раз
            </>
          ) : (
            <>
              <Icon name="ScanEye" size={15} />
              Распознать комнату
            </>
          )}
        </button>
      </div>
    </div>
  );
}
