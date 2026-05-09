import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import {
  HousePlacement,
  ModularHouseProject,
} from "@/lib/modular-houses";
import { exportBlueprintsPdf } from "@/lib/blueprints-pdf";
import FloorPlanSVG from "./FloorPlanSVG";
import HouseFacadeSVG from "./HouseFacadeSVG";
import HouseSectionSVG from "./HouseSectionSVG";

interface Props {
  project: ModularHouseProject;
  layout: HousePlacement[];
  variantName?: string;
}

type View = "plan" | "front" | "side" | "section";

const VIEWS: { id: View; label: string; icon: string; ru: string }[] = [
  { id: "plan", label: "План", icon: "Grid3x3", ru: "План этажа" },
  { id: "front", label: "Фасад", icon: "Building2", ru: "Главный фасад" },
  { id: "side", label: "Боковой", icon: "PanelRight", ru: "Боковой фасад" },
  { id: "section", label: "Разрез", icon: "Slice", ru: "Продольный разрез" },
];

/**
 * Галерея архитектурных чертежей: план, фасады, разрез.
 * Сверху — переключатель видов; снизу — кнопка скачивания SVG.
 */
export default function BlueprintsGallery({ project, layout, variantName }: Props) {
  const [view, setView] = useState<View>("plan");
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLDivElement>(null);

  const variants = project.variants ?? [
    { id: "A", name: "Базовая", description: "", layout: project.layout },
  ];

  function downloadCurrent() {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) {
      toast.error("Не удалось найти чертёж");
      return;
    }
    try {
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      const serialized = new XMLSerializer().serializeToString(clone);
      const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const viewLabel = VIEWS.find((v) => v.id === view)?.label ?? "drawing";
      a.href = url;
      a.download = `${project.id}_${viewLabel}_${variantName ?? "A"}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Чертёж сохранён", { description: "Файл скачан в браузер" });
    } catch (e) {
      toast.error("Ошибка экспорта", {
        description: e instanceof Error ? e.message : "Не удалось сохранить",
      });
    }
  }

  async function downloadPdfSet() {
    if (!hiddenRef.current) return;
    setIsExporting(true);
    toast.info("Готовлю PDF-комплект…", { description: "Это займёт пару секунд" });
    try {
      const wraps = hiddenRef.current.querySelectorAll<HTMLDivElement>("[data-bp-wrap]");
      const svgs: { title: string; el: SVGSVGElement }[] = [];
      wraps.forEach((w) => {
        const svg = w.querySelector("svg");
        if (svg) {
          svgs.push({
            title: w.getAttribute("data-bp-title") || "Drawing",
            el: svg as SVGSVGElement,
          });
        }
      });
      if (svgs.length === 0) {
        toast.error("Не удалось найти чертежи");
        setIsExporting(false);
        return;
      }
      await exportBlueprintsPdf({ project, layout, variantName, svgs });
      toast.success("PDF готов", { description: "Файл скачан в браузер" });
    } catch (e) {
      toast.error("Не удалось собрать PDF", {
        description: e instanceof Error ? e.message : "Попробуйте ещё раз",
      });
    } finally {
      setIsExporting(false);
    }
  }

  const currentLabel = VIEWS.find((v) => v.id === view)?.ru ?? "Чертёж";

  return (
    <div className="space-y-3 relative">
      {/* Переключатель видов */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-secondary/40 rounded-lg">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-md transition-all ${
              view === v.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
          >
            <Icon name={v.icon} size={12} />
            {v.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={downloadCurrent}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-md bg-card border border-border text-foreground hover:border-primary/40 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          title="Скачать текущий чертёж в формате SVG"
        >
          <Icon name="Download" size={12} />
          SVG
        </button>
        <button
          onClick={downloadPdfSet}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-md bg-foreground text-background hover:bg-foreground/85 transition-colors disabled:opacity-50 disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          title="Скачать комплект всех чертежей в одном PDF"
        >
          <Icon name={isExporting ? "Loader" : "FileDown"} size={12} className={isExporting ? "animate-spin" : ""} />
          PDF комплект
        </button>
      </div>

      {/* Заголовок-штамп */}
      <div className="bg-card border border-border rounded-lg px-3 py-2 flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {project.name} · {variantName ? `вариант ${variantName}` : "вариант A"}
          </p>
          <p className="text-sm font-bold">{currentLabel}</p>
        </div>
        <div className="text-right text-[10px] font-mono text-muted-foreground">
          <div>М 1:100</div>
          <div>{project.area} м²</div>
        </div>
      </div>

      {/* Сам чертёж */}
      <div ref={containerRef} className="min-h-[320px]" data-blueprint-export>
        {view === "plan" && (
          <FloorPlanSVG
            layout={layout}
            title={`План этажа · вариант ${variantName ?? "A"}`}
            size={520}
          />
        )}
        {view === "front" && (
          <HouseFacadeSVG
            project={project}
            layout={layout}
            side="front"
            size={560}
            title="Фасад главный"
            svgId="facade-front"
          />
        )}
        {view === "side" && (
          <HouseFacadeSVG
            project={project}
            layout={layout}
            side="side"
            size={560}
            title="Фасад боковой"
            svgId="facade-side"
          />
        )}
        {view === "section" && (
          <HouseSectionSVG
            project={project}
            layout={layout}
            size={560}
            title="Продольный разрез 1—1"
            svgId="house-section"
          />
        )}
      </div>

      {/* Условные обозначения */}
      <div className="bg-secondary/30 rounded-lg p-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
          Условные обозначения
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <Legend color="#fde7c2" label="Жилая" />
          <Legend color="#ffd9b3" label="Кухня" />
          <Legend color="#cfe5f0" label="Санузел" />
          <Legend color="#dcdfe3" label="Технич." />
          <Legend color="#e6dccd" label="Прихожая" />
          <Legend color="#d6c5a8" label="Терраса" dashed />
          <Legend color="#86b4d3" label="Окна" />
          <Legend color="#fbe7a7" label="Утеплитель" />
        </div>
      </div>

      {/* Скрытый контейнер для PDF-сборки: все 4 вида одновременно */}
      <div
        ref={hiddenRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-99999px",
          top: 0,
          width: 1200,
          pointerEvents: "none",
        }}
      >
        <div data-bp-wrap data-bp-title="PLAN — FLOOR LAYOUT" style={{ width: 1200 }}>
          <FloorPlanSVG
            layout={layout}
            title={`План этажа · вариант ${variantName ?? "A"}`}
            size={1100}
          />
        </div>
        <div data-bp-wrap data-bp-title="ELEVATION — FRONT" style={{ width: 1200 }}>
          <HouseFacadeSVG
            project={project}
            layout={layout}
            side="front"
            size={1100}
            title="Фасад главный"
            svgId="bp-front"
          />
        </div>
        <div data-bp-wrap data-bp-title="ELEVATION — SIDE" style={{ width: 1200 }}>
          <HouseFacadeSVG
            project={project}
            layout={layout}
            side="side"
            size={1100}
            title="Фасад боковой"
            svgId="bp-side"
          />
        </div>
        <div data-bp-wrap data-bp-title="SECTION 1—1" style={{ width: 1200 }}>
          <HouseSectionSVG
            project={project}
            layout={layout}
            size={1100}
            title="Продольный разрез 1—1"
            svgId="bp-section"
          />
        </div>
      </div>

      {variants.length > 1 && (
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Все варианты планировок (вид сверху)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {variants.map((v) => (
              <FloorPlanSVG
                key={v.id}
                layout={v.layout}
                title={`Вариант ${v.id} · ${v.name}`}
                size={260}
              />
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground italic px-1">
        Чертежи носят ознакомительный характер. Точные размеры, узлы и спецификации предоставляются в комплекте рабочей документации после заключения договора.
      </p>
    </div>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-3 h-3 rounded-sm border border-foreground/40"
        style={{
          background: color,
          borderStyle: dashed ? "dashed" : "solid",
        }}
      />
      <span className="text-foreground">{label}</span>
    </div>
  );
}