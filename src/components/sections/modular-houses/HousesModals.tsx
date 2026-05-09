import Icon from "@/components/ui/icon";
import {
  BLOCK_MODULES,
  BlockModule,
  MODULE_TYPE_LABELS,
} from "@/lib/modular-houses";
import { formatRub } from "@/lib/engineering";
import { HouseProjectDTO } from "@/lib/engineering-api";

/**
 * Модалка-каталог блок-модулей: сетка карточек, по клику — добавляет модуль в проект.
 * Логика 1:1 перенесена из ModularHousesSection.tsx без изменений.
 */
export function ModulePicker({
  onPick,
  onClose,
}: {
  onPick: (m: BlockModule) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <p className="font-bold flex items-center gap-2">
            <Icon name="Boxes" size={16} className="text-primary" />
            Каталог блок-модулей
          </p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <Icon name="X" size={16} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BLOCK_MODULES.map((m) => (
            <button
              key={m.id}
              onClick={() => onPick(m)}
              className="text-left p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center border border-border"
                  style={{ background: m.color }}
                >
                  <Icon name={m.icon} size={20} className="text-foreground/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase font-mono text-muted-foreground">
                    {MODULE_TYPE_LABELS[m.type]} · {m.size[0]}×{m.size[2]} м
                  </p>
                  <p className="text-sm font-bold truncate">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    {m.description}
                  </p>
                  <p className="text-xs font-bold text-primary mt-1.5">{formatRub(m.price)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Модалка со списком сохранённых проектов: открыть / удалить.
 * Логика 1:1 перенесена из ModularHousesSection.tsx без изменений.
 */
export function SavedProjectsList({
  projects,
  loadedId,
  onLoad,
  onDelete,
  onClose,
}: {
  projects: HouseProjectDTO[];
  loadedId: number | null;
  onLoad: (p: HouseProjectDTO) => void;
  onDelete: (p: HouseProjectDTO) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <p className="font-bold flex items-center gap-2">
            <Icon name="FolderOpen" size={16} className="text-primary" />
            Мои проекты домов ({projects.length})
          </p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <Icon name="X" size={16} />
          </button>
        </div>
        <div className="overflow-y-auto p-3 space-y-2">
          {projects.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <Icon name="FolderOpen" size={32} className="mx-auto mb-2 opacity-40" />
              <p>Пока нет сохранённых проектов.</p>
              <p className="text-[11px] mt-1">Собери дом и нажми «Сохранить».</p>
            </div>
          ) : (
            projects.map((p) => (
              <div
                key={p.id}
                className={`p-3 rounded-lg border-2 transition-all ${
                  loadedId === p.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      #{p.id} · {p.total_area} м² · {new Date(p.updated_at).toLocaleString("ru-RU")}
                    </p>
                    <p className="font-bold text-foreground truncate">{p.title}</p>
                    <p className="text-sm font-bold text-primary font-mono">
                      {formatRub(p.grand_total)}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => onLoad(p)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground"
                    >
                      Открыть
                    </button>
                    <button
                      onClick={() => onDelete(p)}
                      className="px-2 py-1.5 rounded-lg text-xs bg-secondary text-muted-foreground hover:text-destructive"
                      aria-label="Удалить"
                    >
                      <Icon name="Trash2" size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
