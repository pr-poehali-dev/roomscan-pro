import Icon from "@/components/ui/icon";
import type { LastScan, DetectedOpening } from "@/lib/scanStore";

/**
 * Реальный план комнаты от последнего скана с отображением проёмов (двери/окна).
 * Логика и разметка 1:1 перенесены из PlannerSection.tsx без изменений.
 */
export default function ScannedRoomPlan({ scan }: { scan: LastScan }) {
  const openings = scan.openings ?? [];
  const W = scan.width;
  const L = scan.length;

  // SVG canvas: 320×220, отступ 20
  const PAD = 20;
  const SVG_W = 320;
  const SVG_H = 220;
  const innerW = SVG_W - PAD * 2;
  const innerH = SVG_H - PAD * 2;

  // масштабируем bbox комнаты в SVG (сохраняя пропорции)
  const scale = Math.min(innerW / W, innerH / L);
  const roomW = W * scale;
  const roomL = L * scale;
  const ox = (SVG_W - roomW) / 2;
  const oy = (SVG_H - roomL) / 2;

  // Распределяем проёмы по 4 стенам по wall_idx % 4:
  // 0 = низ, 1 = право, 2 = верх, 3 = лево
  // позиция вдоль стены — равномерно по числу проёмов на этой стене
  type OpeningOnWall = DetectedOpening & { wallSide: 0 | 1 | 2 | 3; orderOnWall: number; totalOnWall: number };

  const byWall: Record<number, DetectedOpening[]> = { 0: [], 1: [], 2: [], 3: [] };
  openings.forEach((o) => {
    const side = (o.wall_idx % 4) as 0 | 1 | 2 | 3;
    byWall[side].push(o);
  });

  const positioned: OpeningOnWall[] = [];
  ([0, 1, 2, 3] as const).forEach((side) => {
    byWall[side].forEach((o, idx) => {
      positioned.push({ ...o, wallSide: side, orderOnWall: idx, totalOnWall: byWall[side].length });
    });
  });

  // координаты проёма на стене
  const renderOpening = (o: OpeningOnWall, key: number) => {
    const segLen = o.width * scale;
    let x = 0, y = 0, w = 0, h = 0;
    const STROKE = 6; // толщина "стены" для отображения проёма
    // позиция вдоль стены: равномерное распределение
    const t = (o.orderOnWall + 0.5) / o.totalOnWall; // 0..1

    if (o.wallSide === 0) {
      // нижняя стена: горизонтальный сегмент
      x = ox + t * roomW - segLen / 2;
      y = oy + roomL - STROKE / 2;
      w = segLen;
      h = STROKE;
    } else if (o.wallSide === 2) {
      // верхняя стена
      x = ox + t * roomW - segLen / 2;
      y = oy - STROKE / 2;
      w = segLen;
      h = STROKE;
    } else if (o.wallSide === 1) {
      // правая стена: вертикальный сегмент
      x = ox + roomW - STROKE / 2;
      y = oy + t * roomL - segLen / 2;
      w = STROKE;
      h = segLen;
    } else {
      // левая стена
      x = ox - STROKE / 2;
      y = oy + t * roomL - segLen / 2;
      w = STROKE;
      h = segLen;
    }

    const isDoor = o.type === "door";
    const color = isDoor ? "rgb(249,115,22)" : "rgb(56,189,248)";
    const labelX = x + w / 2;
    const labelY = y + h / 2;

    return (
      <g key={key}>
        <rect x={x} y={y} width={w} height={h} fill={color} rx="1.5" />
        <circle cx={labelX} cy={labelY} r="7" fill={color} stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
        <text x={labelX} y={labelY + 2.5} textAnchor="middle" fontSize="7" fontFamily="IBM Plex Mono"
              fill="white" fontWeight="700">
          {isDoor ? "Д" : "О"}
        </text>
      </g>
    );
  };

  const doorsCount   = openings.filter((o) => o.type === "door").length;
  const windowsCount = openings.filter((o) => o.type === "window").length;

  return (
    <div className="mt-4 bg-card border border-primary/20 rounded-lg p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="Sparkles" size={14} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Реальный план от скана</p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {W} × {L} м · h={scan.height} м · {scan.area} м²
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 bg-orange-500/10 text-orange-500 rounded-md px-2 py-1 font-semibold">
            <span className="w-2 h-2 bg-orange-500 rounded-sm" /> {doorsCount} {doorsCount === 1 ? "дверь" : "двери"}
          </span>
          <span className="flex items-center gap-1 bg-sky-400/10 text-sky-400 rounded-md px-2 py-1 font-semibold">
            <span className="w-2 h-2 bg-sky-400 rounded-sm" /> {windowsCount} {windowsCount === 1 ? "окно" : "окон"}
          </span>
        </div>
      </div>

      <div className="bg-secondary/30 rounded-lg overflow-hidden border border-border">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ height: 240 }}>
          {/* фон-сетка */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* стены комнаты */}
          <rect
            x={ox} y={oy} width={roomW} height={roomL}
            fill="rgba(34,197,94,0.06)"
            stroke="rgba(0,0,0,0.55)"
            strokeWidth="3"
            rx="1"
          />

          {/* размеры */}
          <text x={ox + roomW / 2} y={oy - 6} textAnchor="middle"
                fontSize="9" fontFamily="IBM Plex Mono" fill="hsl(142,70%,55%)">
            {W} м
          </text>
          <text x={ox - 8} y={oy + roomL / 2} textAnchor="middle"
                fontSize="9" fontFamily="IBM Plex Mono" fill="hsl(142,70%,55%)"
                transform={`rotate(-90 ${ox - 8} ${oy + roomL / 2})`}>
            {L} м
          </text>

          {/* проёмы поверх стен */}
          {positioned.map((o, i) => renderOpening(o, i))}

          {/* подпись комнаты */}
          <text x={ox + roomW / 2} y={oy + roomL / 2} textAnchor="middle"
                fontSize="11" fontFamily="IBM Plex Mono" fill="rgba(0,0,0,0.45)" fontWeight="600">
            Комната
          </text>
          <text x={ox + roomW / 2} y={oy + roomL / 2 + 14} textAnchor="middle"
                fontSize="9" fontFamily="IBM Plex Mono" fill="rgba(0,0,0,0.35)">
            {scan.area} м²
          </text>
        </svg>
      </div>

      {openings.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
          <Icon name="Info" size={12} />
          Проёмы не обнаружены. Попробуйте сканировать с большим количеством кадров.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {openings.slice(0, 6).map((o, i) => (
            <div key={i} className="flex items-center gap-2 bg-secondary/40 rounded-md px-2 py-1.5 text-xs">
              <Icon
                name={o.type === "door" ? "DoorOpen" : "AppWindow"}
                size={12}
                className={o.type === "door" ? "text-orange-500" : "text-sky-400"}
              />
              <span className="text-foreground font-semibold">
                {o.type === "door" ? "Дверь" : "Окно"} #{i + 1}
              </span>
              <span className="text-muted-foreground font-mono ml-auto">
                {o.width}×{o.height}м
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
