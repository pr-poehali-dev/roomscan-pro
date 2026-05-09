import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import EquipmentCatalog from "./EquipmentCatalog";
import EquipmentBuilder2D from "./EquipmentBuilder2D";
import BuilderSummaryPanel from "./BuilderSummaryPanel";
import BuilderProjectsModal from "./BuilderProjectsModal";
import QuoteDialog from "@/components/QuoteDialog";
import { EQUIPMENT, EquipmentItem, formatRub } from "@/lib/engineering";
import {
  BuilderComposition,
  BuilderPlacement,
  emptyComposition,
  findFreeSpot,
  footprint,
  nextUid,
  RoomDimensions,
  summarize,
} from "@/lib/equipment-builder";
import {
  BuilderProjectDTO,
  deleteEngProject,
  getBuilderProject,
  listBuilderProjects,
  saveBuilderProject,
} from "@/lib/engineering-api";
import { notify, confirmAction } from "@/lib/notify";
import { exportEngineeringPdf } from "@/lib/pdf-export";
import {
  EquipmentCategory,
  NodeTemplate,
  CATEGORY_LABELS,
  buildBom,
  bomTotal,
} from "@/lib/engineering";

interface Props {
  /** Стартовая компоновка (например, загруженная из шаблона) */
  initial?: BuilderComposition;
}

/**
 * Drag-and-drop конструктор инженерных узлов.
 * Слева — каталог с фотографиями, по центру — 2D-план,
 * справа — сводка и список элементов.
 *
 * Тулбар сверху: сохранение в БД, мои проекты, очистка, PDF, заявка.
 */
export default function EquipmentBuilder({ initial }: Props) {
  const [composition, setComposition] = useState<BuilderComposition>(
    initial ?? emptyComposition(),
  );
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const [projects, setProjects] = useState<BuilderProjectDTO[]>([]);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);

  const summary = summarize(composition);

  useEffect(() => {
    listBuilderProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  function addItem(item: EquipmentItem) {
    const [w, d] = footprint(item, 0);
    const pos = findFreeSpot(composition, [w, d]);
    const placement: BuilderPlacement = {
      uid: nextUid(),
      equipmentId: item.id,
      position: pos,
      rotation: 0,
    };
    setComposition({
      ...composition,
      placements: [...composition.placements, placement],
      updatedAt: Date.now(),
    });
    setSelectedUid(placement.uid);
  }

  function removeItem(uid: string) {
    setComposition({
      ...composition,
      placements: composition.placements.filter((p) => p.uid !== uid),
      updatedAt: Date.now(),
    });
    if (selectedUid === uid) setSelectedUid(null);
  }

  function changeRoom(room: RoomDimensions) {
    setComposition({ ...composition, room, updatedAt: Date.now() });
  }

  function clearAll() {
    setComposition({ ...composition, placements: [], updatedAt: Date.now() });
    setSelectedUid(null);
    setLoadedId(null);
  }

  /* ────── Сохранение / загрузка ────── */

  async function handleSave() {
    if (composition.placements.length === 0) {
      notify.warn("Нечего сохранять", "Добавьте оборудование на план");
      return;
    }
    const title = window.prompt(
      loadedId ? "Новое название (пустое — оставить как есть):" : "Название сборки:",
      loadedId ? "" : composition.name,
    );
    if (title === null) return;
    const finalTitle = title.trim() || composition.name;

    setSaving(true);
    try {
      const updated: BuilderComposition = { ...composition, name: finalTitle };
      const saved = await saveBuilderProject(updated, summary.totalPrice, loadedId ?? undefined);
      setLoadedId(saved.id);
      setComposition(updated);
      const list = await listBuilderProjects();
      setProjects(list);
      notify.success("Сборка сохранена", `«${saved.title}»`);
    } catch (e) {
      notify.error("Не удалось сохранить", e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  async function handleLoad(p: BuilderProjectDTO) {
    try {
      const full = await getBuilderProject(p.id);
      if (full.composition) {
        setComposition(full.composition);
        setLoadedId(full.id);
        setSelectedUid(null);
        setProjectsOpen(false);
        notify.success("Сборка загружена", full.title);
      } else {
        notify.error("Сборка повреждена", "Невозможно восстановить компоновку");
      }
    } catch (e) {
      notify.error("Не удалось загрузить", e instanceof Error ? e.message : "Ошибка");
    }
  }

  async function handleDelete(p: BuilderProjectDTO) {
    const ok = await confirmAction(`Удалить сборку «${p.title}»?`);
    if (!ok) return;
    try {
      await deleteEngProject(p.id);
      setProjects((prev) => prev.filter((x) => x.id !== p.id));
      if (loadedId === p.id) setLoadedId(null);
      notify.success("Сборка удалена");
    } catch (e) {
      notify.error("Не удалось удалить", e instanceof Error ? e.message : "Ошибка");
    }
  }

  /* ────── PDF и заявка ────── */

  function handlePdf() {
    if (composition.placements.length === 0) {
      notify.warn("Нечего экспортировать", "Добавьте оборудование на план");
      return;
    }
    try {
      // Конвертируем композицию в формат NodeTemplate для существующего экспорта
      const tpl: NodeTemplate = {
        id: `builder-${composition.id}`,
        name: composition.name,
        purpose: "Пользовательская сборка из конструктора",
        forArea: `${composition.room.width.toFixed(1)} × ${composition.room.depth.toFixed(1)} м`,
        power: summary.totalPower > 0 ? `${summary.totalPower} кВт` : "—",
        roomSize: [composition.room.width, composition.room.height, composition.room.depth],
        layout: composition.placements.map((p) => ({
          equipmentId: p.equipmentId,
          position: [p.position[0], 0, p.position[1]] as [number, number, number],
        })),
        icon: "Hammer",
      };
      const bom = buildBom(tpl);
      const total = bomTotal(bom);
      exportEngineeringPdf({ template: tpl, bom, total, title: composition.name });
      notify.success("PDF сформирован", "Файл скачан в браузер");
    } catch (e) {
      notify.error("Не удалось создать PDF", e instanceof Error ? e.message : "Ошибка");
    }
  }

  const quoteItems = composition.placements
    .map((p) => {
      const item = EQUIPMENT.find((e) => e.id === p.equipmentId);
      if (!item) return null;
      return {
        name: item.brand ? `${item.brand} ${item.name}` : item.name,
        quantity: 1,
        price: item.price,
      };
    })
    .filter((x): x is { name: string; quantity: number; price: number } => !!x);

  /* ────── Категорий статистика для тулбара ────── */
  const categoryCounts = composition.placements.reduce<Record<string, number>>((acc, p) => {
    const item = EQUIPMENT.find((e) => e.id === p.equipmentId);
    if (item) acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {/* Лента-инструкция */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Icon name="Hammer" size={16} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold mb-0.5">
            Конструктор инженерного помещения
            {loadedId && (
              <span className="ml-2 text-[10px] font-mono uppercase text-primary">
                · загружено #{loadedId}
              </span>
            )}
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Перетаскивайте оборудование из каталога на план тех. помещения. Двигайте, поворачивайте, удаляйте — справа автоматически считается стоимость и появляются рекомендации по составу.
          </p>
        </div>
      </div>

      {/* Тулбар */}
      <div className="bg-card border border-border rounded-xl p-2.5 flex flex-wrap items-center gap-2">
        <ToolButton
          icon="Save"
          label={loadedId ? "Обновить" : "Сохранить"}
          onClick={handleSave}
          loading={saving}
          primary
          disabled={composition.placements.length === 0}
        />
        <ToolButton
          icon="FolderOpen"
          label={`Мои сборки${projects.length > 0 ? ` · ${projects.length}` : ""}`}
          onClick={() => setProjectsOpen(true)}
        />
        <ToolButton
          icon="FileText"
          label="PDF"
          onClick={handlePdf}
          disabled={composition.placements.length === 0}
        />
        <ToolButton
          icon="Send"
          label="Заявка"
          onClick={() => setQuoteOpen(true)}
          disabled={composition.placements.length === 0}
        />
        <div className="flex-1" />
        <ToolButton
          icon="FilePlus"
          label="Новая"
          onClick={() => {
            setComposition(emptyComposition());
            setLoadedId(null);
            setSelectedUid(null);
          }}
        />
        {composition.placements.length > 0 && (
          <ToolButton
            icon="Trash2"
            label="Очистить"
            onClick={clearAll}
            danger
          />
        )}
      </div>

      {/* Категорийная статистика */}
      {composition.placements.length > 0 && (
        <div className="bg-card border border-border rounded-xl px-3 py-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider mr-1">
            Состав:
          </span>
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <span
              key={cat}
              className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-foreground font-medium"
            >
              {CATEGORY_LABELS[cat as EquipmentCategory]} · {count}
            </span>
          ))}
          <div className="flex-1" />
          <span className="text-[11px] font-mono">
            <span className="text-muted-foreground">Итого:</span>{" "}
            <span className="font-bold text-primary">{formatRub(summary.totalPrice)}</span>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Каталог слева */}
        <div className="lg:col-span-4">
          <EquipmentCatalog onAdd={addItem} onDragStart={() => {}} compact />
        </div>

        {/* 2D-план по центру */}
        <div className="lg:col-span-5 space-y-3">
          <EquipmentBuilder2D
            composition={composition}
            onChange={setComposition}
            selectedUid={selectedUid}
            onSelect={setSelectedUid}
            height={540}
          />
        </div>

        {/* Сводка справа */}
        <div className="lg:col-span-3">
          <BuilderSummaryPanel
            composition={composition}
            selectedUid={selectedUid}
            onSelect={setSelectedUid}
            onRemove={removeItem}
            onChangeRoom={changeRoom}
            onClear={clearAll}
          />
        </div>
      </div>

      {projectsOpen && (
        <BuilderProjectsModal
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
        projectTitle={`Конструктор · ${composition.name}`}
        totalPrice={summary.totalPrice}
        items={quoteItems}
      />
    </div>
  );
}

/* ────────────── ТУЛБАР-КНОПКА ────────────── */

function ToolButton({
  icon,
  label,
  onClick,
  loading,
  primary,
  danger,
  disabled,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  loading?: boolean;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  const base =
    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all border";
  const variant = disabled
    ? "bg-secondary border-border text-muted-foreground cursor-not-allowed opacity-50"
    : primary
      ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
      : danger
        ? "bg-card border-destructive/30 text-destructive hover:bg-destructive/10"
        : "bg-card border-border text-foreground hover:border-primary/40 hover:text-primary";
  return (
    <button onClick={onClick} disabled={disabled || loading} className={`${base} ${variant}`}>
      <Icon name={loading ? "Loader2" : icon} size={13} className={loading ? "animate-spin" : ""} />
      {label}
    </button>
  );
}