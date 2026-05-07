import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  emptyPlan,
  loadFloorPlan,
  planAreaM2,
  planPerimeterM,
  rectRoomPlan,
  saveFloorPlan,
  type CatalogItem,
  type FloorPlan,
} from "@/lib/floorPlan";
import { getLastScan } from "@/lib/scanStore";
import PlanCanvas, { type SelectedRef, type Tool } from "./PlanCanvas";
import PlannerToolbar from "./PlannerToolbar";
import FurnitureCatalog from "./FurnitureCatalog";
import PropertiesPanel from "./PropertiesPanel";

/**
 * Полный редактор плана этажа в стиле Remplanner / Planner5D.
 * - Слева: каталог мебели
 * - В центре: 2D-canvas с панелью инструментов сверху
 * - Справа: свойства выделенного элемента + сводка по плану
 *
 * Все изменения автоматически сохраняются в localStorage.
 */
export default function FloorPlanEditor() {
  const [plan, setPlan] = useState<FloorPlan>(() => loadFloorPlan() || emptyPlan("Мой план"));
  const [tool, setTool] = useState<Tool>("select");
  const [pendingFurn, setPendingFurn] = useState<CatalogItem | null>(null);
  const [selected, setSelected] = useState<SelectedRef | null>(null);
  const [scale, setScale] = useState(0.6); // 1 см = 0.6 пикселя по умолчанию
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // История для Undo
  const historyRef = useRef<FloorPlan[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  // Сохраняем план в localStorage при каждом изменении (с debounce)
  useEffect(() => {
    const t = setTimeout(() => saveFloorPlan(plan), 400);
    return () => clearTimeout(t);
  }, [plan]);

  // Если выбрали мебель — переключаем инструмент в режим размещения
  useEffect(() => {
    if (pendingFurn) setTool("furniture");
    else if (tool === "furniture") setTool("select");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFurn]);

  const handleChange = (next: FloorPlan) => {
    historyRef.current.push(plan);
    if (historyRef.current.length > 50) historyRef.current.shift();
    setCanUndo(true);
    setPlan(next);
  };

  const handleUndo = () => {
    const prev = historyRef.current.pop();
    if (prev) {
      setPlan(prev);
      setCanUndo(historyRef.current.length > 0);
    }
  };

  const zoomIn = () => setScale((s) => Math.min(3, s * 1.2));
  const zoomOut = () => setScale((s) => Math.max(0.1, s / 1.2));
  const zoomFit = () => {
    if (plan.walls.length === 0) {
      setScale(0.6);
      setOffset({ x: 0, y: 0 });
      return;
    }
    const xs = plan.walls.flatMap((w) => [w.a.x, w.b.x]);
    const ys = plan.walls.flatMap((w) => [w.a.y, w.b.y]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const w = maxX - minX, h = maxY - minY;
    if (w === 0 || h === 0) return;
    // подгоняем масштаб под примерно 700×500 пикселей
    const sx = 700 / (w + 200);
    const sy = 500 / (h + 200);
    const newScale = Math.min(sx, sy);
    setScale(newScale);
    setOffset({ x: minX - 100, y: minY - 100 });
  };

  const loadFromScan = () => {
    const s = getLastScan();
    if (!s) {
      alert("Нет сохранённого скана. Сначала отсканируйте комнату на вкладке «Сканирование».");
      return;
    }
    if (!confirm("Создать прямоугольный план из последнего скана? Текущий план будет заменён.")) return;
    const next = rectRoomPlan(s.width, s.length, "План из скана");
    historyRef.current.push(plan);
    setCanUndo(true);
    setPlan(next);
    setSelected(null);
    setTimeout(zoomFit, 50);
  };

  const newRect = (preset: { w: number; h: number; name: string }) => {
    if (plan.walls.length > 0 && !confirm("Заменить текущий план?")) return;
    const next = rectRoomPlan(preset.w, preset.h, preset.name);
    historyRef.current.push(plan);
    setCanUndo(true);
    setPlan(next);
    setSelected(null);
    setTimeout(zoomFit, 50);
  };

  const clearAll = () => {
    if (!confirm("Очистить весь план?")) return;
    historyRef.current.push(plan);
    setCanUndo(true);
    setPlan(emptyPlan(plan.name));
    setSelected(null);
  };

  const exportPlanJson = () => {
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${plan.name.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importPlanJson = () => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "application/json";
    inp.onchange = async () => {
      const file = inp.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text) as FloorPlan;
        if (data?.version !== 1) throw new Error("Несовместимый формат");
        historyRef.current.push(plan);
        setCanUndo(true);
        setPlan(data);
        setTimeout(zoomFit, 50);
      } catch (e) {
        alert("Не удалось загрузить файл: " + (e as Error).message);
      }
    };
    inp.click();
  };

  const stats = useMemo(
    () => ({
      area: planAreaM2(plan),
      perimeter: planPerimeterM(plan),
      walls: plan.walls.length,
      doors: plan.openings.filter((o) => o.kind === "door").length,
      windows: plan.openings.filter((o) => o.kind === "window").length,
      furniture: plan.furniture.length,
    }),
    [plan],
  );

  return (
    <div className="space-y-3">
      {/* Шапка: имя плана и быстрые действия */}
      <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-2 flex-wrap">
        <Icon name="LayoutGrid" size={16} className="text-primary" />
        <input
          value={plan.name}
          onChange={(e) => setPlan({ ...plan, name: e.target.value })}
          className="bg-transparent font-bold text-foreground text-sm focus:outline-none border-b border-transparent hover:border-border focus:border-primary px-1 min-w-[100px]"
        />
        <span className="text-[11px] text-muted-foreground font-mono ml-auto">
          {stats.area.toFixed(1)} м² · {stats.perimeter.toFixed(1)} м периметр
        </span>

        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={loadFromScan}
            title="Создать план из последнего скана"
            className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs px-2.5 py-1.5 rounded-lg"
          >
            <Icon name="ScanLine" size={13} />
            Из скана
          </button>
          <div className="w-px h-5 bg-border mx-0.5" />
          <NewRoomButton onPick={newRect} />
          <button
            onClick={importPlanJson}
            title="Загрузить план из файла"
            className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/70 text-foreground font-bold text-xs px-2.5 py-1.5 rounded-lg"
          >
            <Icon name="Upload" size={13} />
            Импорт
          </button>
          <button
            onClick={exportPlanJson}
            className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/70 text-foreground font-bold text-xs px-2.5 py-1.5 rounded-lg"
          >
            <Icon name="Download" size={13} />
            Экспорт
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive font-bold text-xs px-2.5 py-1.5 rounded-lg"
          >
            <Icon name="Eraser" size={13} />
            Очистить
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-3">
        {/* Левая колонка — каталог */}
        <div className="space-y-3 order-2 lg:order-1">
          <FurnitureCatalog selected={pendingFurn} onSelect={setPendingFurn} />
        </div>

        {/* Центр — холст */}
        <div className="space-y-2 order-1 lg:order-2">
          <PlannerToolbar
            tool={tool}
            onToolChange={(t) => {
              setTool(t);
              if (t !== "furniture") setPendingFurn(null);
            }}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onZoomFit={zoomFit}
            onUndo={handleUndo}
            canUndo={canUndo}
          />

          <div className="h-[60vh] min-h-[460px] bg-white border border-border rounded-xl overflow-hidden">
            <PlanCanvas
              plan={plan}
              onChange={handleChange}
              tool={tool}
              pendingFurniture={pendingFurn}
              selected={selected}
              onSelect={setSelected}
              scale={scale}
              offset={offset}
              onOffsetChange={setOffset}
            />
          </div>

          <Hints tool={tool} />
        </div>

        {/* Правая колонка — свойства + статистика */}
        <div className="space-y-3 order-3">
          <PropertiesPanel
            plan={plan}
            selected={selected}
            onChange={handleChange}
            onDeselect={() => setSelected(null)}
          />

          <div className="bg-card border border-border rounded-xl p-3 space-y-2">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Статистика
            </p>
            <Stat icon="Square" label="Площадь" value={`${stats.area.toFixed(2)} м²`} />
            <Stat icon="Ruler" label="Периметр" value={`${stats.perimeter.toFixed(1)} м`} />
            <Stat icon="Minus" label="Стен" value={`${stats.walls}`} />
            <Stat icon="DoorOpen" label="Дверей" value={`${stats.doors}`} />
            <Stat icon="RectangleHorizontal" label="Окон" value={`${stats.windows}`} />
            <Stat icon="Sofa" label="Объектов мебели" value={`${stats.furniture}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon name={icon} size={13} className="text-primary shrink-0" />
      <span className="text-muted-foreground text-xs flex-1">{label}</span>
      <span className="font-mono font-bold text-foreground">{value}</span>
    </div>
  );
}

function Hints({ tool }: { tool: Tool }) {
  const hints: Record<Tool, string> = {
    select:    "Кликните на элемент чтобы выделить, перетащите чтобы передвинуть. Зажмите Shift+ЛКМ — панорамирование.",
    wall:      "Кликните и тяните чтобы нарисовать стену. Зажмите Shift для ровной горизонтали/вертикали. Привязка к сетке 10 см.",
    door:      "Кликните на стену в нужном месте — там появится дверь шириной 80 см. Можно перетащить вдоль стены.",
    window:    "Кликните на стену в нужном месте — там появится окно шириной 120 см. Можно перетащить вдоль стены.",
    furniture: "Сначала выберите предмет в каталоге слева, потом кликните в нужное место плана.",
    delete:    "Кликните на элемент, чтобы удалить его из плана.",
  };
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 flex items-start gap-2">
      <Icon name="Info" size={13} className="text-primary shrink-0 mt-0.5" />
      <p className="text-[11px] text-foreground leading-relaxed">{hints[tool]}</p>
    </div>
  );
}

function NewRoomButton({ onPick }: { onPick: (preset: { w: number; h: number; name: string }) => void }) {
  const [open, setOpen] = useState(false);
  const presets = [
    { w: 300, h: 400, name: "Маленькая (12 м²)" },
    { w: 400, h: 500, name: "Средняя (20 м²)" },
    { w: 500, h: 700, name: "Большая (35 м²)" },
    { w: 600, h: 1000, name: "Студия (60 м²)" },
  ];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 bg-primary text-primary-foreground hover:opacity-90 font-bold text-xs px-2.5 py-1.5 rounded-lg"
      >
        <Icon name="Plus" size={13} />
        Новый план
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl p-1 z-10 w-52">
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                onPick(p);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-secondary rounded text-xs font-bold text-foreground"
            >
              {p.name}
              <span className="block text-[10px] font-mono text-muted-foreground">
                {p.w} × {p.h} см
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
