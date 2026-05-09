import { useState } from "react";
import Icon from "@/components/ui/icon";
import {
  HouseSpec,
  HousePlacement,
  ModularHouseProject,
  MODULE_TYPE_LABELS,
} from "@/lib/modular-houses";
import { getHouseFullSpec } from "@/lib/house-specs";
import { formatRub } from "@/lib/engineering";
import FloorPlanSVG from "./FloorPlanSVG";

interface Props {
  project: ModularHouseProject;
  layout: HousePlacement[];
  spec: HouseSpec;
  /** Имя выбранного варианта планировки (для заголовка чертежа) */
  variantName?: string;
}

type Tab = "overview" | "specs" | "drawings" | "package" | "estimate";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Описание", icon: "FileText" },
  { id: "specs", label: "Параметры", icon: "Ruler" },
  { id: "drawings", label: "Чертежи", icon: "PencilRuler" },
  { id: "package", label: "Комплектация", icon: "Package" },
  { id: "estimate", label: "Смета", icon: "Calculator" },
];

/**
 * Подробная информация о проекте: 5 вкладок с описанием, ТТХ, чертежами,
 * комплектацией (входит/не входит), сметой по разделам.
 */
export default function HouseProjectTabs({ project, layout, spec, variantName }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const full = getHouseFullSpec(project);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Tab nav */}
      <div className="flex overflow-x-auto border-b border-border bg-secondary/30">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
              tab === t.id
                ? "border-primary text-primary bg-card"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon name={t.icon} size={13} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "overview" && (
          <OverviewTab project={project} full={full} />
        )}
        {tab === "specs" && (
          <SpecsTab full={full} project={project} />
        )}
        {tab === "drawings" && (
          <DrawingsTab project={project} layout={layout} variantName={variantName} />
        )}
        {tab === "package" && (
          <PackageTab full={full} />
        )}
        {tab === "estimate" && (
          <EstimateTab spec={spec} project={project} />
        )}
      </div>
    </div>
  );
}

/* ────────────── ВКЛАДКА: ОПИСАНИЕ ────────────── */

function OverviewTab({
  project,
  full,
}: {
  project: ModularHouseProject;
  full: ReturnType<typeof getHouseFullSpec>;
}) {
  const stats = [
    { icon: "Maximize2", label: "Площадь", value: `${project.area} м²` },
    { icon: "Building2", label: "Этажей", value: String(full.floors) },
    { icon: "ArrowUpDown", label: "Потолки", value: `${full.ceilingHeight} м` },
    { icon: "BedDouble", label: "Спален", value: String(project.bedrooms) },
    { icon: "Bath", label: "Санузлов", value: String(full.bathrooms) },
    { icon: "Hammer", label: "Сборка", value: `${project.daysToBuild} дн` },
    { icon: "Zap", label: "Энергокласс", value: full.utilities.energyClass },
    { icon: "Shield", label: "Гарантия", value: `${full.warranty.structure} лет` },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-foreground">{project.description}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="bg-secondary/40 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon name={s.icon} size={11} className="text-primary" />
              <p className="text-[9px] uppercase font-mono text-muted-foreground tracking-wider">
                {s.label}
              </p>
            </div>
            <p className="text-sm font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoRow icon="Users" label="Для кого" value={project.forWhom} />
        <InfoRow icon="Tag" label="Цена под ключ" value={`от ${formatRub(project.basePrice)}`} highlight />
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
        <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2">
          <Icon name="Lightbulb" size={13} className="text-primary" />
          Особенности проекта
        </p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          {full.included.slice(0, 5).map((f, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <Icon name="Check" size={11} className="text-primary mt-0.5 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-3 border ${
        highlight ? "bg-primary/10 border-primary/30" : "bg-secondary/40 border-border"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon name={icon} size={12} className={highlight ? "text-primary" : "text-muted-foreground"} />
        <p className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider">{label}</p>
      </div>
      <p className={`text-sm font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

/* ────────────── ВКЛАДКА: ПАРАМЕТРЫ ────────────── */

function SpecsTab({
  full,
  project,
}: {
  full: ReturnType<typeof getHouseFullSpec>;
  project: ModularHouseProject;
}) {
  return (
    <div className="space-y-3">
      <SpecGroup icon="Layers" title="Фундамент">
        <SpecLine label="Тип" value={full.foundation.type} />
        <SpecLine label="Описание" value={full.foundation.description} multiline />
      </SpecGroup>

      <SpecGroup icon="Square" title="Стены">
        <SpecLine label="Конструкция" value={full.walls.construction} multiline />
        <SpecLine label="Толщина" value={`${full.walls.thickness} мм`} />
        <SpecLine label="Утеплитель" value={full.walls.insulation} multiline />
        <SpecLine label="Наружная отделка" value={full.walls.exterior} />
        <SpecLine label="Внутренняя отделка" value={full.walls.interior} />
        <SpecLine label="Шумоизоляция" value={full.walls.soundProofing} />
      </SpecGroup>

      <SpecGroup icon="Triangle" title="Кровля">
        <SpecLine label="Тип" value={full.roof.type} />
        <SpecLine label="Материал" value={full.roof.material} />
        <SpecLine label="Уклон" value={`${full.roof.pitch}°`} />
        <SpecLine label="Утепление" value={full.roof.insulation} />
      </SpecGroup>

      <SpecGroup icon="Square" title="Окна">
        <SpecLine label="Профиль" value={full.windows.profile} />
        <SpecLine label="Стеклопакет" value={full.windows.glazing} multiline />
        <SpecLine label="Кол-во окон" value={`${full.windows.count} шт`} />
        <SpecLine label="Площадь остекления" value={`${full.windows.area} м²`} />
      </SpecGroup>

      <SpecGroup icon="Wrench" title="Инженерные системы">
        <SpecLine label="Отопление" value={full.utilities.heating} multiline />
        <SpecLine label="Электрика" value={full.utilities.electricity} multiline />
        <SpecLine label="Водоснабжение" value={full.utilities.plumbing} multiline />
        <SpecLine label="Вентиляция" value={full.utilities.ventilation} multiline />
        <SpecLine label="Класс энергоэффективности" value={full.utilities.energyClass} />
      </SpecGroup>

      <SpecGroup icon="Shield" title="Гарантия">
        <SpecLine label="Конструктив" value={`${full.warranty.structure} лет`} />
        <SpecLine label="Инженерия" value={`${full.warranty.engineering} лет`} />
        <SpecLine label="Отделка" value={`${full.warranty.finishing} года`} />
      </SpecGroup>

      <SpecGroup icon="Info" title="Прочее">
        <SpecLine label="Этажей" value={String(full.floors)} />
        <SpecLine label="Высота потолков" value={`${full.ceilingHeight} м`} />
        <SpecLine label="Срок строительства" value={`${project.daysToBuild} дней`} />
      </SpecGroup>
    </div>
  );
}

function SpecGroup({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-secondary/40 px-3 py-2 flex items-center gap-2">
        <Icon name={icon} size={13} className="text-primary" />
        <p className="text-xs font-bold uppercase tracking-wider">{title}</p>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function SpecLine({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className={`flex ${multiline ? "flex-col" : "items-center justify-between gap-3"} px-3 py-2 text-xs`}>
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={`font-medium text-foreground ${multiline ? "mt-1" : "text-right"}`}>{value}</span>
    </div>
  );
}

/* ────────────── ВКЛАДКА: ЧЕРТЕЖИ ────────────── */

function DrawingsTab({
  project,
  layout,
  variantName,
}: {
  project: ModularHouseProject;
  layout: HousePlacement[];
  variantName?: string;
}) {
  const variants = project.variants ?? [
    { id: "A", name: "Базовая", description: "", layout: project.layout },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-2.5 text-xs">
        <Icon name="Info" size={13} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <p className="text-blue-900 dark:text-blue-200">
          План этажа в масштабе. Для каждого варианта планировки — свой чертёж.
          Высота потолков — {project.construction === "futuristic" ? "3.0" : "2.7"} м,
          толщина наружных стен — {project.construction === "futuristic" ? "280" : project.construction === "modular" ? "200" : "200"} мм.
        </p>
      </div>

      <FloorPlanSVG
        layout={layout}
        title={`План этажа · вариант ${variantName ?? "A"}`}
        size={480}
      />

      {variants.length > 1 && (
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 mt-4">
            Все варианты планировок
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {variants.map((v) => (
              <FloorPlanSVG
                key={v.id}
                layout={v.layout}
                title={`Вариант ${v.id} · ${v.name}`}
                size={280}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────── ВКЛАДКА: КОМПЛЕКТАЦИЯ ────────────── */

function PackageTab({ full }: { full: ReturnType<typeof getHouseFullSpec> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border-2 border-primary/30 bg-primary/5 rounded-lg p-3">
        <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 text-primary">
          <Icon name="CircleCheck" size={14} />
          Входит в стоимость
        </p>
        <ul className="space-y-1.5">
          {full.included.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              <Icon name="Check" size={12} className="text-primary mt-0.5 shrink-0" />
              <span className="text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-3">
        <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 text-destructive">
          <Icon name="CircleX" size={14} />
          Не входит в стоимость
        </p>
        <ul className="space-y-1.5">
          {full.excluded.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              <Icon name="X" size={12} className="text-destructive mt-0.5 shrink-0" />
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ────────────── ВКЛАДКА: СМЕТА ────────────── */

function EstimateTab({
  spec,
  project,
}: {
  spec: HouseSpec;
  project: ModularHouseProject;
}) {
  const rows = [
    { label: "Модули заводской сборки", value: spec.modulesPrice, hint: `${spec.modules.length} типов модулей` },
    { label: "Доставка и монтаж", value: spec.delivery, hint: "~18% от стоимости модулей" },
    { label: "Свайно-винтовой фундамент", value: spec.foundation, hint: `${spec.totalArea} м² × 4 500 ₽` },
    { label: "Подключение коммуникаций", value: spec.utilities, hint: "Электрика + сантехника + вентиляция" },
  ];

  return (
    <div className="space-y-3">
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-secondary/40 px-3 py-2 flex items-center gap-2">
          <Icon name="Calculator" size={13} className="text-primary" />
          <p className="text-xs font-bold uppercase tracking-wider">Разделы сметы</p>
        </div>
        <div className="divide-y divide-border">
          {rows.map((r) => (
            <div key={r.label} className="px-3 py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">{r.label}</p>
                <p className="text-[10px] font-mono text-muted-foreground">{r.hint}</p>
              </div>
              <p className="text-sm font-bold font-mono whitespace-nowrap">{formatRub(r.value)}</p>
            </div>
          ))}
        </div>
        <div className="bg-primary/10 px-3 py-3 flex items-center justify-between border-t-2 border-primary/30">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Итого под ключ</p>
          <p className="text-lg font-bold font-mono text-primary">{formatRub(spec.grandTotal)}</p>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-secondary/40 px-3 py-2 flex items-center gap-2">
          <Icon name="LayoutList" size={13} className="text-primary" />
          <p className="text-xs font-bold uppercase tracking-wider">
            Спецификация модулей ({spec.modules.length})
          </p>
        </div>
        <div className="divide-y divide-border">
          {spec.modules.map((row) => (
            <div key={row.module.id} className="px-3 py-2 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className="w-3 h-3 rounded shrink-0 border border-border"
                  style={{ background: row.module.color }}
                />
                <div className="min-w-0">
                  <p className="font-medium truncate">{row.module.name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    {MODULE_TYPE_LABELS[row.module.type]} · {row.module.area} м² × {row.quantity}
                  </p>
                </div>
              </div>
              <p className="font-bold font-mono whitespace-nowrap">{formatRub(row.total)}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground italic">
        Цены ориентировочные на 2025–2026 гг., для участка до 200 км от МКАД.
        Базовая комплектация — без декоративной отделки сверх стандарта.
        Точная стоимость рассчитывается после выезда замерщика.
        Базовая цена под ключ для проекта «{project.name}» — от {formatRub(project.basePrice)}.
      </p>
    </div>
  );
}
