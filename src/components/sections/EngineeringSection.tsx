import { useEffect, useMemo, useRef, useState } from "react";
import QuoteDialog from "@/components/QuoteDialog";
import {
  EquipmentItem,
  NODE_TEMPLATES,
  NodePlacement,
  NodeTemplate,
  bomTotal,
  buildBom,
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
import EngHeader from "./engineering/EngHeader";
import EngScenePanel from "./engineering/EngScenePanel";
import EngSidebar from "./engineering/EngSidebar";
import { EquipmentPicker, ProjectsList } from "./engineering/EngModals";
import EquipmentCatalog from "./engineering/EquipmentCatalog";
import EquipmentBuilder from "./engineering/EquipmentBuilder";
import FloorHeatingCalc from "./engineering/FloorHeatingCalc";
import Icon from "@/components/ui/icon";

type EngMode = "templates" | "catalog" | "builder" | "valtec-floor";

/**
 * Раздел «Инженерные узлы»: 3D + drag-and-drop + сохранение в БД + PDF + Telegram-заявка.
 *
 * Композиция четырёх child-компонентов:
 *  - EngHeader      — заголовок-партнёр + SuperGasBanner + сетка шаблонов
 *  - EngScenePanel  — 3D-сцена + тулбар + редактор размещения
 *  - EngSidebar     — итог + кнопки + номенклатура (BOM)
 *  - EngModals      — EquipmentPicker + ProjectsList
 *
 * Логика и поведение 1:1 совпадают с прежней монолитной версией.
 */
export default function EngineeringSection() {
  const [mode, setMode] = useState<EngMode>("templates");
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
      <EngHeader tplIndex={tplIndex} onSelectTpl={handleSelectTpl} />

      {/* Переключатель режимов */}
      <div className="flex flex-wrap gap-2 mb-5 mt-1">
        <ModeButton
          active={mode === "templates"}
          onClick={() => setMode("templates")}
          icon="LayoutGrid"
          label="Готовые узлы"
          hint="6 типовых сборок 3D"
        />
        <ModeButton
          active={mode === "catalog"}
          onClick={() => setMode("catalog")}
          icon="Package"
          label="Каталог"
          hint="Все позиции с фото"
        />
        <ModeButton
          active={mode === "builder"}
          onClick={() => setMode("builder")}
          icon="Hammer"
          label="Конструктор"
          hint="Drag-and-drop сборка"
        />
        <ModeButton
          active={mode === "valtec-floor"}
          onClick={() => setMode("valtec-floor")}
          icon="Thermometer"
          label="Тёплый пол VALTEC"
          hint="Расчёт труб и узла"
        />
      </div>

      {mode === "catalog" && (
        <EquipmentCatalog />
      )}

      {mode === "builder" && (
        <EquipmentBuilder />
      )}

      {mode === "valtec-floor" && (
        <FloorHeatingCalc />
      )}

      {mode === "templates" && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <EngScenePanel
          baseTpl={baseTpl}
          tplWithLayout={tplWithLayout}
          customLayout={customLayout}
          selectedEqId={selectedEqId}
          setSelectedEqId={setSelectedEqId}
          loadedId={loadedId}
          editorOpen={editorOpen}
          setEditorOpen={setEditorOpen}
          setProjectsOpen={setProjectsOpen}
          setPicker={setPicker}
          resetLayout={resetLayout}
          removeEquipment={removeEquipment}
          onMove={handleMoveEquipment}
          onCanvasReady={(c) => { canvasRef.current = c; }}
          projectsCount={projects.length}
        />

        <EngSidebar
          total={total}
          loadedId={loadedId}
          saving={saving}
          bom={bom}
          selectedEqId={selectedEqId}
          setSelectedEqId={setSelectedEqId}
          onSave={handleSave}
          onPdf={handlePdf}
          onOpenQuote={() => setQuoteOpen(true)}
        />
      </div>
      )}

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

/* ────────────── ВНУТРЕННИЙ КОМПОНЕНТ ────────────── */

function ModeButton({
  active,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  hint: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 sm:flex-none flex items-center gap-2.5 px-4 py-2.5 rounded-lg border-2 transition-all ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-md"
          : "bg-card border-border text-foreground hover:border-primary/40"
      }`}
    >
      <Icon name={icon} size={18} className={active ? "" : "text-primary"} />
      <div className="text-left">
        <p className="text-sm font-bold leading-tight">{label}</p>
        <p
          className={`text-[10px] font-mono leading-tight ${
            active ? "text-primary-foreground/80" : "text-muted-foreground"
          }`}
        >
          {hint}
        </p>
      </div>
    </button>
  );
}