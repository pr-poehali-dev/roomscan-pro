import Icon from "@/components/ui/icon";
import {
  CATEGORY_LABELS,
  EquipmentItem,
  formatRub,
} from "@/lib/engineering";

interface BomRow {
  item: EquipmentItem;
  quantity: number;
  total: number;
}

interface Props {
  total: number;
  loadedId: number | null;
  saving: boolean;
  bom: BomRow[];
  selectedEqId: string | null;
  setSelectedEqId: (id: string | null) => void;
  onSave: () => void;
  onPdf: () => void;
  onOpenQuote: () => void;
}

/**
 * Правая колонка-сайдбар: «Итог по проекту» + кнопки Save/PDF/Заказ +
 * номенклатура BOM (полный список оборудования с ценами).
 * Логика 1:1 перенесена из EngineeringSection.tsx без изменений.
 */
export default function EngSidebar({
  total,
  loadedId,
  saving,
  bom,
  selectedEqId,
  setSelectedEqId,
  onSave,
  onPdf,
  onOpenQuote,
}: Props) {
  return (
    <aside className="space-y-3 lg:sticky lg:top-4 self-start">
      <div className="bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/40 rounded-xl p-5">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Итог по проекту
        </p>
        <p className="text-3xl font-black text-primary font-mono mt-1">
          {formatRub(total)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Оборудование + материалы + монтаж
        </p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={onSave}
            disabled={saving}
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
            className="bg-secondary text-foreground hover:bg-secondary/80 font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs"
          >
            <Icon name="FileDown" size={12} />
            PDF
          </button>
        </div>
        <button
          onClick={onOpenQuote}
          className="w-full mt-2 bg-primary text-primary-foreground hover:opacity-90 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm"
        >
          <Icon name="Phone" size={14} />
          Заказать котельную
        </button>
      </div>

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
  );
}
