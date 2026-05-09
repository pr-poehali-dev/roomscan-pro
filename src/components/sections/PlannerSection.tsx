import { useEffect, useState } from "react";
import { getLastScan, type LastScan } from "@/lib/scanStore";
import FloorPlanEditor from "@/components/planner/FloorPlanEditor";
import ScannedRoomPlan from "@/components/planner/ScannedRoomPlan";
import Icon from "@/components/ui/icon";

/**
 * Раздел «Планировщик».
 *
 * Профессиональный 2D/3D-редактор планов: стены, проёмы, мебель.
 * Без демо-данных — пользователь сразу попадает в чистый редактор и
 * рисует свой план или импортирует из скана.
 *
 * Если есть последний скан — внизу показывается реальный план с проёмами.
 */
export default function PlannerSection({
  onNavigate,
}: {
  onNavigate?: (section: string) => void;
}) {
  const [lastScan, setLastScan] = useState<LastScan | null>(null);

  useEffect(() => {
    const sync = () => setLastScan(getLastScan());
    sync();
    window.addEventListener("roomscan:lastScan:changed", sync);
    return () => window.removeEventListener("roomscan:lastScan:changed", sync);
  }, []);

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="max-w-3xl">
          <p className="t-meta text-primary mb-1.5">2D / 3D · Профессиональный редактор</p>
          <h2 className="h-section text-foreground mb-2 flex items-center gap-3 flex-wrap">
            <span className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
              <Icon name="LayoutGrid" size={22} className="text-primary" />
            </span>
            Планировщик
          </h2>
          <p className="t-lead">
            Рисуйте стены, расставляйте двери, окна и мебель. План сохраняется на вашем
            устройстве автоматически. Импортируйте мебель из каталога одним кликом или
            подгрузите комнату из скана.
          </p>
        </div>

        {/* Быстрые подсказки откуда начать */}
        {!lastScan && (
          <div className="bg-card border border-border rounded-2xl px-4 py-3 max-w-sm">
            <p className="t-meta mb-2">С чего начать</p>
            <div className="space-y-1.5 text-sm">
              <button
                onClick={() => onNavigate?.("scan")}
                className="flex items-center gap-2 text-foreground hover:text-primary transition-colors w-full text-left"
              >
                <Icon name="ScanLine" size={14} className="text-primary" />
                <span>Отсканировать комнату</span>
                <Icon name="ArrowRight" size={12} className="ml-auto opacity-50" />
              </button>
              <button
                onClick={() => onNavigate?.("catalog")}
                className="flex items-center gap-2 text-foreground hover:text-primary transition-colors w-full text-left"
              >
                <Icon name="Sofa" size={14} className="text-primary" />
                <span>Выбрать мебель в каталоге</span>
                <Icon name="ArrowRight" size={12} className="ml-auto opacity-50" />
              </button>
            </div>
          </div>
        )}
      </div>

      <FloorPlanEditor
        onNavigateCatalog={onNavigate ? () => onNavigate("catalog") : undefined}
      />

      {/* Реальный план комнаты со сканированными проёмами */}
      {lastScan && <ScannedRoomPlan scan={lastScan} />}
    </div>
  );
}
