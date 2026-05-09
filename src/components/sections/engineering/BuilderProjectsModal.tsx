import Icon from "@/components/ui/icon";
import { BuilderProjectDTO } from "@/lib/engineering-api";
import { formatRub } from "@/lib/engineering";

interface Props {
  projects: BuilderProjectDTO[];
  loadedId: number | null;
  onLoad: (p: BuilderProjectDTO) => void;
  onDelete: (p: BuilderProjectDTO) => void;
  onClose: () => void;
}

/**
 * Модалка списка сохранённых композиций конструктора.
 * Показывает дату, название, цену; позволяет загрузить или удалить.
 */
export default function BuilderProjectsModal({
  projects,
  loadedId,
  onLoad,
  onDelete,
  onClose,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl max-w-xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-secondary/40">
          <div className="flex items-center gap-2">
            <Icon name="FolderOpen" size={15} className="text-primary" />
            <p className="text-sm font-bold">Мои сборки конструктора</p>
            <span className="text-[10px] font-mono text-muted-foreground">
              {projects.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-secondary flex items-center justify-center"
          >
            <Icon name="X" size={14} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {projects.length === 0 ? (
            <div className="p-8 text-center">
              <Icon
                name="PackageOpen"
                size={32}
                className="text-muted-foreground mx-auto mb-2"
              />
              <p className="text-sm font-medium mb-1">Пока нет сохранённых сборок</p>
              <p className="text-xs text-muted-foreground">
                Соберите композицию в конструкторе и нажмите «Сохранить»
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {projects.map((p) => {
                const isActive = loadedId === p.id;
                const date = new Date(p.updated_at).toLocaleDateString("ru-RU", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={p.id}
                    className={`p-3 flex items-center gap-3 transition-colors ${
                      isActive ? "bg-primary/10" : "hover:bg-secondary/40"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon name="Hammer" size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{p.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] font-mono text-muted-foreground">{date}</p>
                        <span className="text-[10px] font-mono text-primary font-bold">
                          {formatRub(p.total_price)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onLoad(p)}
                        className="text-[11px] bg-primary text-primary-foreground px-2.5 py-1.5 rounded-md font-bold hover:bg-primary/90 flex items-center gap-1"
                      >
                        <Icon name="Download" size={11} />
                        Открыть
                      </button>
                      <button
                        onClick={() => onDelete(p)}
                        className="w-7 h-7 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center"
                        title="Удалить"
                      >
                        <Icon name="Trash2" size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
