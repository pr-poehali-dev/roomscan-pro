import Icon from "@/components/ui/icon";
import PlannerTabs from "./PlannerTabs";
import { exportPlanToPDF } from "@/lib/planExporter";
import type { LastScan, CartItemRef } from "@/lib/scanStore";

interface PlacedItemPdf { id: number; name: string; x: number; y: number; w: number; h: number }

/**
 * Шапка демо-режима планировщика: заголовок, вкладки, кнопки «из корзины»,
 * экспорт PDF и переключатель 2D/3D. Логика и стили 1:1 перенесены
 * из PlannerSection.tsx без изменений.
 */
export default function PlannerDemoHeader({
  tab,
  onTabChange,
  cartItemsList,
  importFromCart,
  lastScan,
  placed,
  view,
  onViewChange,
}: {
  tab: "editor" | "demo";
  onTabChange: (t: "editor" | "demo") => void;
  cartItemsList: CartItemRef[];
  importFromCart: () => void;
  lastScan: LastScan | null;
  placed: PlacedItemPdf[];
  view: "2D" | "3D";
  onViewChange: (v: "2D" | "3D") => void;
}) {
  return (
    <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
      <div>
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">Демо-режим</p>
        <h2 className="text-3xl font-bold">Планировщик</h2>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <PlannerTabs tab={tab} onChange={onTabChange} />
        {cartItemsList.length > 0 && (
          <button
            onClick={importFromCart}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5"
            title="Перенести мебель из корзины на план"
          >
            <Icon name="ShoppingCart" size={13} />
            + из корзины ({cartItemsList.length})
          </button>
        )}
        {lastScan && (
          <button
            onClick={() => exportPlanToPDF({
              scan: lastScan,
              cart: cartItemsList,
              placed: placed.map((p) => ({ id: p.id, name: p.name, x: p.x, y: p.y, w: p.w, h: p.h })),
              title: "RoomScan AI · План помещения",
            }, `roomscan-plan-${Date.now()}.pdf`)}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors flex items-center gap-1.5"
            title="Скачать план в PDF (A4)"
          >
            <Icon name="FileDown" size={13} />
            PDF
          </button>
        )}
        {(["2D", "3D"] as const).map((v) => (
          <button key={v} onClick={() => onViewChange(v)}
            className={`text-sm font-mono px-4 py-2 rounded-lg border transition-colors ${
              view === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
            }`}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
