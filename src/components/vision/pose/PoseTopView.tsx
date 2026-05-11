import type { PoseResponse } from "@/lib/poseToFloorPlan";

/**
 * SVG-визуализация распознанной комнаты «вид сверху»:
 * пол + стены + проёмы (окна/двери) + расставленная мебель.
 */
interface Props {
  pose: PoseResponse;
}

export default function PoseTopView({ pose }: Props) {
  const { room, openings, furniture } = pose;
  const PADDING = 24;
  const VIEW_W = 720;
  const VIEW_H = Math.round(VIEW_W * (room.depth_cm / room.width_cm));
  const SX = (VIEW_W - PADDING * 2) / room.width_cm;
  const SY = (VIEW_H - PADDING * 2) / room.depth_cm;

  return (
    <div className="bg-card border border-border rounded-xl p-3 overflow-x-auto">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto block"
        style={{ maxHeight: 480 }}
      >
        {/* фон комнаты */}
        <rect
          x={PADDING}
          y={PADDING}
          width={room.width_cm * SX}
          height={room.depth_cm * SY}
          fill="hsl(var(--secondary))"
          stroke="hsl(var(--border))"
          strokeWidth={2}
        />

        {/* стены */}
        <rect
          x={PADDING}
          y={PADDING}
          width={room.width_cm * SX}
          height={room.depth_cm * SY}
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth={6}
        />

        {/* проёмы */}
        {openings.map((op) => {
          const isWindow = op.kind === "window";
          const stroke = isWindow ? "#3b82f6" : "#10b981";
          const center = op.center_cm;
          const halfW = op.width_cm / 2;
          let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
          if (op.wall_side === "north") {
            x1 = PADDING + (center - halfW) * SX;
            x2 = PADDING + (center + halfW) * SX;
            y1 = y2 = PADDING;
          } else if (op.wall_side === "south") {
            x1 = PADDING + (center - halfW) * SX;
            x2 = PADDING + (center + halfW) * SX;
            y1 = y2 = PADDING + room.depth_cm * SY;
          } else if (op.wall_side === "west") {
            y1 = PADDING + (center - halfW) * SY;
            y2 = PADDING + (center + halfW) * SY;
            x1 = x2 = PADDING;
          } else {
            y1 = PADDING + (center - halfW) * SY;
            y2 = PADDING + (center + halfW) * SY;
            x1 = x2 = PADDING + room.width_cm * SX;
          }
          return (
            <line
              key={op.id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={stroke}
              strokeWidth={8}
              strokeLinecap="round"
            />
          );
        })}

        {/* мебель */}
        {furniture.map((f) => {
          const x = PADDING + f.x_cm * SX;
          const y = PADDING + f.y_cm * SY;
          const w =
            f.rotation_deg === 90 || f.rotation_deg === 270
              ? f.depth_cm * SX
              : f.width_cm * SX;
          const h =
            f.rotation_deg === 90 || f.rotation_deg === 270
              ? f.width_cm * SY
              : f.depth_cm * SY;
          return (
            <g key={f.id}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill="hsl(var(--primary) / 0.18)"
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                rx={3}
              />
              <text
                x={x + w / 2}
                y={y + h / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fill="hsl(var(--foreground))"
                className="font-mono pointer-events-none"
              >
                {f.label.slice(0, 14)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
