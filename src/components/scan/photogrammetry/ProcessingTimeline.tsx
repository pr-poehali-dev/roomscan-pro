import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

interface Stage {
  id: string;
  label: string;
  icon: string;
  durationSec: number;  // ожидаемая длительность
}

const STAGES: Stage[] = [
  { id: "download",  label: "Загрузка кадров из S3",        icon: "Download",     durationSec: 4 },
  { id: "clean",     label: "Очистка: blur + dedup",         icon: "Sparkles",     durationSec: 3 },
  { id: "orb",       label: "ORB feature detection",         icon: "Crosshair",    durationSec: 5 },
  { id: "match",     label: "BF-matching + Lowe ratio",      icon: "Link2",        durationSec: 6 },
  { id: "ransac",    label: "Essential RANSAC + recoverPose", icon: "Triangle",    durationSec: 7 },
  { id: "triang",    label: "DLT triangulation",             icon: "Box",          durationSec: 4 },
  { id: "outlier",   label: "Outlier removal (Z + KNN)",     icon: "Filter",       durationSec: 3 },
  { id: "planes",    label: "Plane segmentation RANSAC",     icon: "LayoutGrid",   durationSec: 8 },
  { id: "openings",  label: "Детекция окон и дверей",        icon: "DoorOpen",     durationSec: 3 },
  { id: "done",      label: "Реконструкция завершена",       icon: "CheckCircle2", durationSec: 1 },
];

const TOTAL_SEC = STAGES.reduce((s, x) => s + x.durationSec, 0);

export default function ProcessingTimeline() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => {
      setElapsed((Date.now() - start) / 1000);
    }, 200);
    return () => clearInterval(t);
  }, []);

  // Какой этап сейчас активен
  let acc = 0;
  let currentIdx = 0;
  for (let i = 0; i < STAGES.length; i++) {
    if (elapsed < acc + STAGES[i].durationSec) {
      currentIdx = i;
      break;
    }
    acc += STAGES[i].durationSec;
    currentIdx = i;
  }

  const overallPct = Math.min(100, Math.round((elapsed / TOTAL_SEC) * 100));

  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-fade-in space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Icon name="Cpu" size={11} className="text-primary" />
          CV-pipeline · обработка
        </p>
        <span className="text-xs font-mono font-bold text-primary">
          {overallPct}% · {elapsed.toFixed(0)} сек
        </span>
      </div>

      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-200"
          style={{ width: `${overallPct}%` }}
        />
      </div>

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {STAGES.map((s, i) => {
          const isDone = i < currentIdx;
          const isActive = i === currentIdx && elapsed < TOTAL_SEC;
          return (
            <div
              key={s.id}
              className={`flex items-center gap-3 px-2 py-1.5 rounded-md text-xs transition-all ${
                isActive ? "bg-primary/10 border border-primary/20"
                : isDone ? "opacity-60"
                : "opacity-30"
              }`}
            >
              <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                isActive ? "bg-primary text-primary-foreground"
                : isDone ? "bg-primary/20 text-primary"
                : "bg-secondary text-muted-foreground"
              }`}>
                {isActive ? (
                  <Icon name="Loader2" size={11} className="animate-spin" />
                ) : isDone ? (
                  <Icon name="Check" size={11} />
                ) : (
                  <Icon name={s.icon} size={11} />
                )}
              </div>
              <span className={`flex-1 ${isActive ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                ~{s.durationSec}с
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
