import { useRef } from "react";
import Icon from "@/components/ui/icon";
import { type ConvertProgress } from "@/lib/modelConverter";
import { SUPPORTED_FORMATS, type ConvertStatus } from "./types";

/**
 * Зона drag&drop для загрузки 3D-файла + индикатор прогресса конвертации.
 * Управляется родительским ConverterSection — состояние drag/status/progress
 * и колбэки прокидываются сверху, чтобы вся бизнес-логика конвертации осталась
 * в одном месте (1:1 как было).
 */
interface Props {
  status: ConvertStatus;
  progress: ConvertProgress;
  drag: boolean;
  isWorking: boolean;
  setDrag: (v: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ConvertDropzone({
  status,
  progress,
  drag,
  isWorking,
  setDrag,
  onDrop,
  onSelect,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      onClick={() => !isWorking && inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
        drag
          ? "border-primary bg-primary/5"
          : isWorking
            ? "border-border bg-secondary/30 cursor-wait"
            : "border-border hover:border-primary hover:bg-primary/[0.02]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".fbx,.obj,.dae,.stl,.ply,.3ds,.gltf,.glb,.max"
        onChange={onSelect}
        className="hidden"
        disabled={isWorking}
      />

      {isWorking ? (
        <div className="space-y-4">
          <Icon name="Loader2" size={48} className="mx-auto text-primary animate-spin" />
          <div>
            <p className="font-semibold text-foreground">
              {status === "loading" && "Загружаем файл…"}
              {status === "converting" && "Конвертируем геометрию…"}
              {status === "exporting" && "Упаковываем в GLB…"}
              {status === "usdz" && "Делаем USDZ для iOS AR…"}
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-1">{progress.percent}%</p>
          </div>
          <div className="max-w-md mx-auto h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
            <Icon name="UploadCloud" size={32} className="text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground text-lg">Перетащите 3D-файл сюда</p>
            <p className="text-sm text-muted-foreground mt-1">или нажмите, чтобы выбрать</p>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center pt-2">
            {SUPPORTED_FORMATS.map((f) => (
              <span
                key={f.ext}
                className={`text-xs font-mono px-2 py-0.5 rounded border ${f.color}`}
              >
                .{f.ext}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            До 200 МБ • Конвертация в браузере • Файл не уходит на сервер
          </p>
        </div>
      )}
    </div>
  );
}
