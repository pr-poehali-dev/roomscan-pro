import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { listProjects, type SavedProject } from "@/lib/projectsStore";
import { getLastScan, type LastScan } from "@/lib/scanStore";
import { formatRub } from "@/lib/estimate";

interface Props {
  onNavigate: (section: string) => void;
}

/**
 * Блок «Продолжить работу» на главной странице.
 * Показывает 1-3 последних проекта и кнопки быстрого продолжения,
 * только если у пользователя что-то уже сохранено.
 */
export default function ContinueWorkBlock({ onNavigate }: Props) {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [lastScan, setLastScan] = useState<LastScan | null>(null);

  useEffect(() => {
    const reload = () => {
      setProjects(listProjects().slice(0, 3));
      setLastScan(getLastScan());
    };
    reload();
    window.addEventListener("roomscan:projects:changed", reload);
    window.addEventListener("roomscan:lastScan:changed", reload);
    return () => {
      window.removeEventListener("roomscan:projects:changed", reload);
      window.removeEventListener("roomscan:lastScan:changed", reload);
    };
  }, []);

  if (projects.length === 0 && !lastScan) return null;

  return (
    <section className="px-6 lg:px-12 py-10 bg-gradient-to-b from-primary/5 to-transparent">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">
              Продолжить работу
            </p>
            <h2 className="text-2xl font-black text-foreground">
              Ваши последние проекты
            </h2>
          </div>
          <button
            onClick={() => onNavigate("projects")}
            className="text-sm text-primary font-bold hover:underline flex items-center gap-1"
          >
            Все проекты
            <Icon name="ArrowRight" size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Карточка свежего скана (если есть и нет сохранённых проектов на его базе) */}
          {lastScan && (
            <button
              onClick={() => onNavigate("calc")}
              className="text-left bg-gradient-to-br from-primary/10 to-emerald-500/5 border-2 border-primary/40 rounded-2xl p-4 hover:scale-[1.02] transition-transform"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  Свежий скан
                </span>
                <Icon name="ScanLine" size={14} className="text-primary ml-auto" />
              </div>
              <p className="font-black text-foreground text-base mb-0.5">
                {lastScan.area.toFixed(1)} м²
              </p>
              <p className="text-xs text-muted-foreground">
                {lastScan.width.toFixed(1)} × {lastScan.length.toFixed(1)} м · {lastScan.height.toFixed(2)} м
              </p>
              <p className="text-[10px] text-muted-foreground font-mono mt-2">
                {new Date(lastScan.savedAt).toLocaleDateString("ru-RU")}
              </p>
              <p className="text-xs text-primary font-bold mt-3 flex items-center gap-1">
                Рассчитать смету
                <Icon name="ArrowRight" size={12} />
              </p>
            </button>
          )}

          {projects.slice(0, lastScan ? 2 : 3).map((p) => (
            <button
              key={p.id}
              onClick={() => onNavigate("projects")}
              className="text-left bg-card border border-border rounded-2xl p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Home" size={14} className="text-primary" />
                <p className="font-bold text-foreground text-sm truncate flex-1">
                  {p.name}
                </p>
              </div>
              {p.scan && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  {p.scan.area.toFixed(1)} м² · высота {p.scan.height.toFixed(2)} м
                </p>
              )}
              {p.estimate && (
                <p className="text-sm font-black text-primary font-mono mt-2">
                  {formatRub(p.estimate.grandTotal)}
                </p>
              )}
              {p.staging && (
                <p className="text-sm font-bold text-emerald-500 mt-1">
                  Прирост цены: +{p.staging.expectedUplift}%
                </p>
              )}
              <p className="text-[10px] text-muted-foreground font-mono mt-2">
                {new Date(p.updatedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
