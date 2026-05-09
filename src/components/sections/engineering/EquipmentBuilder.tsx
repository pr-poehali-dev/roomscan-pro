import { useState } from "react";
import Icon from "@/components/ui/icon";
import EquipmentCatalog from "./EquipmentCatalog";
import EquipmentBuilder2D from "./EquipmentBuilder2D";
import BuilderSummaryPanel from "./BuilderSummaryPanel";
import { EquipmentItem } from "@/lib/engineering";
import {
  BuilderComposition,
  BuilderPlacement,
  emptyComposition,
  findFreeSpot,
  footprint,
  nextUid,
  RoomDimensions,
} from "@/lib/equipment-builder";

interface Props {
  /** Стартовая компоновка (например, загруженная из шаблона) */
  initial?: BuilderComposition;
}

/**
 * Drag-and-drop конструктор инженерных узлов.
 * Слева — каталог с фотографиями, по центру — 2D-план,
 * справа — сводка и список элементов.
 */
export default function EquipmentBuilder({ initial }: Props) {
  const [composition, setComposition] = useState<BuilderComposition>(
    initial ?? emptyComposition(),
  );
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  function addItem(item: EquipmentItem) {
    const [w, d] = footprint(item, 0);
    const pos = findFreeSpot(composition, [w, d]);
    const placement: BuilderPlacement = {
      uid: nextUid(),
      equipmentId: item.id,
      position: pos,
      rotation: 0,
    };
    setComposition({
      ...composition,
      placements: [...composition.placements, placement],
      updatedAt: Date.now(),
    });
    setSelectedUid(placement.uid);
  }

  function removeItem(uid: string) {
    setComposition({
      ...composition,
      placements: composition.placements.filter((p) => p.uid !== uid),
      updatedAt: Date.now(),
    });
    if (selectedUid === uid) setSelectedUid(null);
  }

  function changeRoom(room: RoomDimensions) {
    setComposition({ ...composition, room, updatedAt: Date.now() });
  }

  function clearAll() {
    setComposition({ ...composition, placements: [], updatedAt: Date.now() });
    setSelectedUid(null);
  }

  return (
    <div className="space-y-3">
      {/* Лента-инструкция */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Icon name="Hammer" size={16} className="text-primary" />
        </div>
        <div>
          <p className="text-xs font-bold mb-0.5">Конструктор инженерного помещения</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Перетаскивайте оборудование из каталога на план тех. помещения. Двигайте, поворачивайте, удаляйте — справа автоматически считается стоимость и появляются рекомендации по составу.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Каталог слева */}
        <div className="lg:col-span-4">
          <EquipmentCatalog onAdd={addItem} onDragStart={() => {}} compact />
        </div>

        {/* 2D-план по центру */}
        <div className="lg:col-span-5 space-y-3">
          <EquipmentBuilder2D
            composition={composition}
            onChange={setComposition}
            selectedUid={selectedUid}
            onSelect={setSelectedUid}
            height={540}
          />
        </div>

        {/* Сводка справа */}
        <div className="lg:col-span-3">
          <BuilderSummaryPanel
            composition={composition}
            selectedUid={selectedUid}
            onSelect={setSelectedUid}
            onRemove={removeItem}
            onChangeRoom={changeRoom}
            onClear={clearAll}
          />
        </div>
      </div>
    </div>
  );
}
