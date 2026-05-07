import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { listProjects, deleteProject, type SavedProject } from "@/lib/projectsStore";
import { formatRub } from "@/lib/estimate";
import { exportProjectPDF } from "@/lib/pdfExport";

interface Props {
  onOpen?: (p: SavedProject) => void;
  /** Включить чекбоксы для сравнения */
  selectable?: boolean;
  selected?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

/**
 * Список локально сохранённых проектов (без авторизации).
 * Показывается в секции «Мои проекты» в гостевом режиме.
 */
export default function LocalProjectsList({ onOpen, selectable, selected, onToggleSelect }: Props) {
  const [projects, setProjects] = useState<SavedProject[]>([]);

  useEffect(() => {
    const reload = () => setProjects(listProjects());
    reload();
    window.addEventListener("roomscan:projects:changed", reload);
    return () => window.removeEventListener("roomscan:projects:changed", reload);
  }, []);

  if (projects.length === 0) {
    return (
      <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center">
        <Icon name="FolderOpen" size={32} className="text-muted-foreground mx-auto mb-3" />
        <p className="font-bold text-foreground">Пока нет сохранённых проектов</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          Отсканируйте комнату или рассчитайте смету — потом сможете сохранить как проект,
          чтобы вернуться к нему позже.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {projects.map((p) => {
        const isSelected = selected?.has(p.id) ?? false;
        return (
          <div
            key={p.id}
            className={`bg-card border rounded-xl p-4 transition-colors ${
              isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
            }`}
          >
            <div className="flex items-start gap-4">
              {selectable && onToggleSelect && (
                <button
                  onClick={() => onToggleSelect(p.id)}
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${
                    isSelected ? "bg-primary border-primary" : "border-border hover:border-primary"
                  }`}
                >
                  {isSelected && <Icon name="Check" size={14} className="text-white" />}
                </button>
              )}

              <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Icon name="Home" size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-foreground truncate">{p.name}</p>
                  {p.scan && (
                    <span className="bg-primary/10 text-primary text-[10px] font-mono px-2 py-0.5 rounded">
                      {p.scan.area.toFixed(1)} м²
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  Обновлён {new Date(p.updatedAt).toLocaleDateString("ru-RU", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </p>

                <div className="flex flex-wrap gap-3 mt-2 text-xs">
                  {p.estimate && (
                    <span className="text-foreground">
                      <Icon name="Calculator" size={11} className="inline mr-1 text-primary" />
                      Смета: <b>{formatRub(p.estimate.grandTotal)}</b>
                    </span>
                  )}
                  {p.staging && (
                    <span className="text-foreground">
                      <Icon name="TrendingUp" size={11} className="inline mr-1 text-emerald-500" />
                      Стейджинг: <b>+{p.staging.expectedUplift}%</b>
                    </span>
                  )}
                  {p.notes && (
                    <span className="text-muted-foreground italic truncate max-w-xs">
                      {p.notes}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => exportProjectPDF(p)}
                  className="p-2 text-muted-foreground hover:text-primary transition-colors"
                  title="Скачать PDF"
                >
                  <Icon name="FileDown" size={16} />
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}${window.location.pathname}#shared=${encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(p)))))}`;
                    navigator.clipboard?.writeText(url);
                    alert("Ссылка скопирована! Отправьте её дизайнеру или мастеру.");
                  }}
                  className="p-2 text-muted-foreground hover:text-primary transition-colors"
                  title="Поделиться ссылкой"
                >
                  <Icon name="Share2" size={16} />
                </button>
                {onOpen && (
                  <button
                    onClick={() => onOpen(p)}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                    title="Открыть"
                  >
                    <Icon name="ArrowRight" size={16} />
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm(`Удалить проект «${p.name}»?`)) deleteProject(p.id);
                  }}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  title="Удалить"
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}