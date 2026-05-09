import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { EquipmentItem, EQUIPMENT, CATEGORY_LABELS } from "@/lib/engineering";
import {
  BuilderComposition,
  BuilderPlacement,
  RoomDimensions,
  footprint,
  findFreeSpot,
  nextUid,
  rectsOverlap,
  isInsideRoom,
} from "@/lib/equipment-builder";

interface Props {
  composition: BuilderComposition;
  onChange: (next: BuilderComposition) => void;
  /** Высота канвы в пикселях */
  height?: number;
  /** Выбранный элемент (для подсветки) */
  selectedUid?: string | null;
  onSelect?: (uid: string | null) => void;
}

const COLOR_BY_CATEGORY: Record<string, string> = {
  boiler: "#ef4444",
  pump: "#f97316",
  expansion_tank: "#dc2626",
  boiler_tank: "#3b82f6",
  manifold: "#64748b",
  filter: "#475569",
  safety_group: "#eab308",
  controller: "#10b981",
  chimney: "#94a3b8",
  gas_tank: "#d97706",
  gas_cylinder: "#dc2626",
  gas_regulator: "#475569",
  gas_meter: "#0ea5e9",
  gas_detector: "#facc15",
  evaporator: "#f43f5e",
  pipe: "#6b7280",
  service: "#6b7280",
  valve: "#7c3aed",
};

/**
 * 2D-план тех.помещения с drag-and-drop и привязкой к сетке.
 * Эталон: SVG, цвета по категориям, размерные линии, дверь, окно, легенда.
 */
export default function EquipmentBuilder2D({
  composition,
  onChange,
  height = 540,
  selectedUid,
  onSelect,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragState, setDragState] = useState<{
    uid: string;
    offsetX: number;
    offsetZ: number;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const room = composition.room;
  const padding = 0.6;
  const totalW = room.width + padding * 2;
  const totalD = room.depth + padding * 2;
  const aspectRatio = totalD / totalW;

  /** Перевод pixel → метры */
  function pxToMeters(clientX: number, clientY: number): [number, number] {
    const svg = svgRef.current;
    if (!svg) return [0, 0];
    const rect = svg.getBoundingClientRect();
    const xRatio = (clientX - rect.left) / rect.width;
    const yRatio = (clientY - rect.top) / rect.height;
    const x = xRatio * totalW - padding;
    const z = yRatio * totalD - padding;
    return [snap(x), snap(z)];
  }

  function snap(v: number): number {
    return Math.round(v * 10) / 10; // привязка к 10 см
  }

  /* ────── Обработка drag из каталога (HTML5 DnD) ────── */

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  }
  function handleDragLeave() {
    setDragOver(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const id = e.dataTransfer.getData("text/plain");
    const item = EQUIPMENT.find((x) => x.id === id);
    if (!item) return;
    const [w, d] = footprint(item, 0);
    const [x, z] = pxToMeters(e.clientX, e.clientY);
    addItem(item, [x - w / 2, z - d / 2]);
  }

  function addItem(item: EquipmentItem, position?: [number, number]) {
    const [w, d] = footprint(item, 0);
    const pos = position ?? findFreeSpot(composition, [w, d]);
    const placement: BuilderPlacement = {
      uid: nextUid(),
      equipmentId: item.id,
      position: [Math.max(0, Math.min(pos[0], room.width - w)), Math.max(0, Math.min(pos[1], room.depth - d))],
      rotation: 0,
    };
    onChange({
      ...composition,
      placements: [...composition.placements, placement],
      updatedAt: Date.now(),
    });
    onSelect?.(placement.uid);
  }

  function updatePlacement(uid: string, patch: Partial<BuilderPlacement>) {
    onChange({
      ...composition,
      placements: composition.placements.map((p) =>
        p.uid === uid ? { ...p, ...patch } : p,
      ),
      updatedAt: Date.now(),
    });
  }

  function removePlacement(uid: string) {
    onChange({
      ...composition,
      placements: composition.placements.filter((p) => p.uid !== uid),
      updatedAt: Date.now(),
    });
    if (selectedUid === uid) onSelect?.(null);
  }

  /* ────── Перетаскивание уже размещённых блоков ────── */

  function startDrag(e: React.PointerEvent, placement: BuilderPlacement) {
    e.stopPropagation();
    onSelect?.(placement.uid);
    const [mx, mz] = pxToMeters(e.clientX, e.clientY);
    setDragState({
      uid: placement.uid,
      offsetX: mx - placement.position[0],
      offsetZ: mz - placement.position[1],
    });
  }

  useEffect(() => {
    if (!dragState) return;
    function handleMove(ev: PointerEvent) {
      const [mx, mz] = pxToMeters(ev.clientX, ev.clientY);
      const placement = composition.placements.find((p) => p.uid === dragState!.uid);
      if (!placement) return;
      const item = EQUIPMENT.find((e) => e.id === placement.equipmentId);
      if (!item) return;
      const [w, d] = footprint(item, placement.rotation);
      const newX = Math.max(0, Math.min(mx - dragState!.offsetX, room.width - w));
      const newZ = Math.max(0, Math.min(mz - dragState!.offsetZ, room.depth - d));
      updatePlacement(dragState!.uid, { position: [snap(newX), snap(newZ)] });
    }
    function handleUp() {
      setDragState(null);
    }
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragState, composition]);

  /* ────── Подготовка визуала ────── */

  const items = composition.placements.map((p) => {
    const item = EQUIPMENT.find((e) => e.id === p.equipmentId);
    if (!item) return null;
    const [w, d] = footprint(item, p.rotation);
    return { p, item, w, d };
  }).filter((x): x is NonNullable<typeof x> => !!x);

  // Вычисляем перекрытия для подсветки
  const overlapped = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]; const b = items[j];
      if (rectsOverlap(
        { x: a.p.position[0], z: a.p.position[1], w: a.w, d: a.d },
        { x: b.p.position[0], z: b.p.position[1], w: b.w, d: b.d },
      )) {
        overlapped.add(a.p.uid);
        overlapped.add(b.p.uid);
      }
    }
  }

  return (
    <div
      className={`relative bg-card border-2 rounded-xl overflow-hidden transition-colors ${
        dragOver ? "border-primary border-dashed bg-primary/5" : "border-border"
      }`}
      style={{ height }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${totalW * 100} ${totalD * 100}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full select-none"
        style={{ background: "#fafaf7" }}
        onClick={() => onSelect?.(null)}
      >
        <defs>
          <pattern id="grid-fine" width={10} height={10} patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e8e6df" strokeWidth={0.5} />
          </pattern>
          <pattern id="grid-major" width={50} height={50} patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#d6d3c8" strokeWidth={1} />
          </pattern>
          <pattern id="hatch" width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#1a1a1a" strokeWidth={0.8} />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid-fine)" />
        <rect width="100%" height="100%" fill="url(#grid-major)" />

        {/* Стены помещения */}
        <g transform={`translate(${padding * 100}, ${padding * 100})`}>
          {/* Контур */}
          <rect
            x={0}
            y={0}
            width={room.width * 100}
            height={room.depth * 100}
            fill="white"
            stroke="#1a1a1a"
            strokeWidth={4}
          />

          {/* Стены штриховкой за контуром */}
          <rect x={-15} y={-15} width={room.width * 100 + 30} height={15} fill="url(#hatch)" />
          <rect x={-15} y={room.depth * 100} width={room.width * 100 + 30} height={15} fill="url(#hatch)" />
          <rect x={-15} y={-15} width={15} height={room.depth * 100 + 30} fill="url(#hatch)" />
          <rect x={room.width * 100} y={-15} width={15} height={room.depth * 100 + 30} fill="url(#hatch)" />

          {/* Дверь снизу */}
          <g transform={`translate(${room.width * 50 - 50}, ${room.depth * 100})`}>
            <rect x={0} y={-3} width={100} height={6} fill="white" stroke="white" strokeWidth={4} />
            <line x1={0} y1={0} x2={100} y2={0} stroke="#1a1a1a" strokeWidth={2} />
            <path
              d={`M 0 0 A 90 90 0 0 1 90 -90`}
              fill="none"
              stroke="#1a1a1a"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <line x1={0} y1={0} x2={0} y2={-90} stroke="#1a1a1a" strokeWidth={2} />
          </g>

          {/* Окно сверху */}
          <g transform={`translate(${room.width * 50 - 60}, 0)`}>
            <rect x={0} y={-3} width={120} height={6} fill="white" stroke="white" strokeWidth={4} />
            <line x1={0} y1={0} x2={120} y2={0} stroke="#5b8db8" strokeWidth={3} />
            <line x1={0} y1={-2} x2={120} y2={-2} stroke="#5b8db8" strokeWidth={1} />
            <line x1={0} y1={2} x2={120} y2={2} stroke="#5b8db8" strokeWidth={1} />
          </g>

          {/* Размерные линии */}
          <DimensionLine
            x1={0}
            y1={room.depth * 100 + 40}
            x2={room.width * 100}
            y2={room.depth * 100 + 40}
            label={`${room.width.toFixed(1)} м`}
          />
          <DimensionLine
            x1={-40}
            y1={0}
            x2={-40}
            y2={room.depth * 100}
            label={`${room.depth.toFixed(1)} м`}
            vertical
          />

          {/* Оборудование */}
          {items.map(({ p, item, w, d }) => {
            const isSelected = selectedUid === p.uid;
            const isOverlapped = overlapped.has(p.uid);
            const isOutside = !isInsideRoom([p.position[0], p.position[1]], [w, d], room);
            const color = COLOR_BY_CATEGORY[item.category] ?? item.color;

            return (
              <g
                key={p.uid}
                transform={`translate(${p.position[0] * 100}, ${p.position[1] * 100})`}
                style={{ cursor: dragState?.uid === p.uid ? "grabbing" : "grab" }}
                onPointerDown={(e) => startDrag(e, p)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(p.uid);
                }}
              >
                <rect
                  x={0}
                  y={0}
                  width={w * 100}
                  height={d * 100}
                  fill={color}
                  fillOpacity={0.85}
                  stroke={isOverlapped || isOutside ? "#dc2626" : isSelected ? "#1ea54a" : "#1a1a1a"}
                  strokeWidth={isSelected ? 3 : isOverlapped || isOutside ? 3 : 1.5}
                  strokeDasharray={isOverlapped || isOutside ? "4 3" : undefined}
                />

                {/* Подпись внутри блока */}
                {w * d > 0.04 && (
                  <>
                    <text
                      x={(w * 100) / 2}
                      y={(d * 100) / 2 - 4}
                      textAnchor="middle"
                      fontSize={Math.min(11, Math.max(7, w * 12))}
                      fontFamily="ui-sans-serif"
                      fontWeight={700}
                      fill="white"
                      style={{ pointerEvents: "none" }}
                    >
                      {(item.brand ?? CATEGORY_LABELS[item.category]).slice(0, 12)}
                    </text>
                    <text
                      x={(w * 100) / 2}
                      y={(d * 100) / 2 + 8}
                      textAnchor="middle"
                      fontSize={Math.min(8, Math.max(6, w * 9))}
                      fontFamily="ui-monospace"
                      fill="white"
                      fillOpacity={0.85}
                      style={{ pointerEvents: "none" }}
                    >
                      {`${w.toFixed(1)}×${d.toFixed(1)}`}
                    </text>
                  </>
                )}

                {/* Кнопки управления при выборе */}
                {isSelected && (
                  <g transform={`translate(${w * 100 - 20}, -20)`}>
                    <circle
                      cx={0}
                      cy={0}
                      r={10}
                      fill="white"
                      stroke="#dc2626"
                      strokeWidth={1.5}
                      style={{ cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        removePlacement(p.uid);
                      }}
                    />
                    <text
                      x={0}
                      y={3.5}
                      textAnchor="middle"
                      fontSize={12}
                      fill="#dc2626"
                      fontWeight={700}
                      style={{ pointerEvents: "none" }}
                    >
                      ×
                    </text>
                  </g>
                )}

                {isSelected && (
                  <g transform={`translate(-15, -20)`}>
                    <circle
                      cx={0}
                      cy={0}
                      r={10}
                      fill="white"
                      stroke="#1ea54a"
                      strokeWidth={1.5}
                      style={{ cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = (((p.rotation + 90) % 360) as 0 | 90 | 180 | 270);
                        updatePlacement(p.uid, { rotation: next });
                      }}
                    />
                    <text
                      x={0}
                      y={3}
                      textAnchor="middle"
                      fontSize={11}
                      fill="#1ea54a"
                      fontWeight={700}
                      style={{ pointerEvents: "none" }}
                    >
                      ↻
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Подсказка при пустом плане */}
          {items.length === 0 && (
            <g transform={`translate(${(room.width * 100) / 2}, ${(room.depth * 100) / 2})`}>
              <text
                textAnchor="middle"
                fontSize={14}
                fontFamily="ui-sans-serif"
                fill="#9ca3af"
                fontWeight={600}
              >
                Перетащите оборудование сюда
              </text>
              <text
                y={20}
                textAnchor="middle"
                fontSize={10}
                fontFamily="ui-monospace"
                fill="#9ca3af"
              >
                из каталога слева
              </text>
            </g>
          )}
        </g>

        {/* Стрелка севера */}
        <g transform={`translate(${(totalW - 0.4) * 100}, ${0.4 * 100})`}>
          <circle r={20} fill="white" stroke="#1a1a1a" strokeWidth={1} />
          <path d="M 0 -14 L 8 8 L 0 2 L -8 8 Z" fill="#1a1a1a" />
          <text y={-22} textAnchor="middle" fontSize={11} fontWeight={700}>
            С
          </text>
        </g>

        {/* Подпись помещения */}
        <text
          x={padding * 100 + 10}
          y={padding * 100 + 16}
          fontSize={11}
          fontFamily="ui-monospace"
          fill="#1a1a1a"
          fontWeight={700}
        >
          ТЕХ. ПОМЕЩЕНИЕ
        </text>
        <text
          x={padding * 100 + 10}
          y={padding * 100 + 28}
          fontSize={9}
          fontFamily="ui-monospace"
          fill="#6b7280"
        >
          {(room.width * room.depth).toFixed(1)} м² · h={room.height.toFixed(1)} м
        </text>
      </svg>

      {/* Hint в углу */}
      <div className="absolute bottom-2 right-2 bg-card/90 backdrop-blur-sm border border-border rounded-md px-2 py-1 text-[10px] font-mono text-muted-foreground flex items-center gap-3">
        <span className="flex items-center gap-1">
          <Icon name="MousePointer" size={10} /> клик — выбрать
        </span>
        <span className="flex items-center gap-1">
          <Icon name="Move" size={10} /> тяни — двигать
        </span>
        <span className="flex items-center gap-1">
          <Icon name="RotateCw" size={10} /> ↻ — поворот
        </span>
      </div>
    </div>
  );
}

/* ────────────── ВСПОМОГАТЕЛЬНЫЙ КОМПОНЕНТ ────────────── */

function DimensionLine({
  x1, y1, x2, y2, label, vertical,
}: { x1: number; y1: number; x2: number; y2: number; label: string; vertical?: boolean }) {
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1a1a1a" strokeWidth={0.6} />
      <line
        x1={x1}
        y1={vertical ? y1 : y1 - 5}
        x2={x1}
        y2={vertical ? y1 : y1 + 5}
        stroke="#1a1a1a"
        strokeWidth={0.6}
      />
      <line
        x1={vertical ? x1 - 5 : x2}
        y1={vertical ? y1 : y2 - 5}
        x2={vertical ? x1 + 5 : x2}
        y2={vertical ? y1 : y2 + 5}
        stroke="#1a1a1a"
        strokeWidth={0.6}
      />
      <text
        x={cx + (vertical ? -10 : 0)}
        y={cy + (vertical ? 0 : 12)}
        textAnchor="middle"
        fontSize={10}
        fontFamily="ui-monospace"
        fill="#1a1a1a"
        fontWeight={600}
        transform={vertical ? `rotate(-90 ${cx - 10} ${cy})` : undefined}
      >
        {label}
      </text>
    </g>
  );
}
