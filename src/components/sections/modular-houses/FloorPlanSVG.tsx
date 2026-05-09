import {
  HousePlacement,
  MODULE_TYPE_LABELS,
  getModule,
} from "@/lib/modular-houses";

interface Props {
  layout: HousePlacement[];
  /** Размер итогового SVG, px (квадрат) */
  size?: number;
  /** Показывать размеры */
  showDimensions?: boolean;
  /** Заголовок плана (отображается сверху) */
  title?: string;
}

/**
 * SVG-чертёж плана этажа: вид сверху на расположение модулей,
 * с подписями типа помещения и габаритов.
 */
export default function FloorPlanSVG({
  layout,
  size = 480,
  showDimensions = true,
  title,
}: Props) {
  const modules = layout
    .map((p) => ({ p, m: getModule(p.moduleId) }))
    .filter((x): x is { p: HousePlacement; m: NonNullable<ReturnType<typeof getModule>> } => !!x.m);

  if (modules.length === 0) {
    return (
      <div className="aspect-square rounded-lg border-2 border-dashed border-border bg-secondary/30 flex items-center justify-center text-xs text-muted-foreground">
        Нет модулей
      </div>
    );
  }

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const { p, m } of modules) {
    const isRot = !!p.rotationY;
    const w = isRot ? m.size[2] : m.size[0];
    const d = isRot ? m.size[0] : m.size[2];
    minX = Math.min(minX, p.position[0]);
    minZ = Math.min(minZ, p.position[1]);
    maxX = Math.max(maxX, p.position[0] + w);
    maxZ = Math.max(maxZ, p.position[1] + d);
  }

  const planW = maxX - minX;
  const planD = maxZ - minZ;
  const padding = 1.5; // метров по краям
  const totalW = planW + padding * 2;
  const totalD = planD + padding * 2;
  const scale = size / Math.max(totalW, totalD);

  const colorByType: Record<string, string> = {
    living: "#fde7c2",
    kitchen: "#ffd9b3",
    bath: "#cfe5f0",
    tech: "#dcdfe3",
    corridor: "#e6dccd",
    terrace: "#d6c5a8",
  };

  return (
    <div className="bg-white rounded-lg border border-border p-3 select-none">
      {title && (
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 text-center">
          {title}
        </p>
      )}
      <svg
        viewBox={`0 0 ${totalW * scale} ${totalD * scale}`}
        width="100%"
        style={{ maxHeight: size }}
        className="bg-[#fafaf7]"
      >
        <defs>
          <pattern id="grid-floor" width={scale} height={scale} patternUnits="userSpaceOnUse">
            <path
              d={`M ${scale} 0 L 0 0 0 ${scale}`}
              fill="none"
              stroke="#e8e6df"
              strokeWidth={0.5}
            />
          </pattern>
          <pattern id="grid-floor-major" width={scale * 5} height={scale * 5} patternUnits="userSpaceOnUse">
            <path
              d={`M ${scale * 5} 0 L 0 0 0 ${scale * 5}`}
              fill="none"
              stroke="#d6d3c8"
              strokeWidth={0.8}
            />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid-floor)" />
        <rect width="100%" height="100%" fill="url(#grid-floor-major)" />

        {modules.map(({ p, m }, idx) => {
          const isRot = !!p.rotationY;
          const w = isRot ? m.size[2] : m.size[0];
          const d = isRot ? m.size[0] : m.size[2];
          const x = (p.position[0] - minX + padding) * scale;
          const y = (p.position[1] - minZ + padding) * scale;
          const wpx = w * scale;
          const dpx = d * scale;
          const cx = x + wpx / 2;
          const cy = y + dpx / 2;
          const fontSize = Math.max(8, Math.min(13, scale * 0.35));
          const isTerrace = m.type === "terrace";

          return (
            <g key={idx}>
              <rect
                x={x}
                y={y}
                width={wpx}
                height={dpx}
                fill={colorByType[m.type] ?? "#eee"}
                fillOpacity={isTerrace ? 0.4 : 0.85}
                stroke="#1a1a1a"
                strokeWidth={isTerrace ? 1 : 1.6}
                strokeDasharray={isTerrace ? "4 3" : undefined}
              />

              {/* Дверь (вход) — обозначаем у первого жилого/коридорного блока */}
              {(m.type === "corridor" || (idx === 0 && m.type !== "terrace")) && (
                <g>
                  <line
                    x1={x + wpx * 0.3}
                    y1={y + dpx}
                    x2={x + wpx * 0.6}
                    y2={y + dpx}
                    stroke="#1a1a1a"
                    strokeWidth={2.5}
                  />
                  <path
                    d={`M ${x + wpx * 0.3} ${y + dpx} A ${wpx * 0.3} ${wpx * 0.3} 0 0 1 ${x + wpx * 0.6} ${y + dpx - wpx * 0.3}`}
                    fill="none"
                    stroke="#1a1a1a"
                    strokeWidth={0.8}
                  />
                </g>
              )}

              {/* Окна — две короткие двойные линии на длинных стенах */}
              {m.type !== "tech" && m.type !== "terrace" && (
                <>
                  <line
                    x1={x + wpx * 0.35}
                    y1={y - 1}
                    x2={x + wpx * 0.65}
                    y2={y - 1}
                    stroke="#5b8db8"
                    strokeWidth={3}
                  />
                  <line
                    x1={x + wpx * 0.35}
                    y1={y + dpx + 1}
                    x2={x + wpx * 0.65}
                    y2={y + dpx + 1}
                    stroke="#5b8db8"
                    strokeWidth={3}
                  />
                </>
              )}

              {/* Подпись помещения */}
              <text
                x={cx}
                y={cy - fontSize * 0.2}
                textAnchor="middle"
                fontSize={fontSize}
                fontFamily="ui-sans-serif, system-ui"
                fontWeight={700}
                fill="#1a1a1a"
              >
                {MODULE_TYPE_LABELS[m.type]}
              </text>
              <text
                x={cx}
                y={cy + fontSize * 1}
                textAnchor="middle"
                fontSize={fontSize * 0.78}
                fontFamily="ui-monospace, monospace"
                fill="#5a5a5a"
              >
                {m.area} м²
              </text>
            </g>
          );
        })}

        {/* Размерные линии общего контура */}
        {showDimensions && (
          <g>
            {/* Низ */}
            <line
              x1={padding * scale}
              y1={(planD + padding + 0.6) * scale}
              x2={(planW + padding) * scale}
              y2={(planD + padding + 0.6) * scale}
              stroke="#1a1a1a"
              strokeWidth={0.7}
            />
            <line
              x1={padding * scale}
              y1={(planD + padding + 0.4) * scale}
              x2={padding * scale}
              y2={(planD + padding + 0.8) * scale}
              stroke="#1a1a1a"
              strokeWidth={0.7}
            />
            <line
              x1={(planW + padding) * scale}
              y1={(planD + padding + 0.4) * scale}
              x2={(planW + padding) * scale}
              y2={(planD + padding + 0.8) * scale}
              stroke="#1a1a1a"
              strokeWidth={0.7}
            />
            <text
              x={((padding + planW / 2)) * scale}
              y={(planD + padding + 1.2) * scale}
              textAnchor="middle"
              fontSize={scale * 0.32}
              fontFamily="ui-monospace, monospace"
              fill="#1a1a1a"
            >
              {planW.toFixed(1)} м
            </text>

            {/* Лево */}
            <line
              x1={(padding - 0.6) * scale}
              y1={padding * scale}
              x2={(padding - 0.6) * scale}
              y2={(planD + padding) * scale}
              stroke="#1a1a1a"
              strokeWidth={0.7}
            />
            <text
              x={(padding - 1) * scale}
              y={(padding + planD / 2) * scale}
              textAnchor="middle"
              fontSize={scale * 0.32}
              fontFamily="ui-monospace, monospace"
              fill="#1a1a1a"
              transform={`rotate(-90 ${(padding - 1) * scale} ${(padding + planD / 2) * scale})`}
            >
              {planD.toFixed(1)} м
            </text>
          </g>
        )}

        {/* Стрелка севера */}
        <g transform={`translate(${(totalW - 1.2) * scale}, ${1 * scale})`}>
          <circle cx={0} cy={0} r={scale * 0.5} fill="white" stroke="#1a1a1a" strokeWidth={0.8} />
          <path
            d={`M 0 ${-scale * 0.35} L ${scale * 0.18} ${scale * 0.2} L 0 ${scale * 0.05} L ${-scale * 0.18} ${scale * 0.2} Z`}
            fill="#1a1a1a"
          />
          <text
            x={0}
            y={-scale * 0.55}
            textAnchor="middle"
            fontSize={scale * 0.3}
            fontFamily="ui-sans-serif"
            fontWeight={700}
            fill="#1a1a1a"
          >
            С
          </text>
        </g>
      </svg>

      <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono">
        {Object.entries(colorByType).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded border border-border"
              style={{ background: color }}
            />
            <span className="text-muted-foreground">
              {MODULE_TYPE_LABELS[type as keyof typeof MODULE_TYPE_LABELS]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
