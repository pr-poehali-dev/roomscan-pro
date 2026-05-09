import Icon from "@/components/ui/icon";
import { MODULE_TYPE_LABELS } from "@/lib/modular-houses";
import { formatRub } from "@/lib/engineering";

interface SpecRow {
  module: { id: string; name: string; type: keyof typeof MODULE_TYPE_LABELS; area: number };
  quantity: number;
  total: number;
}

interface Props {
  spec: {
    totalArea: number;
    grandTotal: number;
    modulesPrice: number;
    delivery: number;
    foundation: number;
    utilities: number;
    modules: SpecRow[];
  };
  loadedId: number | null;
  saving: boolean;
  onSave: () => void;
  onPdf: () => void;
  onOpenQuote: () => void;
}

/**
 * Правая колонка-сайдбар: блок «Стоимость под ключ» (цена + кнопки Save/PDF/Заказ),
 * структура сметы (PriceRow) и спецификация модулей.
 * Логика 1:1 перенесена из ModularHousesSection.tsx без изменений.
 */
export default function HousesSidebar({
  spec,
  loadedId,
  saving,
  onSave,
  onPdf,
  onOpenQuote,
}: Props) {
  return (
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
            onClick={onSave}
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
            onClick={onPdf}
            disabled={spec.totalArea === 0}
            className="bg-secondary text-foreground hover:bg-secondary/80 font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs disabled:opacity-50"
          >
            <Icon name="FileDown" size={12} />
            PDF
          </button>
        </div>
        <button
          onClick={onOpenQuote}
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
  );
}

/* ───────── Локальный хелпер ───────── */

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
