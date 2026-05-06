import Icon from "@/components/ui/icon";
import type { ScanResult } from "./types";

export default function ScanResultPanel({ result }: { result: ScanResult }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-fade-in space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Фотограмметрия · SfM
        </p>
        <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${
          result.accuracy_estimate.includes("5") ? "bg-primary/10 text-primary" : "bg-yellow-500/10 text-yellow-500"
        }`}>
          {result.accuracy_estimate}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Ширина", value: `${result.width} м` },
          { label: "Длина", value: `${result.length} м` },
          { label: "Высота", value: `${result.height} м` },
          { label: "Площадь", value: `${result.area} м²` },
        ].map((m) => (
          <div key={m.label} className="bg-secondary rounded-lg p-3 text-center">
            <p className="text-xl font-black text-primary font-mono">{m.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground font-mono pt-1 border-t border-border flex-wrap">
        <span>Кадров: {result.frames_used}</span>
        <span>Точек облака: {result.point_cloud_points.toLocaleString()}</span>
      </div>

      {/* Data quality (Confidence) */}
      {result.confidence !== undefined && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Icon name="ShieldCheck" size={11} className="text-primary" />
              Качество данных
            </p>
            <span className={`text-xs font-mono font-bold ${
              (result.confidence ?? 0) >= 0.75 ? "text-primary"
              : (result.confidence ?? 0) >= 0.5 ? "text-yellow-500"
              : "text-destructive"
            }`}>
              {result.confidence_label} · {Math.round((result.confidence ?? 0) * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden mb-2">
            <div className={`h-full transition-all ${
              (result.confidence ?? 0) >= 0.75 ? "bg-primary"
              : (result.confidence ?? 0) >= 0.5 ? "bg-yellow-500"
              : "bg-destructive"
            }`} style={{ width: `${(result.confidence ?? 0) * 100}%` }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
            {[
              { label: "Принято", val: `${result.frames_used}/${result.frames_input ?? "—"}`, icon: "CheckCircle2" },
              { label: "Размытых", val: `${result.frames_blurred ?? 0}`, icon: "Frown" },
              { label: "Дубликатов", val: `${result.frames_duplicates ?? 0}`, icon: "Copy" },
              { label: "Выбросов 3D", val: `${result.outliers_removed ?? 0}`, icon: "Filter" },
            ].map((m) => (
              <div key={m.label} className="bg-secondary/50 rounded-md px-2 py-1 flex items-center gap-1.5">
                <Icon name={m.icon} size={10} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-foreground font-semibold truncate">{m.val}</p>
                  <p className="text-muted-foreground truncate">{m.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CV-метрики реального pipeline */}
      {(result.features_total ?? 0) > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <Icon name="Cpu" size={11} className="text-primary" />
            CV-pipeline · ORB + Essential RANSAC
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "ORB-точек", val: result.features_total?.toLocaleString() ?? "—", icon: "Sparkles" },
              { label: "Совпадений", val: result.matches_total?.toLocaleString() ?? "—", icon: "Link2" },
              { label: "Inliers", val: `${result.inliers_pct ?? 0}%`, icon: "Target" },
              { label: "Стен найдено", val: `${result.wall_planes ?? 0}`, icon: "Box" },
            ].map((m) => (
              <div key={m.label} className="bg-secondary/50 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">
                <Icon name={m.icon} size={10} className="text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-mono text-foreground font-semibold truncate">{m.val}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{m.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Окна и двери (auto-detect) */}
      {((result.doors ?? 0) + (result.windows ?? 0)) > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <Icon name="Sparkles" size={11} className="text-primary" />
            Авто-распознавание проёмов
          </p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-primary/5 border border-primary/20 rounded-md px-3 py-2 flex items-center gap-2">
              <Icon name="DoorOpen" size={16} className="text-primary" />
              <div>
                <p className="text-sm font-bold text-foreground">{result.doors ?? 0} {result.doors === 1 ? "дверь" : "двери"}</p>
                <p className="text-[10px] text-muted-foreground">найдено в стенах</p>
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-md px-3 py-2 flex items-center gap-2">
              <Icon name="AppWindow" size={16} className="text-primary" />
              <div>
                <p className="text-sm font-bold text-foreground">{result.windows ?? 0} {result.windows === 1 ? "окно" : "окон"}</p>
                <p className="text-[10px] text-muted-foreground">с подоконниками</p>
              </div>
            </div>
          </div>
          {result.openings && result.openings.length > 0 && (
            <div className="space-y-1">
              {result.openings.slice(0, 5).map((o, i) => (
                <div key={i} className="flex items-center gap-2 text-xs bg-secondary/40 rounded px-2 py-1">
                  <Icon name={o.type === "door" ? "DoorOpen" : "AppWindow"} size={11} className="text-primary shrink-0" />
                  <span className="text-foreground font-semibold">
                    {o.type === "door" ? "Дверь" : "Окно"} #{i + 1}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {o.width}×{o.height} м
                  </span>
                  {o.type === "window" && (
                    <span className="text-muted-foreground font-mono ml-auto">
                      подоконник {o.sill} м
                    </span>
                  )}
                </div>
              ))}
              {result.openings.length > 5 && (
                <p className="text-[10px] text-muted-foreground font-mono pl-2">
                  и ещё {result.openings.length - 5}…
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
