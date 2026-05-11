import Icon from "@/components/ui/icon";

/**
 * Заглушка, когда WebXR Depth API недоступен на устройстве.
 * Показывает причину и матрицу диагностики (браузер / платформа / WebXR / Depth API).
 */
export default function WebXRUnsupported() {
  const checks: Array<[string, string]> = [
    ["Браузер", navigator.userAgent.includes("Chrome") ? "✓ Chrome" : "✗ Не Chrome"],
    ["Платформа", /Android/.test(navigator.userAgent) ? "✓ Android" : "✗ Не Android"],
    ["WebXR", navigator.xr ? "✓ Поддержка" : "✗ Нет"],
    ["Depth API", "✗ Нет сенсора"],
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-yellow-500/10 rounded-lg flex items-center justify-center shrink-0">
          <Icon name="AlertTriangle" size={18} className="text-yellow-500" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">WebXR Depth API недоступен</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Требуется <strong className="text-foreground">Chrome на Android</strong> с ToF/LiDAR сенсором
            (Pixel 6+, Samsung S21+). На этом устройстве используйте{" "}
            <strong className="text-foreground">Вариант B — фотограмметрию</strong>.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        {checks.map(([k, v]) => (
          <div key={k} className="bg-secondary rounded px-2.5 py-1.5">
            <span className="text-muted-foreground">{k}: </span>
            <span className={v.startsWith("✓") ? "text-primary" : "text-destructive"}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
