import Icon from "@/components/ui/icon";
import type { Phase } from "./types";

interface Props {
  phase: Phase;
  framesCount: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

export default function ScannerControls({ phase, framesCount, onStart, onStop, onReset }: Props) {
  return (
    <div className="flex gap-3">
      {phase === "idle" && (
        <button onClick={onStart}
          className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Icon name="Camera" size={17} />
          Начать съёмку
        </button>
      )}
      {phase === "recording" && (
        <>
          <button onClick={onStop} disabled={framesCount < 10}
            className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
          >
            <Icon name="Cpu" size={17} />
            {framesCount < 10 ? `Ещё ${10 - framesCount} кадров...` : "Обработать"}
          </button>
          <button onClick={onReset}
            className="bg-secondary text-muted-foreground px-4 rounded-lg hover:bg-border transition-colors"
          >
            <Icon name="X" size={17} />
          </button>
        </>
      )}
      {(phase === "done" || phase === "error") && (
        <button onClick={onReset}
          className="flex-1 bg-secondary text-secondary-foreground font-semibold py-3 rounded-lg hover:bg-border transition-colors flex items-center justify-center gap-2"
        >
          <Icon name="RotateCcw" size={17} />
          Сканировать заново
        </button>
      )}
    </div>
  );
}
