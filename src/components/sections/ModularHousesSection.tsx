import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import ModularHouseScene from "@/components/3d/ModularHouseScene";
import QuoteDialog from "@/components/QuoteDialog";
import {
  BLOCK_MODULES,
  BlockModule,
  HOUSE_PROJECTS,
  HousePlacement,
  MODULE_TYPE_LABELS,
  ModularHouseProject,
  calcCustomSpec,
  calcHouseSpec,
  getModule,
} from "@/lib/modular-houses";
import { formatRub } from "@/lib/engineering";
import {
  HouseProjectDTO,
  createHouseProject,
  deleteHouseProject,
  getHouseProject,
  listHouseProjects,
  updateHouseProject,
} from "@/lib/engineering-api";
import { exportHousePdf } from "@/lib/pdf-export";
import { notify, confirmAction } from "@/lib/notify";

type Mode = "catalog" | "constructor";

/**
 * Раздел «Модульные дома»: каталог + конструктор + drag-and-drop +
 * сохранение в БД + PDF + Telegram-заявка.
 */
export default function ModularHousesSection() {
  const [mode, setMode] = useState<Mode>("catalog");
  const [projectIdx, setProjectIdx] = useState(0);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number | null>(null);

  const [customLayout, setCustomLayout] = useState<HousePlacement[]>([]);
  const [picker, setPicker] = useState(false);

  const [savedProjects, setSavedProjects] = useState<HouseProjectDTO[]>([]);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [quoteOpen, setQuoteOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    listHouseProjects().then(setSavedProjects).catch(() => setSavedProjects([]));
  }, []);

  const project = HOUSE_PROJECTS[projectIdx];

  const activeLayout: HousePlacement[] =
    mode === "catalog" ? project.layout : customLayout;
  const activeProject: ModularHouseProject =
    mode === "catalog"
      ? project
      : { ...project, id: "custom", name: "Свой проект", layout: customLayout };

  const spec = useMemo(
    () =>
      mode === "catalog"
        ? calcHouseSpec(project)
        : calcCustomSpec(customLayout),
    [mode, project, customLayout],
  );

  const addModule = (m: BlockModule) => {
    const offsetX = customLayout.length * 3;
    setCustomLayout((prev) => [
      ...prev,
      { moduleId: m.id, position: [offsetX % 12, Math.floor(offsetX / 12) * 6] },
    ]);
    setPicker(false);
    notify.success("Модуль добавлен", m.name);
  };

  const removeModule = (idx: number) => {
    setCustomLayout((prev) => prev.filter((_, i) => i !== idx));
    setSelectedModuleIndex(null);
  };

  const startConstructor = () => {
    setMode("constructor");
    setCustomLayout(project.layout);
    setSelectedModuleIndex(null);
    setLoadedId(null);
  };

  const handleMoveModule = (idx: number, newPos: [number, number]) => {
    if (mode !== "constructor") return;
    setCustomLayout((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], position: newPos };
      return next;
    });
  };

  const handleSave = async () => {
    const defaultTitle =
      mode === "catalog"
        ? `${project.name} · ${new Date().toLocaleDateString("ru-RU")}`
        : `Свой дом ${spec.totalArea} м² · ${new Date().toLocaleDateString("ru-RU")}`;

    const title = window.prompt(
      loadedId ? "Новое название (пустое — без изменений):" : "Название проекта:",
      loadedId ? "" : defaultTitle,
    );
    if (title === null) return;

    setSaving(true);
    try {
      const finalTitle = title.trim() || defaultTitle;
      const layout = mode === "catalog" ? project.layout : customLayout;
      const payload = {
        title: finalTitle,
        base_project_id: mode === "catalog" ? project.id : "custom",
        layout,
        total_area: spec.totalArea,
        grand_total: spec.grandTotal,
      };
      const saved = loadedId
        ? await updateHouseProject(loadedId, payload)
        : await createHouseProject(payload);
      setLoadedId(saved.id);
      const list = await listHouseProjects();
      setSavedProjects(list);
      notify.success("Проект сохранён", `«${saved.title}»`);
    } catch (e) {
      notify.error("Не удалось сохранить", e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = async (p: HouseProjectDTO) => {
    try {
      const full = await getHouseProject(p.id);
      const layout = (full.layout as HousePlacement[]) || [];
      const baseIdx = HOUSE_PROJECTS.findIndex((x) => x.id === full.base_project_id);
      if (baseIdx >= 0 && full.base_project_id !== "custom") {
        setProjectIdx(baseIdx);
        setMode("catalog");
      } else {
        setMode("constructor");
        setCustomLayout(layout);
      }
      setLoadedId(full.id);
      setProjectsOpen(false);
      setSelectedModuleIndex(null);
      notify.success("Проект загружен", full.title);
    } catch (e) {
      notify.error("Не удалось загрузить", e instanceof Error ? e.message : "Ошибка");
    }
  };

  const handleDelete = async (p: HouseProjectDTO) => {
    const ok = await confirmAction(`Удалить «${p.title}»?`);
    if (!ok) return;
    try {
      await deleteHouseProject(p.id);
      setSavedProjects((prev) => prev.filter((x) => x.id !== p.id));
      if (loadedId === p.id) setLoadedId(null);
      notify.success("Проект удалён");
    } catch (e) {
      notify.error("Не удалось удалить", e instanceof Error ? e.message : "Ошибка");
    }
  };

  const handlePdf = () => {
    try {
      const sceneImage = canvasRef.current?.toDataURL("image/png");
      exportHousePdf({ project: activeProject, layout: activeLayout, spec, sceneImage });
      notify.success("PDF сформирован", "Файл скачан в браузер");
    } catch (e) {
      notify.error("Не удалось создать PDF", e instanceof Error ? e.message : "Ошибка");
    }
  };

  const quoteItems = spec.modules.map((r) => ({
    name: r.module.name,
    quantity: r.quantity,
    price: r.module.price,
  }));

  return (
    <div id="modular-houses" className="container mx-auto px-4 py-10 max-w-[1400px]">
      <div className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-1">
          Модуль · Модульное домостроение
        </p>
        <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2 flex items-center gap-3 flex-wrap">
          <span className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center">
            <Icon name="Boxes" size={22} className="text-primary" />
          </span>
          Модульные дома: каталог и конструктор
        </h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          8 готовых проектов от 18 до 141 м² или свой дом из блок-модулей с drag-and-drop, сохранением и сметой «под ключ».
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div className="inline-flex bg-secondary rounded-xl p-1">
          <button
            onClick={() => { setMode("catalog"); setLoadedId(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              mode === "catalog" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
            }`}
          >
            <Icon name="Grid3x3" size={13} />
            Каталог проектов
          </button>
          <button
            onClick={mode === "constructor" ? () => setMode("constructor") : startConstructor}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              mode === "constructor" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
            }`}
          >
            <Icon name="Sparkles" size={13} />
            Конструктор
          </button>
        </div>

        <button
          onClick={() => setProjectsOpen(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-foreground flex items-center gap-1.5"
        >
          <Icon name="FolderOpen" size={12} />
          Мои проекты
          {savedProjects.length > 0 && (
            <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[9px]">
              {savedProjects.length}
            </span>
          )}
        </button>
      </div>

      {mode === "catalog" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
          {HOUSE_PROJECTS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => {
                setProjectIdx(i);
                setSelectedModuleIndex(null);
                setLoadedId(null);
              }}
              className={`text-left p-3 rounded-xl border-2 transition-all ${
                i === projectIdx
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    i === projectIdx ? "bg-primary text-primary-foreground" : "bg-secondary"
                  }`}
                >
                  <Icon name={p.icon} size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {p.area} м² · {p.bedrooms || 0} спален
                  </p>
                </div>
              </div>
              <p className="text-sm font-bold truncate">{p.name}</p>
              <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{p.tagline}</p>
              <p className="text-xs font-bold text-primary font-mono mt-2">
                от {formatRub(p.basePrice)}
              </p>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                3D-сборка дома
                {loadedId && <span className="ml-1 text-primary">· #{loadedId}</span>}
              </p>
              <p className="text-base font-bold text-foreground">
                {activeProject.name}
                {mode === "catalog" && ` · ${project.area} м²`}
                {mode === "constructor" && ` · ${spec.totalArea} м²`}
              </p>
            </div>
            {mode === "constructor" && (
              <button
                onClick={() => setPicker(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground flex items-center gap-1.5"
              >
                <Icon name="Plus" size={12} />
                Добавить модуль
              </button>
            )}
          </div>

          {mode === "constructor" && customLayout.length > 0 && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg px-3 py-2 text-xs flex items-center gap-2">
              <Icon name="Move" size={13} className="text-primary" />
              <span className="text-foreground font-medium">
                Перетаскивай модули мышкой по участку. Шаг сетки — 0.5 м.
              </span>
            </div>
          )}

          {activeLayout.length > 0 ? (
            <ModularHouseScene
              project={activeProject}
              selectedIndex={selectedModuleIndex}
              onSelectModule={setSelectedModuleIndex}
              onMoveModule={mode === "constructor" ? handleMoveModule : undefined}
              onCanvasReady={(c) => { canvasRef.current = c; }}
              height={540}
            />
          ) : (
            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center bg-card">
              <Icon name="Boxes" size={32} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Пустая площадка. Добавь первый модуль.
              </p>
              <button
                onClick={() => setPicker(true)}
                className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-xs"
              >
                Добавить модуль
              </button>
            </div>
          )}

          {selectedModuleIndex !== null && activeLayout[selectedModuleIndex] && (
            <SelectedModuleCard
              module={getModule(activeLayout[selectedModuleIndex].moduleId)!}
              onClose={() => setSelectedModuleIndex(null)}
            />
          )}

          {mode === "catalog" && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm text-foreground leading-relaxed mb-3">{project.description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <Stat icon="Maximize2" label="Площадь" value={`${project.area} м²`} />
                <Stat icon="BedDouble" label="Спален" value={String(project.bedrooms)} />
                <Stat icon="Hammer" label="Сборка" value={`${project.daysToBuild} дн`} />
                <Stat icon="Users" label="Для кого" value={project.forWhom} />
              </div>
            </div>
          )}

          {mode === "constructor" && customLayout.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="font-bold text-foreground flex items-center gap-2 mb-3">
                <Icon name="LayoutList" size={15} className="text-primary" />
                Состав проекта ({customLayout.length} модулей · {spec.totalArea} м²)
              </p>
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {customLayout.map((p, idx) => {
                  const m = getModule(p.moduleId);
                  if (!m) return null;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                        selectedModuleIndex === idx ? "bg-primary/10" : "hover:bg-secondary"
                      }`}
                      onClick={() => setSelectedModuleIndex(idx)}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border border-border"
                        style={{ background: m.color }}
                      />
                      <Icon name={m.icon} size={14} className="text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{m.name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {MODULE_TYPE_LABELS[m.type]} · {m.area} м² · {formatRub(m.price)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeModule(idx);
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
              Стоимость под ключ
            </p>
            <p className="text-3xl font-black text-primary font-mono mt-1">
              {formatRub(spec.grandTotal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <Icon name="Ruler" size={11} />
              {spec.totalArea > 0 && (
                <>≈ {formatRub(Math.round(spec.grandTotal / spec.totalArea))} / м²</>
              )}
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={handleSave}
                disabled={saving || spec.totalArea === 0}
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
                disabled={spec.totalArea === 0}
                className="bg-secondary text-foreground hover:bg-secondary/80 font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs disabled:opacity-50"
              >
                <Icon name="FileDown" size={12} />
                PDF
              </button>
            </div>
            <button
              onClick={() => setQuoteOpen(true)}
              disabled={spec.totalArea === 0}
              className="w-full mt-2 bg-primary text-primary-foreground hover:opacity-90 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <Icon name="Phone" size={14} />
              Заказать дом
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-secondary/40 flex items-center gap-2">
              <Icon name="Receipt" size={14} className="text-primary" />
              <p className="text-xs font-bold uppercase tracking-wider">Структура сметы</p>
            </div>
            <div className="divide-y divide-border">
              <PriceRow label="Модули" value={spec.modulesPrice} icon="Box" />
              <PriceRow label="Доставка и установка" value={spec.delivery} icon="Truck" />
              <PriceRow
                label={`Свайно-винтовой фундамент · ${spec.totalArea} м²`}
                value={spec.foundation}
                icon="Anchor"
              />
              <PriceRow
                label="Подключение коммуникаций"
                value={spec.utilities}
                icon="Plug"
              />
              <div className="px-4 py-3 bg-primary/5 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider">ИТОГО</p>
                <p className="text-base font-black text-primary font-mono">
                  {formatRub(spec.grandTotal)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-secondary/40 flex items-center gap-2">
              <Icon name="Boxes" size={14} className="text-primary" />
              <p className="text-xs font-bold uppercase tracking-wider">Спецификация модулей</p>
            </div>
            <div className="divide-y divide-border max-h-[360px] overflow-y-auto">
              {spec.modules.map((row) => (
                <div key={row.module.id} className="px-4 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        {MODULE_TYPE_LABELS[row.module.type]} · {row.module.area} м²
                      </p>
                      <p className="text-sm font-bold text-foreground truncate">{row.module.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {row.quantity} шт
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

      {picker && <ModulePicker onPick={addModule} onClose={() => setPicker(false)} />}
      {projectsOpen && (
        <SavedProjectsList
          projects={savedProjects}
          loadedId={loadedId}
          onLoad={handleLoad}
          onDelete={handleDelete}
          onClose={() => setProjectsOpen(false)}
        />
      )}
      <QuoteDialog
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        kind="modular_house"
        projectTitle={`${activeProject.name} · ${spec.totalArea} м²`}
        totalPrice={spec.grandTotal}
        items={quoteItems}
      />
    </div>
  );
}

/* ───────── Подкомпоненты ───────── */

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-secondary/40 rounded-lg p-2">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon name={icon} size={11} className="text-primary" />
        <p className="text-[9px] uppercase font-mono text-muted-foreground">{label}</p>
      </div>
      <p className="text-xs font-bold truncate">{value}</p>
    </div>
  );
}

function PriceRow({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="px-4 py-2.5 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Icon name={icon} size={13} className="text-muted-foreground shrink-0" />
        <p className="text-xs text-foreground truncate">{label}</p>
      </div>
      <p className="text-xs font-bold font-mono shrink-0">{formatRub(value)}</p>
    </div>
  );
}

function SelectedModuleCard({ module: m, onClose }: { module: BlockModule; onClose: () => void }) {
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
          style={{ background: m.color }}
        >
          <Icon name={m.icon} size={20} className="text-foreground/60" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
            {MODULE_TYPE_LABELS[m.type]}
          </p>
          <p className="font-bold text-foreground">{m.name}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.description}</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-secondary/40 rounded-lg p-2">
              <p className="text-[9px] uppercase font-mono text-muted-foreground">Габариты</p>
              <p className="text-[11px] font-bold font-mono">
                {m.size[0]}×{m.size[2]} м
              </p>
            </div>
            <div className="bg-secondary/40 rounded-lg p-2">
              <p className="text-[9px] uppercase font-mono text-muted-foreground">Площадь</p>
              <p className="text-[11px] font-bold">{m.area} м²</p>
            </div>
            <div className="bg-secondary/40 rounded-lg p-2">
              <p className="text-[9px] uppercase font-mono text-muted-foreground">Цена</p>
              <p className="text-[11px] font-bold text-primary">{formatRub(m.price)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModulePicker({
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

function SavedProjectsList({
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
