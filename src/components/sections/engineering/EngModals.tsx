import { useState } from "react";
import Icon from "@/components/ui/icon";
import {
  CATEGORY_LABELS,
  EQUIPMENT,
  EquipmentItem,
  formatRub,
} from "@/lib/engineering";
import { EngProjectDTO } from "@/lib/engineering-api";

/**
 * Модалка-каталог оборудования: поиск + фильтр по категориям.
 * По клику добавляет EquipmentItem в layout проекта.
 * Логика 1:1 перенесена из EngineeringSection.tsx без изменений.
 */
export function EquipmentPicker({
  onPick,
  onClose,
}: {
  onPick: (item: EquipmentItem) => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  const filtered = EQUIPMENT.filter((e) => {
    if (e.size[0] === 0) return false;
    if (filter !== "all" && e.category !== filter) return false;
    if (q && !`${e.name} ${e.brand ?? ""} ${e.specs}`.toLowerCase().includes(q.toLowerCase()))
      return false;
    return true;
  });

  const cats = Array.from(new Set(EQUIPMENT.filter((e) => e.size[0] > 0).map((e) => e.category)));

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <p className="font-bold flex items-center gap-2">
            <Icon name="Package" size={16} className="text-primary" />
            Каталог оборудования
          </p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <Icon name="X" size={16} />
          </button>
        </div>
        <div className="px-5 py-3 border-b border-border space-y-2">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по названию или бренду…"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                filter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary"
              }`}
            >
              Все
            </button>
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  filter === c ? "bg-primary text-primary-foreground" : "bg-secondary"
                }`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filtered.map((e) => (
            <button
              key={e.id}
              onClick={() => onPick(e)}
              className="text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all"
            >
              <div className="flex items-start gap-2">
                <span
                  className="w-3 h-3 rounded-full mt-1 shrink-0 border border-border"
                  style={{ background: e.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] uppercase font-mono text-muted-foreground">
                    {CATEGORY_LABELS[e.category]} {e.brand && `· ${e.brand}`}
                  </p>
                  <p className="text-sm font-bold truncate">{e.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{e.specs}</p>
                  <p className="text-[11px] font-bold text-primary mt-1">{formatRub(e.price)}</p>
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-sm text-muted-foreground py-8">
              Ничего не найдено
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Модалка со списком сохранённых проектов котельных: открыть / удалить.
 * Логика 1:1 перенесена из EngineeringSection.tsx без изменений.
 */
export function ProjectsList({
  projects,
  loadedId,
  onLoad,
  onDelete,
  onClose,
}: {
  projects: EngProjectDTO[];
  loadedId: number | null;
  onLoad: (p: EngProjectDTO) => void;
  onDelete: (p: EngProjectDTO) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <p className="font-bold flex items-center gap-2">
            <Icon name="FolderOpen" size={16} className="text-primary" />
            Мои проекты котельных ({projects.length})
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
              <p className="text-[11px] mt-1">Настрой котельную и нажми «Сохранить».</p>
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
                      #{p.id} · {new Date(p.updated_at).toLocaleString("ru-RU")}
                    </p>
                    <p className="font-bold text-foreground truncate">{p.title}</p>
                    <p className="text-sm font-bold text-primary font-mono">
                      {formatRub(p.total_price)}
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
