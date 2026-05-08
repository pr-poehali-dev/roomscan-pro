import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import EngineeringScene from "@/components/3d/EngineeringScene";
import QuoteDialog from "@/components/QuoteDialog";
import {
  CATEGORY_LABELS,
  EQUIPMENT,
  EquipmentItem,
  NODE_TEMPLATES,
  NodePlacement,
  NodeTemplate,
  bomTotal,
  buildBom,
  formatRub,
  getEquipment,
} from "@/lib/engineering";
import {
  EngProjectDTO,
  createEngProject,
  deleteEngProject,
  getEngProject,
  listEngProjects,
  updateEngProject,
} from "@/lib/engineering-api";
import { exportEngineeringPdf } from "@/lib/pdf-export";
import { notify, confirmAction } from "@/lib/notify";

/**
 * Раздел «Инженерные узлы»: 3D + drag-and-drop + сохранение в БД + PDF + Telegram-заявка.
 */
export default function EngineeringSection() {
  const [tplIndex, setTplIndex] = useState(0);
  const baseTpl = NODE_TEMPLATES[tplIndex];

  const [customLayout, setCustomLayout] = useState<NodePlacement[]>(() => baseTpl.layout);
  const [selectedEqId, setSelectedEqId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [picker, setPicker] = useState(false);

  const [projects, setProjects] = useState<EngProjectDTO[]>([]);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [quoteOpen, setQuoteOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    listEngProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  const handleSelectTpl = (i: number) => {
    setTplIndex(i);
    setCustomLayout(NODE_TEMPLATES[i].layout);
    setSelectedEqId(null);
    setLoadedId(null);
  };

  const tplWithLayout: NodeTemplate = useMemo(
    () => ({ ...baseTpl, layout: customLayout }),
    [baseTpl, customLayout],
  );

  const bom = useMemo(() => buildBom(tplWithLayout), [tplWithLayout]);
  const total = useMemo(() => bomTotal(bom), [bom]);

  const addEquipment = (eq: EquipmentItem) => {
    setCustomLayout((prev) => [
      ...prev,
      { equipmentId: eq.id, position: [0.5 + (prev.length % 4) * 0.5, 0.5, 0.5] },
    ]);
    setSelectedEqId(eq.id);
    setPicker(false);
    notify.success("Оборудование добавлено", eq.name);
  };

  const removeEquipment = (idx: number) => {
    setCustomLayout((prev) => prev.filter((_, i) => i !== idx));
    setSelectedEqId(null);
  };

  const resetLayout = () => {
    setCustomLayout(baseTpl.layout);
    setSelectedEqId(null);
    setLoadedId(null);
    notify.info("Сброс", "Возвращена базовая комплектация");
  };

  const handleMoveEquipment = (eqId: string, newPos: [number, number, number]) => {
    setCustomLayout((prev) => {
      const idx = prev.findIndex((p) => p.equipmentId === eqId);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], position: newPos };
      return next;
    });
  };

  const handleSave = async () => {
    const title = window.prompt(
      loadedId ? "Новое название (пустое — без изменений):" : "Название проекта:",
      loadedId ? "" : `${baseTpl.name} · ${new Date().toLocaleDateString("ru-RU")}`,
    );
    if (title === null) return;
    setSaving(true);
    try {
      const finalTitle = title.trim() || `${baseTpl.name} · ${new Date().toLocaleDateString("ru-RU")}`;
      const payload = {
        title: finalTitle,
        template_id: baseTpl.id,
        layout: customLayout,
        total_price: total,
      };
      const saved = loadedId
        ? await updateEngProject(loadedId, payload)
        : await createEngProject(payload);
      setLoadedId(saved.id);
      const list = await listEngProjects();
      setProjects(list);
      notify.success("Проект сохранён", `«${saved.title}»`);
    } catch (e) {
      notify.error("Не удалось сохранить", e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = async (p: EngProjectDTO) => {
    try {
      const full = await getEngProject(p.id);
      const tplIdx = NODE_TEMPLATES.findIndex((t) => t.id === full.template_id);
      if (tplIdx >= 0) setTplIndex(tplIdx);
      setCustomLayout((full.layout as NodePlacement[]) || []);
      setLoadedId(full.id);
      setProjectsOpen(false);
      setSelectedEqId(null);
      notify.success("Проект загружен", full.title);
    } catch (e) {
      notify.error("Не удалось загрузить", e instanceof Error ? e.message : "Ошибка");
    }
  };

  const handleDelete = async (p: EngProjectDTO) => {
    const ok = await confirmAction(`Удалить «${p.title}»?`);
    if (!ok) return;
    try {
      await deleteEngProject(p.id);
      setProjects((prev) => prev.filter((x) => x.id !== p.id));
      if (loadedId === p.id) setLoadedId(null);
      notify.success("Проект удалён");
    } catch (e) {
      notify.error("Не удалось удалить", e instanceof Error ? e.message : "Ошибка");
    }
  };

  const handlePdf = () => {
    try {
      const sceneImage = canvasRef.current?.toDataURL("image/png");
      exportEngineeringPdf({ template: tplWithLayout, bom, total, sceneImage });
      notify.success("PDF сформирован", "Файл скачан в браузер");
    } catch (e) {
      notify.error("Не удалось создать PDF", e instanceof Error ? e.message : "Ошибка");
    }
  };

  const quoteItems = bom.map((r) => ({
    name: r.item.brand ? `${r.item.brand} ${r.item.name}` : r.item.name,
    quantity: r.quantity,
    price: r.item.price,
  }));

  return (
    <div id="engineering" className="container mx-auto px-4 py-10 max-w-[1400px]">
      <div className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-1">
          Модуль · Инженерные системы
        </p>
        <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2 flex items-center gap-3 flex-wrap">
          <span className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center">
            <Icon name="Settings2" size={22} className="text-primary" />
          </span>
          3D-визуализация инженерных узлов
        </h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Шаблон → 3D с drag-and-drop оборудования → авто-спецификация → PDF и заявка в Telegram.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {NODE_TEMPLATES.map((tpl, i) => (
          <button
            key={tpl.id}
            onClick={() => handleSelectTpl(i)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              i === tplIndex
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-muted-foreground"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  i === tplIndex ? "bg-primary text-primary-foreground" : "bg-secondary"
                }`}
              >
                <Icon name={tpl.icon} size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  {tpl.power}
                </p>
                <p className="font-bold text-foreground">{tpl.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{tpl.purpose}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                3D-модель котельной
                {loadedId && <span className="ml-1 text-primary">· #{loadedId}</span>}
              </p>
              <p className="text-base font-bold text-foreground">
                {baseTpl.name} · {baseTpl.power} · {baseTpl.forArea}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setProjectsOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-foreground flex items-center gap-1.5"
              >
                <Icon name="FolderOpen" size={12} />
                Мои проекты
                {projects.length > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[9px]">
                    {projects.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setEditorOpen((v) => !v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  editorOpen ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                }`}
              >
                <Icon name="Wrench" size={12} />
                {editorOpen ? "Скрыть" : "Редактор"}
              </button>
              <button
                onClick={resetLayout}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-foreground flex items-center gap-1.5"
                title="Вернуть базовую комплектацию"
              >
                <Icon name="RotateCcw" size={12} />
              </button>
            </div>
          </div>

          {editorOpen && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg px-3 py-2 text-xs flex items-center gap-2">
              <Icon name="Move" size={13} className="text-primary" />
              <span className="text-foreground font-medium">
                Режим редактирования: захвати оборудование мышкой и перетащи в нужное место.
              </span>
            </div>
          )}

          <EngineeringScene
            template={tplWithLayout}
            selectedId={selectedEqId}
            onSelect={(id) => setSelectedEqId(id)}
            onMove={editorOpen ? handleMoveEquipment : undefined}
            onCanvasReady={(c) => { canvasRef.current = c; }}
            height={520}
          />

          {selectedEqId && (
            <SelectedEquipmentCard
              item={getEquipment(selectedEqId)!}
              onClose={() => setSelectedEqId(null)}
            />
          )}

          {editorOpen && (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="font-bold text-foreground flex items-center gap-2">
                  <Icon name="LayoutList" size={15} className="text-primary" />
                  Размещение оборудования ({customLayout.length})
                </p>
                <button
                  onClick={() => setPicker(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground flex items-center gap-1.5"
                >
                  <Icon name="Plus" size={12} />
                  Добавить
                </button>
              </div>
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {customLayout.map((p, idx) => {
                  const it = getEquipment(p.equipmentId);
                  if (!it) return null;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                        selectedEqId === it.id ? "bg-primary/10" : "hover:bg-secondary"
                      }`}
                      onClick={() => setSelectedEqId(it.id)}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border border-border"
                        style={{ background: it.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{it.name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {CATEGORY_LABELS[it.category]} · {formatRub(it.price)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeEquipment(idx);
                        }}
                        className="text-muted-foreground hover:text-destructive p-1"
                        aria-label="Удалить"
                      >
                        <Icon name="Trash2" size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-4 self-start">
          <div className="bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/40 rounded-xl p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Итог по проекту
            </p>
            <p className="text-3xl font-black text-primary font-mono mt-1">
              {formatRub(total)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Оборудование + материалы + монтаж
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-secondary text-foreground hover:bg-secondary/80 font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs disabled:opacity-50"
              >
                {saving ? (
                  <Icon name="Loader2" size={12} className="animate-spin" />
                ) : (
                  <Icon name={loadedId ? "Save" : "FilePlus"} size={12} />
                )}
                {loadedId ? "Обновить" : "Сохранить"}
              </button>
              <button
                onClick={handlePdf}
                className="bg-secondary text-foreground hover:bg-secondary/80 font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs"
              >
                <Icon name="FileDown" size={12} />
                PDF
              </button>
            </div>
            <button
              onClick={() => setQuoteOpen(true)}
              className="w-full mt-2 bg-primary text-primary-foreground hover:opacity-90 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm"
            >
              <Icon name="Phone" size={14} />
              Заказать котельную
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-secondary/40 flex items-center gap-2">
              <Icon name="ListChecks" size={14} className="text-primary" />
              <p className="text-xs font-bold uppercase tracking-wider">Номенклатура</p>
            </div>
            <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
              {bom.map((row) => (
                <div
                  key={row.item.id}
                  className={`px-4 py-2.5 cursor-pointer transition-colors ${
                    selectedEqId === row.item.id ? "bg-primary/10" : "hover:bg-secondary/40"
                  }`}
                  onClick={() => setSelectedEqId(row.item.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        {CATEGORY_LABELS[row.item.category]}
                      </p>
                      <p className="text-sm font-bold text-foreground truncate">{row.item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{row.item.specs}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {row.quantity} {row.item.unit}
                      </p>
                      <p className="text-sm font-bold text-foreground">{formatRub(row.total)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {picker && <EquipmentPicker onPick={addEquipment} onClose={() => setPicker(false)} />}
      {projectsOpen && (
        <ProjectsList
          projects={projects}
          loadedId={loadedId}
          onLoad={handleLoad}
          onDelete={handleDelete}
          onClose={() => setProjectsOpen(false)}
        />
      )}
      <QuoteDialog
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        kind="engineering"
        projectTitle={`${baseTpl.name} · ${baseTpl.power}`}
        totalPrice={total}
        items={quoteItems}
      />
    </div>
  );
}

/* ───────── Подкомпоненты ───────── */

function SelectedEquipmentCard({ item, onClose }: { item: EquipmentItem; onClose: () => void }) {
  return (
    <div className="bg-card border-2 border-primary/40 rounded-xl p-4 relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        aria-label="Закрыть"
      >
        <Icon name="X" size={14} />
      </button>
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center border border-border"
          style={{ background: item.color }}
        >
          <Icon name="Package" size={20} className="text-foreground/40" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
            {CATEGORY_LABELS[item.category]} {item.brand && `· ${item.brand}`}
          </p>
          <p className="font-bold text-foreground">{item.name}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-secondary/40 rounded-lg p-2">
              <p className="text-[9px] uppercase font-mono text-muted-foreground">Параметры</p>
              <p className="text-[11px] font-bold">{item.specs}</p>
            </div>
            <div className="bg-secondary/40 rounded-lg p-2">
              <p className="text-[9px] uppercase font-mono text-muted-foreground">Габариты</p>
              <p className="text-[11px] font-bold font-mono">
                {item.size[0]}×{item.size[1]}×{item.size[2]} м
              </p>
            </div>
            <div className="bg-secondary/40 rounded-lg p-2">
              <p className="text-[9px] uppercase font-mono text-muted-foreground">Цена</p>
              <p className="text-[11px] font-bold text-primary">{formatRub(item.price)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EquipmentPicker({
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

function ProjectsList({
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
