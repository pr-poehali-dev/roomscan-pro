import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import EngineeringScene from "@/components/3d/EngineeringScene";
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
import { notify } from "@/lib/notify";

/**
 * Раздел «Инженерные узлы».
 * 3D-визуализация котельной + конструктор оборудования + автоматическая спецификация (BOM).
 */
export default function EngineeringSection() {
  const [tplIndex, setTplIndex] = useState(0);
  const baseTpl = NODE_TEMPLATES[tplIndex];

  // Кастомная раскладка для конструктора (изначально из шаблона)
  const [customLayout, setCustomLayout] = useState<NodePlacement[]>(() => baseTpl.layout);
  const [selectedEqId, setSelectedEqId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [picker, setPicker] = useState(false);

  // Пересборка при смене шаблона
  const handleSelectTpl = (i: number) => {
    setTplIndex(i);
    setCustomLayout(NODE_TEMPLATES[i].layout);
    setSelectedEqId(null);
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
    notify.info("Сброс", "Возвращена базовая комплектация шаблона");
  };

  return (
    <div id="engineering" className="container mx-auto px-4 py-10 max-w-[1400px]">
      {/* Заголовок */}
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
          Выбираешь шаблон котельной → крутишь 3D-модель → редактируешь оборудование →
          получаешь готовую спецификацию с номенклатурой, артикулами и точной сметой.
        </p>
      </div>

      {/* Шаблоны */}
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
        {/* 3D-сцена */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                3D-модель котельной
              </p>
              <p className="text-base font-bold text-foreground">
                {baseTpl.name} · {baseTpl.power} · {baseTpl.forArea}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditorOpen((v) => !v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  editorOpen ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                }`}
              >
                <Icon name="Wrench" size={12} />
                {editorOpen ? "Скрыть редактор" : "Редактировать"}
              </button>
              <button
                onClick={resetLayout}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-foreground flex items-center gap-1.5"
              >
                <Icon name="RotateCcw" size={12} />
                Сброс
              </button>
            </div>
          </div>

          <EngineeringScene
            template={tplWithLayout}
            selectedId={selectedEqId}
            onSelect={(id) => setSelectedEqId(id)}
            height={520}
          />

          {/* Информация о выбранном элементе */}
          {selectedEqId && (
            <SelectedEquipmentCard
              item={getEquipment(selectedEqId)!}
              onClose={() => setSelectedEqId(null)}
            />
          )}

          {/* Конструктор: список размещённых элементов */}
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
                  Добавить оборудование
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

        {/* BOM-панель: спецификация */}
        <aside className="space-y-3 lg:sticky lg:top-4 self-start">
          <div className="bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/40 rounded-xl p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Итог по проекту
            </p>
            <p className="text-3xl font-black text-primary font-mono mt-1">
              {formatRub(total)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Оборудование + материалы + монтаж под ключ
            </p>
            <button
              onClick={() => notify.success("PDF готовится", "Спецификация будет отправлена на email")}
              className="w-full mt-3 bg-primary text-primary-foreground hover:opacity-90 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm"
            >
              <Icon name="FileDown" size={14} />
              Скачать спецификацию PDF
            </button>
          </div>

          {/* Таблица BOM */}
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

      {/* Picker оборудования */}
      {picker && <EquipmentPicker onPick={addEquipment} onClose={() => setPicker(false)} />}
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
    if (e.size[0] === 0) return false; // не показываем работы и трубопроводы
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
