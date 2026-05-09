import {
  HousePlacement,
  ModularHouseProject,
  getModule,
} from "@/lib/modular-houses";

interface Props {
  project: ModularHouseProject;
  layout: HousePlacement[];
  size?: number;
  title?: string;
  svgId?: string;
}

/**
 * Разрез дома по продольной оси: фундамент, стены, перекрытия, кровля,
 * с указанием материалов и высот ключевых отметок.
 */
export default function HouseSectionSVG({
  project,
  layout,
  size = 480,
  title,
  svgId,
}: Props) {
  const modules = layout
    .map((p) => ({ p, m: getModule(p.moduleId) }))
    .filter((x): x is { p: HousePlacement; m: NonNullable<ReturnType<typeof getModule>> } => !!x.m)
    .filter(({ m }) => m.type !== "terrace");

  if (modules.length === 0) {
    return (
      <div className="aspect-[16/9] rounded-lg border-2 border-dashed border-border bg-secondary/30 flex items-center justify-center text-xs text-muted-foreground">
        Нет данных
      </div>
    );
  }

  const ceilingH = project.construction === "futuristic" ? 3.0 : 2.7;
  const slabH = 0.3;
  const foundationH = 0.4;
  const roofH = project.construction === "futuristic" ? 0.3 : 1.2;
  const totalH = foundationH + ceilingH + slabH + roofH;

  let minX = Infinity, maxX = -Infinity;
  for (const { p, m } of modules) {
    const isRot = !!p.rotationY;
    const w = isRot ? m.size[2] : m.size[0];
    minX = Math.min(minX, p.position[0]);
    maxX = Math.max(maxX, p.position[0] + w);
  }
  const planW = maxX - minX;

  const padding = 1.6;
  const totalW = planW + padding * 2;
  const totalDH = totalH + padding * 1.6;

  const scale = Math.min(size / totalW, size * 0.6 / totalDH);
  const W = totalW * scale;
  const H = totalDH * scale;

  function ax(a: number) {
    return (a - minX + padding) * scale;
  }

  const groundY = (totalDH - padding * 0.8) * scale;
  const foundationTop = groundY - foundationH * scale;
  const slabTop = foundationTop - slabH * scale;
  const ceilingTop = slabTop - ceilingH * scale;
  const roofRidge = ceilingTop - roofH * scale;

  const wallColor = "#fff8e7";
  const insulationColor = "#fbe7a7";
  const slabColor = "#cdcdcd";

  return (
    <div className="bg-white rounded-lg border border-border p-3 select-none">
      {title && (
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 text-center">
          {title}
        </p>
      )}
      <svg
        id={svgId}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ maxHeight: size }}
        className="bg-[#fafaf7]"
      >
        <defs>
          <pattern id={`sec-grid-${svgId ?? "s"}`} width={scale * 5} height={scale * 5} patternUnits="userSpaceOnUse">
            <path d={`M ${scale * 5} 0 L 0 0 0 ${scale * 5}`} fill="none" stroke="#e8e6df" strokeWidth={0.5} />
          </pattern>
          <pattern id={`hatch-${svgId ?? "s"}`} width={6} height={6} patternUnits="userSpaceOnUse">
            <line x1="0" y1="6" x2="6" y2="0" stroke="#1a1a1a" strokeWidth={0.5} />
          </pattern>
          <pattern id={`hatch-foundation-${svgId ?? "s"}`} width={5} height={5} patternUnits="userSpaceOnUse">
            <line x1="0" y1="5" x2="5" y2="0" stroke="#555" strokeWidth={0.6} />
            <line x1="-2.5" y1="2.5" x2="2.5" y2="-2.5" stroke="#555" strokeWidth={0.6} />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill={`url(#sec-grid-${svgId ?? "s"})`} />

        {/* Земля и штриховка */}
        <line x1={0} y1={groundY} x2={W} y2={groundY} stroke="#1a1a1a" strokeWidth={1.5} />
        <rect x={0} y={groundY} width={W} height={groundY * 0.05 + 12} fill={`url(#hatch-${svgId ?? "s"})`} />

        {/* Фундамент */}
        <rect
          x={ax(minX) - 0.2 * scale}
          y={foundationTop}
          width={(planW + 0.4) * scale}
          height={(foundationH + 0.6) * scale}
          fill={`url(#hatch-foundation-${svgId ?? "s"})`}
          stroke="#1a1a1a"
          strokeWidth={1.2}
        />

        {/* Перекрытие пола */}
        <rect
          x={ax(minX)}
          y={slabTop}
          width={planW * scale}
          height={slabH * scale}
          fill={slabColor}
          stroke="#1a1a1a"
          strokeWidth={1}
        />

        {/* Стены (две вертикальные) */}
        <rect
          x={ax(minX)}
          y={ceilingTop}
          width={0.2 * scale}
          height={(ceilingH + slabH) * scale}
          fill={wallColor}
          stroke="#1a1a1a"
          strokeWidth={1.2}
        />
        <rect
          x={ax(maxX) - 0.2 * scale}
          y={ceilingTop}
          width={0.2 * scale}
          height={(ceilingH + slabH) * scale}
          fill={wallColor}
          stroke="#1a1a1a"
          strokeWidth={1.2}
        />

        {/* Утеплитель в стенах (две тонкие желтые полосы) */}
        <rect
          x={ax(minX) + 0.05 * scale}
          y={ceilingTop + 0.05 * scale}
          width={0.1 * scale}
          height={ceilingH * scale}
          fill={insulationColor}
          opacity={0.7}
        />
        <rect
          x={ax(maxX) - 0.15 * scale}
          y={ceilingTop + 0.05 * scale}
          width={0.1 * scale}
          height={ceilingH * scale}
          fill={insulationColor}
          opacity={0.7}
        />

        {/* Перекрытие потолка */}
        <rect
          x={ax(minX)}
          y={ceilingTop}
          width={planW * scale}
          height={slabH * scale}
          fill={slabColor}
          stroke="#1a1a1a"
          strokeWidth={1}
        />

        {/* Кровля */}
        {project.construction === "futuristic" ? (
          <rect
            x={ax(minX) - 6}
            y={ceilingTop - roofH * scale}
            width={planW * scale + 12}
            height={roofH * scale}
            fill="#3a3a3a"
            stroke="#1a1a1a"
            strokeWidth={1.4}
          />
        ) : (
          <polygon
            points={`
              ${ax(minX) - 8},${ceilingTop}
              ${(ax(minX) + ax(maxX)) / 2},${roofRidge}
              ${ax(maxX) + 8},${ceilingTop}
            `}
            fill="#5a3221"
            stroke="#1a1a1a"
            strokeWidth={1.4}
          />
        )}

        {/* Подписи помещений (надпись посередине каждого модуля по X) */}
        {modules
          .sort((a, b) => a.p.position[0] - b.p.position[0])
          .map(({ p, m }, i) => {
            const isRot = !!p.rotationY;
            const w = isRot ? m.size[2] : m.size[0];
            const cx = ax(p.position[0] + w / 2);
            const cy = (slabTop + ceilingTop) / 2;
            return (
              <g key={i}>
                <line
                  x1={ax(p.position[0])}
                  y1={ceilingTop}
                  x2={ax(p.position[0])}
                  y2={slabTop}
                  stroke="#1a1a1a"
                  strokeWidth={0.4}
                  strokeDasharray="3 3"
                />
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  fontSize={scale * 0.3}
                  fontFamily="ui-sans-serif, system-ui"
                  fontWeight={600}
                  fill="#1a1a1a"
                >
                  {m.type === "living"
                    ? "Жилая"
                    : m.type === "kitchen"
                      ? "Кухня"
                      : m.type === "bath"
                        ? "С/у"
                        : m.type === "tech"
                          ? "Техн."
                          : m.type === "corridor"
                            ? "Прихожая"
                            : ""}
                </text>
                <text
                  x={cx}
                  y={cy + scale * 0.4}
                  textAnchor="middle"
                  fontSize={scale * 0.24}
                  fontFamily="ui-monospace, monospace"
                  fill="#5a5a5a"
                >
                  h = {ceilingH.toFixed(1)} м
                </text>
              </g>
            );
          })}

        {/* Отметки уровней (справа) */}
        {[
          { y: groundY, label: "±0.000", title: "Уровень земли" },
          { y: slabTop, label: `+${(foundationH + slabH).toFixed(2)}`, title: "Чистый пол" },
          { y: ceilingTop, label: `+${(foundationH + slabH + ceilingH).toFixed(2)}`, title: "Потолок" },
          { y: roofRidge, label: `+${totalH.toFixed(2)}`, title: "Конёк" },
        ].map((lvl, i) => (
          <g key={i}>
            <line
              x1={ax(maxX) + 0.3 * scale}
              y1={lvl.y}
              x2={ax(maxX) + 1.2 * scale}
              y2={lvl.y}
              stroke="#1a1a1a"
              strokeWidth={0.6}
            />
            <polygon
              points={`
                ${ax(maxX) + 0.3 * scale},${lvl.y}
                ${ax(maxX) + 0.5 * scale},${lvl.y - 4}
                ${ax(maxX) + 0.5 * scale},${lvl.y + 4}
              `}
              fill="#1a1a1a"
            />
            <text
              x={ax(maxX) + 1.3 * scale}
              y={lvl.y - 3}
              fontSize={scale * 0.26}
              fontFamily="ui-monospace, monospace"
              fontWeight={700}
              fill="#1a1a1a"
            >
              {lvl.label}
            </text>
            <text
              x={ax(maxX) + 1.3 * scale}
              y={lvl.y + scale * 0.32}
              fontSize={scale * 0.21}
              fontFamily="ui-sans-serif"
              fill="#666"
            >
              {lvl.title}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
