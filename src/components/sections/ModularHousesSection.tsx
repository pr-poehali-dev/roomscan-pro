import { useEffect, useMemo, useRef, useState } from "react";
import QuoteDialog from "@/components/QuoteDialog";
import {
  BlockModule,
  HOUSE_PROJECTS,
  HousePlacement,
  ModularHouseProject,
  calcCustomSpec,
  calcHouseSpec,
} from "@/lib/modular-houses";
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
import HousesHeader from "./modular-houses/HousesHeader";
import HousesCatalogGrid from "./modular-houses/HousesCatalogGrid";
import HousesScenePanel from "./modular-houses/HousesScenePanel";
import HousesSidebar from "./modular-houses/HousesSidebar";
import { ModulePicker, SavedProjectsList } from "./modular-houses/HousesModals";

type Mode = "catalog" | "constructor";

/**
 * Раздел «Модульные дома»: каталог + конструктор + drag-and-drop +
 * сохранение в БД + PDF + Telegram-заявка.
 *
 * Композиция четырёх child-компонентов:
 *  - HousesHeader       — шапка + переключатель режимов + «Мои проекты»
 *  - HousesCatalogGrid  — сетка готовых проектов (только в режиме catalog)
 *  - HousesScenePanel   — 3D-сцена + описание + список модулей
 *  - HousesSidebar      — цена, действия, смета, спецификация
 *  - HousesModals       — ModulePicker + SavedProjectsList
 *
 * Логика и поведение 1:1 совпадают с прежней монолитной версией.
 */
export default function ModularHousesSection() {
  const [mode, setMode] = useState<Mode>("catalog");
  const [projectIdx, setProjectIdx] = useState(0);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number | null>(null);
  /** ID выбранного варианта планировки (A / B / C). Меняется при смене проекта. */
  const [variantId, setVariantId] = useState<string>("A");

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

  /** Текущий выбранный вариант планировки (или базовый layout, если вариантов нет) */
  const currentVariant = useMemo(() => {
    if (!project.variants || project.variants.length === 0) return null;
    return project.variants.find((v) => v.id === variantId) ?? project.variants[0];
  }, [project, variantId]);

  /** layout для каталога с учётом выбранного варианта */
  const catalogLayout: HousePlacement[] = currentVariant
    ? currentVariant.layout
    : project.layout;

  const activeLayout: HousePlacement[] =
    mode === "catalog" ? catalogLayout : customLayout;
  const activeProject: ModularHouseProject =
    mode === "catalog"
      ? { ...project, layout: catalogLayout }
      : { ...project, id: "custom", name: "Свой проект", layout: customLayout };

  const spec = useMemo(
    () =>
      mode === "catalog"
        ? calcHouseSpec({ ...project, layout: catalogLayout })
        : calcCustomSpec(customLayout),
    [mode, project, catalogLayout, customLayout],
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
    setCustomLayout(catalogLayout);
    setSelectedModuleIndex(null);
    setLoadedId(null);
  };

  /** Сменить проект каталога — сбросить вариант на A */
  const handleSelectProject = (i: number) => {
    setProjectIdx(i);
    setVariantId("A");
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
      const layout = mode === "catalog" ? catalogLayout : customLayout;
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
      <HousesHeader
        mode={mode}
        setMode={setMode}
        setLoadedId={setLoadedId}
        startConstructor={startConstructor}
        savedProjectsCount={savedProjects.length}
        onOpenSavedProjects={() => setProjectsOpen(true)}
      />

      {mode === "catalog" && (
        <HousesCatalogGrid
          projectIdx={projectIdx}
          setProjectIdx={handleSelectProject}
          setSelectedModuleIndex={setSelectedModuleIndex}
          setLoadedId={setLoadedId}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <HousesScenePanel
          mode={mode}
          loadedId={loadedId}
          activeProject={activeProject}
          project={project}
          spec={spec}
          activeLayout={activeLayout}
          customLayout={customLayout}
          selectedModuleIndex={selectedModuleIndex}
          setSelectedModuleIndex={setSelectedModuleIndex}
          onMoveModule={handleMoveModule}
          onCanvasReady={(c) => { canvasRef.current = c; }}
          setPicker={setPicker}
          removeModule={removeModule}
          variantId={variantId}
          onSelectVariant={setVariantId}
        />

        <HousesSidebar
          spec={spec}
          loadedId={loadedId}
          saving={saving}
          onSave={handleSave}
          onPdf={handlePdf}
          onOpenQuote={() => setQuoteOpen(true)}
        />
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