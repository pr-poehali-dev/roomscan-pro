import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { EQUIPMENT, formatRub } from "@/lib/engineering";

/**
 * Калькулятор водяного тёплого пола VALTEC.
 *
 * Что считает:
 *  - метраж трубы PEX-EVOH 16×2 (с учётом шага укладки и теплопотерь)
 *  - количество контуров (каждый ≤ 100 м, чтобы избежать большого гидравлического сопротивления)
 *  - размер коллектора (число выходов = число контуров)
 *  - расчёт смесительного узла Combimix
 *  - запас 10–15% на повороты, фитинги и подвод к коллектору
 *  - суммарная стоимость материалов VALTEC
 *
 * Алгоритм — стандарт VALTEC из их каталога 2024 г.
 */

type Step = 100 | 150 | 200 | 250 | 300;
type RoomType = "living" | "bath" | "kitchen" | "entrance";

interface Section {
  id: string;
  name: string;
  area: number;
  step: Step;
  type: RoomType;
}

const STEPS: { value: Step; label: string; hint: string }[] = [
  { value: 100, label: "10 см", hint: "Ванная, влажные зоны" },
  { value: 150, label: "15 см", hint: "Стандарт, гостиная" },
  { value: 200, label: "20 см", hint: "Спальня, кабинет" },
  { value: 250, label: "25 см", hint: "Зоны с малой нагрузкой" },
  { value: 300, label: "30 см", hint: "Эконом, теплоизоляция" },
];

const ROOM_TYPES: { value: RoomType; label: string; icon: string }[] = [
  { value: "living", label: "Гостиная", icon: "Sofa" },
  { value: "bath", label: "Ванная", icon: "Bath" },
  { value: "kitchen", label: "Кухня", icon: "ChefHat" },
  { value: "entrance", label: "Прихожая", icon: "DoorOpen" },
];

/** Максимальная длина одного контура (рекомендация VALTEC) — 100 м. */
const MAX_LOOP = 100;
/** Запас на повороты, фитинги, подводку. */
const RESERVE = 1.12;

function pipePerSqm(step: Step): number {
  // 1 м² → метров трубы при шаге S мм:  L = 1 / (S / 1000) = 1000 / S
  // Плюс ~5% на повороты у стен.
  return (1000 / step) * 1.05;
}

export default function FloorHeatingCalc() {
  const [sections, setSections] = useState<Section[]>([
    { id: "s1", name: "Гостиная", area: 22, step: 150, type: "living" },
    { id: "s2", name: "Ванная", area: 6, step: 100, type: "bath" },
  ]);

  /* ── Расчёт ── */
  const calc = useMemo(() => {
    let totalArea = 0;
    let totalPipe = 0;
    const loops: number[] = [];

    for (const s of sections) {
      totalArea += s.area;
      const len = s.area * pipePerSqm(s.step);
      // Если длина > 100 м — делим на несколько контуров.
      const numLoops = Math.max(1, Math.ceil(len / MAX_LOOP));
      for (let i = 0; i < numLoops; i++) {
        loops.push(len / numLoops);
      }
      totalPipe += len;
    }

    const pipeWithReserve = Math.ceil(totalPipe * RESERVE);
    const numLoops = loops.length;
    // Стандартная гребёнка — 2-12 выходов. Округляем вверх до чётного.
    const manifoldOutputs = Math.max(2, Math.min(12, numLoops));

    // — Цены из каталога VALTEC —
    const pexEvoh = EQUIPMENT.find((e) => e.id === "valtec-pex-evoh-16")!;
    const combimix = EQUIPMENT.find((e) => e.id === "valtec-combimix")!;
    const manifold = EQUIPMENT.find((e) => e.id === "valtec-manifold-7")!;
    const cabinet = EQUIPMENT.find((e) => e.id === "valtec-manifold-cabinet")!;
    const ballValve = EQUIPMENT.find((e) => e.id === "valtec-ball-perfect")!;
    const filter = EQUIPMENT.find((e) => e.id === "valtec-filter-mesh")!;
    const manometer = EQUIPMENT.find((e) => e.id === "valtec-manometer")!;
    const extank = EQUIPMENT.find((e) => e.id === "valtec-extank-24")!;

    // Подбор по количеству контуров.
    // Цена коллектора на 7 выходов масштабируем линейно (примерное допущение).
    const manifoldCoef = manifoldOutputs / 7;
    const manifoldPrice = Math.round(manifold.price * Math.max(0.6, manifoldCoef));

    const items = [
      { sku: pexEvoh.sku, name: pexEvoh.name, qty: pipeWithReserve, unit: "м", price: pexEvoh.price, total: pipeWithReserve * pexEvoh.price },
      { sku: manifold.sku, name: `Коллектор VALTEC на ${manifoldOutputs} выходов`, qty: 1, unit: "компл", price: manifoldPrice, total: manifoldPrice },
      { sku: cabinet.sku, name: cabinet.name, qty: 1, unit: "шт", price: cabinet.price, total: cabinet.price },
      { sku: combimix.sku, name: combimix.name, qty: 1, unit: "компл", price: combimix.price, total: combimix.price },
      { sku: ballValve.sku, name: ballValve.name, qty: 2, unit: "шт", price: ballValve.price, total: ballValve.price * 2 },
      { sku: filter.sku, name: filter.name, qty: 1, unit: "шт", price: filter.price, total: filter.price },
      { sku: manometer.sku, name: manometer.name, qty: 1, unit: "шт", price: manometer.price, total: manometer.price },
      { sku: extank.sku, name: extank.name, qty: 1, unit: "шт", price: extank.price, total: extank.price },
    ];

    const materialsTotal = items.reduce((s, i) => s + i.total, 0);
    // Монтаж — 1 200 ₽/м² по стандарту рынка.
    const installationTotal = Math.round(totalArea * 1200);
    const grandTotal = materialsTotal + installationTotal;

    // Теплопотери и мощность.
    // Стандарт VALTEC: с тёплого пола снимают 60–80 Вт/м² (умеренно утеплённый дом).
    const heatOutput = Math.round(totalArea * 70);

    return {
      totalArea,
      totalPipe,
      pipeWithReserve,
      numLoops,
      loopLengths: loops.map((l) => Math.round(l)),
      manifoldOutputs,
      items,
      materialsTotal,
      installationTotal,
      grandTotal,
      heatOutput,
    };
  }, [sections]);

  /* ── UI ── */
  function addSection() {
    setSections((prev) => [
      ...prev,
      {
        id: "s" + Date.now(),
        name: "Новое помещение",
        area: 10,
        step: 150,
        type: "living",
      },
    ]);
  }

  function update(id: string, patch: Partial<Section>) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function remove(id: string) {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-5">
      {/* Заголовок */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
          <Icon name="Thermometer" size={26} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground">
            Калькулятор водяного тёплого пола VALTEC
          </h2>
          <p className="text-sm text-muted-foreground">
            Точный расчёт по технологии VALTEC: метраж трубы PEX-EVOH, число контуров,
            коллектор и узел Combimix. Готовая спецификация и смета.
          </p>
        </div>
      </div>

      {/* Список помещений */}
      <div className="space-y-3">
        {sections.map((s) => (
          <div
            key={s.id}
            className="bg-card border-2 border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
          >
            {/* Тип */}
            <div className="sm:col-span-3">
              <label className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground block mb-1">
                Помещение
              </label>
              <select
                value={s.type}
                onChange={(e) => {
                  const t = e.target.value as RoomType;
                  const rt = ROOM_TYPES.find((r) => r.value === t)!;
                  update(s.id, { type: t, name: rt.label, step: t === "bath" ? 100 : 150 });
                }}
                className="w-full px-3 py-2 bg-background border-2 border-border rounded-lg text-sm font-medium"
              >
                {ROOM_TYPES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Название */}
            <div className="sm:col-span-3">
              <label className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground block mb-1">
                Название
              </label>
              <input
                value={s.name}
                onChange={(e) => update(s.id, { name: e.target.value })}
                className="w-full px-3 py-2 bg-background border-2 border-border rounded-lg text-sm"
              />
            </div>

            {/* Площадь */}
            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground block mb-1">
                Площадь, м²
              </label>
              <input
                type="number"
                min={1}
                step={0.5}
                value={s.area}
                onChange={(e) => update(s.id, { area: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-background border-2 border-border rounded-lg text-sm font-bold"
              />
            </div>

            {/* Шаг */}
            <div className="sm:col-span-3">
              <label className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground block mb-1">
                Шаг укладки
              </label>
              <select
                value={s.step}
                onChange={(e) => update(s.id, { step: Number(e.target.value) as Step })}
                className="w-full px-3 py-2 bg-background border-2 border-border rounded-lg text-sm font-medium"
              >
                {STEPS.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label} — {st.hint}
                  </option>
                ))}
              </select>
            </div>

            {/* Удалить */}
            <div className="sm:col-span-1 flex justify-end">
              <button
                onClick={() => remove(s.id)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Удалить"
              >
                <Icon name="Trash2" size={18} />
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={addSection}
          className="w-full px-4 py-3 border-2 border-dashed border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2"
        >
          <Icon name="Plus" size={16} /> Добавить помещение
        </button>
      </div>

      {/* Результаты */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-2 border-blue-500/30 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-widest font-mono text-blue-700 dark:text-blue-300 mb-1">
            Общая площадь
          </div>
          <div className="text-3xl font-black text-foreground">
            {calc.totalArea.toFixed(1)} <span className="text-base font-bold text-muted-foreground">м²</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Тепловая мощность ≈ {calc.heatOutput} Вт
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500/10 to-orange-500/5 border-2 border-rose-500/30 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-widest font-mono text-rose-700 dark:text-rose-300 mb-1">
            Трубы VALTEC PEX-EVOH
          </div>
          <div className="text-3xl font-black text-foreground">
            {calc.pipeWithReserve} <span className="text-base font-bold text-muted-foreground">м</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {calc.numLoops} контур{calc.numLoops === 1 ? "" : calc.numLoops < 5 ? "а" : "ов"} (макс. 100 м каждый)
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-2 border-emerald-500/30 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-widest font-mono text-emerald-700 dark:text-emerald-300 mb-1">
            Итого по проекту
          </div>
          <div className="text-3xl font-black text-foreground">
            {formatRub(calc.grandTotal)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Материалы + монтаж под ключ
          </div>
        </div>
      </div>

      {/* Спецификация */}
      <div className="bg-card border-2 border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-muted/50 border-b border-border">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Icon name="ClipboardList" size={16} className="text-primary" />
            Спецификация материалов VALTEC
          </h3>
        </div>
        <div className="divide-y divide-border">
          {calc.items.map((row, idx) => (
            <div key={idx} className="px-4 py-3 grid grid-cols-12 gap-2 items-center text-sm">
              <div className="col-span-12 sm:col-span-6">
                <div className="font-medium text-foreground">{row.name}</div>
                {row.sku && (
                  <div className="text-[11px] font-mono text-muted-foreground">арт. {row.sku}</div>
                )}
              </div>
              <div className="col-span-4 sm:col-span-2 text-sm text-muted-foreground">
                {row.qty} {row.unit}
              </div>
              <div className="col-span-4 sm:col-span-2 text-sm text-muted-foreground">
                {formatRub(row.price)}
              </div>
              <div className="col-span-4 sm:col-span-2 text-right font-bold text-foreground">
                {formatRub(row.total)}
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 bg-muted/30 border-t border-border space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Материалы VALTEC</span>
            <span className="font-medium text-foreground">{formatRub(calc.materialsTotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Монтаж под ключ ({calc.totalArea.toFixed(1)} м² × 1 200 ₽)</span>
            <span className="font-medium text-foreground">{formatRub(calc.installationTotal)}</span>
          </div>
          <div className="flex justify-between pt-2 mt-1 border-t border-border">
            <span className="font-bold text-foreground">Итого</span>
            <span className="text-lg font-black text-primary">{formatRub(calc.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Длины контуров */}
      {calc.numLoops > 0 && (
        <div className="bg-card border-2 border-border rounded-xl p-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
            <Icon name="Workflow" size={16} className="text-primary" />
            Длины контуров (для балансировки)
          </h3>
          <div className="flex flex-wrap gap-2">
            {calc.loopLengths.map((l, i) => (
              <div
                key={i}
                className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs font-mono"
              >
                Контур {i + 1}: <span className="font-bold">{l} м</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Технология VALTEC: длина каждого контура не должна превышать 100 м, иначе гидравлическое
            сопротивление становится высоким и насос Combimix не справится с прокачкой. Сервис
            автоматически делит площадь на нужное число контуров и подбирает коллектор.
          </p>
        </div>
      )}
    </div>
  );
}
