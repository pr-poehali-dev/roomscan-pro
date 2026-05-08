import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import ModularHouseScene from "@/components/3d/ModularHouseScene";
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
import { notify } from "@/lib/notify";

type Mode = "catalog" | "constructor";

/**
 * Раздел «Модульные дома».
 * Каталог готовых проектов + конструктор из блок-модулей.
 * 3D-визуализация сборки + автоматическая смета «под ключ».
 */
export default function ModularHousesSection() {
  const [mode, setMode] = useState<Mode>("catalog");
  const [projectIdx, setProjectIdx] = useState(0);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number | null>(null);

  // Состояние конструктора
  const [customLayout, setCustomLayout] = useState<HousePlacement[]>([]);
  const [picker, setPicker] = useState(false);

  const project = HOUSE_PROJECTS[projectIdx];

  // Активный layout зависит от режима
  const activeLayout: HousePlacement[] =
    mode === "catalog" ? project.layout : customLayout;
  const activeProject: ModularHouseProject =
    mode === "catalog"
      ? project
      : {
          ...project,
          id: "custom",
          name: "Свой проект",
          layout: customLayout,
        };

  const spec = useMemo(
    () =>
      mode === "catalog"
        ? calcHouseSpec(project)
        : calcCustomSpec(customLayout),
    [mode, project, customLayout],
  );

  const addModule = (m: BlockModule) => {
    // Автоматически смещаем новый модуль в свободное место
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
  };

  return (
    <div id="modular-houses" className="container mx-auto px-4 py-10 max-w-[1400px]">
      {/* Заголовок */}
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
          8 готовых проектов от 18 до 141 м² — выбираешь, крутишь 3D и получаешь смету.
          Или собираешь свой дом из блок-модулей как Lego: жилой блок, кухня, санузел, терраса.
        </p>
      </div>

      {/* Переключатель режима */}
      <div className="inline-flex bg-secondary rounded-xl p-1 mb-5">
        <button
          onClick={() => setMode("catalog")}
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

      {/* Каталог проектов */}
      {mode === "catalog" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
          {HOUSE_PROJECTS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => {
                setProjectIdx(i);
                setSelectedModuleIndex(null);
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
        {/* 3D-сцена */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                3D-сборка дома
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

          {activeLayout.length > 0 ? (
            <ModularHouseScene
              project={activeProject}
              selectedIndex={selectedModuleIndex}
              onSelectModule={setSelectedModuleIndex}
              height={540}
            />
          ) : (
            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center bg-card">
              <Icon name="Boxes" size={32} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Пустая площадка. Добавьте первый модуль, чтобы начать сборку.
              </p>
              <button
                onClick={() => setPicker(true)}
                className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-xs"
              >
                Добавить модуль
              </button>
            </div>
          )}

          {/* Описание выбранного модуля */}
          {selectedModuleIndex !== null && activeLayout[selectedModuleIndex] && (
            <SelectedModuleCard
              module={getModule(activeLayout[selectedModuleIndex].moduleId)!}
              onClose={() => setSelectedModuleIndex(null)}
            />
          )}

          {/* Описание проекта (только в режиме каталога) */}
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

          {/* Конструктор: список модулей */}
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

        {/* Смета «под ключ» */}
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
            <button
              onClick={() => notify.success("Заявка отправлена", "Менеджер свяжется в течение часа")}
              className="w-full mt-3 bg-primary text-primary-foreground hover:opacity-90 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm"
            >
              <Icon name="Phone" size={14} />
              Заказать расчёт
            </button>
          </div>

          {/* Структура цены */}
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

          {/* Состав модулей */}
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

function PriceRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
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
