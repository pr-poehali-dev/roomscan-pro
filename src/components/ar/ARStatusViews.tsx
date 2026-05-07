import Icon from "@/components/ui/icon";
import type { ARFurniture } from "./ARFurnitureView";

export function ARCheckingView() {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <Icon name="Loader2" size={28} className="text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Проверяем поддержку AR…</p>
    </div>
  );
}

interface ARErrorViewProps {
  status: "unsupported" | "error";
  error: string;
}

export function ARErrorView({ status, error }: ARErrorViewProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center">
        <Icon name="AlertCircle" size={26} className="text-destructive" />
      </div>
      <p className="text-sm font-semibold text-foreground text-center">
        {status === "unsupported" ? "AR недоступен" : "Ошибка"}
      </p>
      <p className="text-xs text-muted-foreground text-center max-w-md">
        {error || "Откройте этот сайт на Android в Chrome 90+ с поддержкой ARCore. " +
        "Список устройств: developers.google.com/ar/devices"}
      </p>
      <div className="bg-secondary/40 rounded-lg p-3 mt-2 w-full">
        <p className="text-xs font-semibold text-foreground mb-2">Что нужно для работы:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Android-смартфон Pixel 4+ / Galaxy S10+ / OnePlus 7+</li>
          <li>• Браузер Chrome 90+ или Edge</li>
          <li>• Установленный Google Play Services for AR</li>
          <li>• Доступ к камере</li>
        </ul>
      </div>
    </div>
  );
}

interface ARReadyViewProps {
  item: ARFurniture;
  onStart: () => void;
}

export function ARReadyView({ item, onStart }: ARReadyViewProps) {
  return (
    <div className="space-y-3">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Icon name="CheckCircle2" size={18} className="text-primary mt-0.5" />
          <div>
            <p className="text-sm font-bold text-foreground">AR доступен на этом устройстве</p>
            <p className="text-xs text-muted-foreground mt-1">
              Нажмите «Запустить AR», направьте камеру на пол и тапните, чтобы поставить мебель.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-secondary/40 rounded-md p-2 text-center">
          <p className="text-primary font-bold font-mono">{item.width} м</p>
          <p className="text-muted-foreground">Ширина</p>
        </div>
        <div className="bg-secondary/40 rounded-md p-2 text-center">
          <p className="text-primary font-bold font-mono">{item.depth} м</p>
          <p className="text-muted-foreground">Глубина</p>
        </div>
        <div className="bg-secondary/40 rounded-md p-2 text-center">
          <p className="text-primary font-bold font-mono">{item.height} м</p>
          <p className="text-muted-foreground">Высота</p>
        </div>
      </div>

      <div className="bg-secondary/30 rounded-lg p-3 space-y-1.5">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Инструкция
        </p>
        {[
          "Направьте камеру на пол",
          "Подождите, пока появится зелёный кружок",
          "Тапните, чтобы поставить предмет",
          "Можете обойти его и оценить габариты",
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-5 h-5 bg-primary/10 text-primary rounded-md flex items-center justify-center font-mono font-bold">
              {i + 1}
            </span>
            <span className="text-foreground">{s}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onStart}
        className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        <Icon name="View" size={17} />
        Запустить AR
      </button>
    </div>
  );
}
