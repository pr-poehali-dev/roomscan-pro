import {
  HousePlacement,
  ModularHouseProject,
  getModule,
} from "@/lib/modular-houses";

interface Props {
  project: ModularHouseProject;
  layout: HousePlacement[];
  /** Какой фасад показать */
  side: "front" | "side";
  /** Размер итогового SVG, px (по большой стороне) */
  size?: number;
  title?: string;
  /** ID для последующего скачивания SVG */
  svgId?: string;
}

/**
 * SVG-чертёж фасада (вид спереди или сбоку).
 * Реконструируется из layout: высота потолков по типу конструкции,
 * окна / двери — на основе типа модуля.
 */
export default function HouseFacadeSVG({
  project,
  layout,
  side,
  size = 480,
  title,
  svgId,
}: Props) {
  const modules = layout
    .map((p) => ({ p, m: getModule(p.moduleId) }))
    .filter((x): x is { p: HousePlacement; m: NonNullable<ReturnType<typeof getModule>> } => !!x.m);

  if (modules.length === 0) {
    return (
      <div className="aspect-[16/9] rounded-lg border-2 border-dashed border-border bg-secondary/30 flex items-center justify-center text-xs text-muted-foreground">
        Нет данных
      </div>
    );
  }

  // Высота потолков и стен из типа конструкции
  const ceilingH = project.construction === "futuristic" ? 3.0 : 2.7;
  const wallThickness = 0.2;
  const foundationH = 0.4;
  const roofH = project.construction === "futuristic" ? 0.3 : 1.2; // плоская / скатная
  const totalH = foundationH + ceilingH + 0.3 + roofH; // +перекрытие 0.3

  // Габариты вдоль выбранной оси: front = ось X, side = ось Z
  let minA = Infinity, maxA = -Infinity;
  for (const { p, m } of modules) {
    const isRot = !!p.rotationY;
    const w = isRot ? m.size[2] : m.size[0];
    const d = isRot ? m.size[0] : m.size[2];
    const a0 = side === "front" ? p.position[0] : p.position[1];
    const a1 = side === "front" ? p.position[0] + w : p.position[1] + d;
    // не учитываем террасу в фасаде, но учитываем габариты
    const _ = side === "front" ? d : w;
    void _;
    minA = Math.min(minA, a0);
    maxA = Math.max(maxA, a1);
  }

  const planW = maxA - minA;
  const padding = 1.8;
  const totalW = planW + padding * 2;
  const totalDH = totalH + padding * 1.6;

  const scale = Math.min(size / totalW, size * 0.6 / totalDH);
  const W = totalW * scale;
  const H = totalDH * scale;

  const groundY = (totalDH - padding * 0.8) * scale;
  const wallTop = groundY - (foundationH + ceilingH + 0.3) * scale;
  const foundationTop = groundY - foundationH * scale;
  const roofRidgeY = wallTop - roofH * scale;

  // Определяем уникальные сегменты вдоль выбранной оси (модули проецируются)
  const segments = modules
    .filter(({ m }) => m.type !== "terrace")
    .map(({ p, m }) => {
      const isRot = !!p.rotationY;
      const w = isRot ? m.size[2] : m.size[0];
      const d = isRot ? m.size[0] : m.size[2];
      const a0 = side === "front" ? p.position[0] : p.position[1];
      const a1 = side === "front" ? p.position[0] + w : p.position[1] + d;
      return { a0, a1, type: m.type, w, d };
    })
    .sort((a, b) => a.a0 - b.a0);

  const wallColor = project.construction === "futuristic"
    ? "#ECEAE6"
    : project.construction === "modular"
      ? "#D9CFAE"
      : "#E6D2A8";
  const accentColor = project.construction === "futuristic" ? "#3a3a3a" : "#5b3a1f";
  const windowColor = "#86b4d3";
  const roofColor = project.construction === "futuristic" ? "#2a2a2a" : "#5a3221";

  // Решаем где входная дверь — посередине общего фасада на front
  const facadeMidA = (minA + maxA) / 2;
  const doorWidth = 0.9;
  const doorA0 = facadeMidA - doorWidth / 2;
  const doorA1 = facadeMidA + doorWidth / 2;

  function ax(a: number): number {
    return (a - minA + padding) * scale;
  }

  // Окна для модуля: 1 окно в середине, шириной по 1/3 длины модуля
  const windowEls: { x: number; w: number }[] = [];
  for (const seg of segments) {
    if (seg.type === "tech" || seg.type === "corridor") continue;
    const winW = Math.min(2.0, Math.max(0.8, (seg.a1 - seg.a0) * 0.45));
    const center = (seg.a0 + seg.a1) / 2;
    windowEls.push({ x: ax(center - winW / 2), w: winW * scale });
  }

  // Точка крыши — посередине фасада
  const roofMidX = ax(facadeMidA);

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
          <pattern id={`fg-${svgId ?? "f"}`} width={scale * 5} height={scale * 5} patternUnits="userSpaceOnUse">
            <path d={`M ${scale * 5} 0 L 0 0 0 ${scale * 5}`} fill="none" stroke="#e8e6df" strokeWidth={0.5} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#fg-${svgId ?? "f"})`} />

        {/* Земля */}
        <line x1={0} y1={groundY} x2={W} y2={groundY} stroke="#1a1a1a" strokeWidth={1.5} />
        {Array.from({ length: 20 }).map((_, i) => (
          <line
            key={i}
            x1={(i / 20) * W}
            y1={groundY}
            x2={(i / 20) * W + 6}
            y2={groundY + 6}
            stroke="#1a1a1a"
            strokeWidth={0.6}
          />
        ))}

        {/* Фундамент */}
        <rect
          x={ax(minA)}
          y={foundationTop}
          width={planW * scale}
          height={foundationH * scale}
          fill="#a8a8a8"
          stroke="#1a1a1a"
          strokeWidth={1}
        />

        {/* Стены */}
        <rect
          x={ax(minA)}
          y={wallTop}
          width={planW * scale}
          height={(foundationTop - wallTop)}
          fill={wallColor}
          stroke="#1a1a1a"
          strokeWidth={1.4}
        />

        {/* Кровля */}
        {project.construction === "futuristic" ? (
          // Плоская кровля
          <rect
            x={ax(minA) - 4}
            y={wallTop - roofH * scale}
            width={planW * scale + 8}
            height={roofH * scale}
            fill={roofColor}
            stroke="#1a1a1a"
            strokeWidth={1.4}
          />
        ) : (
          // Скатная двускатная
          <polygon
            points={`
              ${ax(minA) - 6},${wallTop}
              ${roofMidX},${roofRidgeY}
              ${ax(maxA) + 6},${wallTop}
            `}
            fill={roofColor}
            stroke="#1a1a1a"
            strokeWidth={1.4}
          />
        )}

        {/* Окна */}
        {windowEls.map((w, i) => {
          const winH = ceilingH * 0.55 * scale;
          const winY = foundationTop - ceilingH * 0.78 * scale;
          return (
            <g key={i}>
              <rect
                x={w.x}
                y={winY}
                width={w.w}
                height={winH}
                fill={windowColor}
                stroke="#1a1a1a"
                strokeWidth={1}
              />
              <line
                x1={w.x + w.w / 2}
                y1={winY}
                x2={w.x + w.w / 2}
                y2={winY + winH}
                stroke="#1a1a1a"
                strokeWidth={0.7}
              />
              <line
                x1={w.x}
                y1={winY + winH / 2}
                x2={w.x + w.w}
                y2={winY + winH / 2}
                stroke="#1a1a1a"
                strokeWidth={0.7}
              />
            </g>
          );
        })}

        {/* Дверь (только на front) */}
        {side === "front" && (
          <g>
            <rect
              x={ax(doorA0)}
              y={foundationTop - 2.1 * scale}
              width={(doorA1 - doorA0) * scale}
              height={2.1 * scale}
              fill={accentColor}
              stroke="#1a1a1a"
              strokeWidth={1.2}
            />
            <circle
              cx={ax(doorA1) - scale * 0.15}
              cy={foundationTop - 1.05 * scale}
              r={2.2}
              fill="#f0c75a"
            />
          </g>
        )}

        {/* Размерные линии: общая ширина */}
        <g>
          <line
            x1={ax(minA)}
            y1={groundY + 0.55 * scale}
            x2={ax(maxA)}
            y2={groundY + 0.55 * scale}
            stroke="#1a1a1a"
            strokeWidth={0.6}
          />
          <line x1={ax(minA)} y1={groundY + 0.45 * scale} x2={ax(minA)} y2={groundY + 0.65 * scale} stroke="#1a1a1a" strokeWidth={0.6} />
          <line x1={ax(maxA)} y1={groundY + 0.45 * scale} x2={ax(maxA)} y2={groundY + 0.65 * scale} stroke="#1a1a1a" strokeWidth={0.6} />
          <text
            x={(ax(minA) + ax(maxA)) / 2}
            y={groundY + 1.05 * scale}
            textAnchor="middle"
            fontSize={scale * 0.32}
            fontFamily="ui-monospace, monospace"
            fill="#1a1a1a"
          >
            {planW.toFixed(1)} м
          </text>
        </g>

        {/* Размерная линия высоты (слева) */}
        <g>
          <line
            x1={ax(minA) - 0.55 * scale}
            y1={groundY}
            x2={ax(minA) - 0.55 * scale}
            y2={roofRidgeY}
            stroke="#1a1a1a"
            strokeWidth={0.6}
          />
          <line x1={ax(minA) - 0.65 * scale} y1={groundY} x2={ax(minA) - 0.45 * scale} y2={groundY} stroke="#1a1a1a" strokeWidth={0.6} />
          <line x1={ax(minA) - 0.65 * scale} y1={roofRidgeY} x2={ax(minA) - 0.45 * scale} y2={roofRidgeY} stroke="#1a1a1a" strokeWidth={0.6} />
          <text
            x={ax(minA) - 1.0 * scale}
            y={(groundY + roofRidgeY) / 2}
            textAnchor="middle"
            fontSize={scale * 0.32}
            fontFamily="ui-monospace, monospace"
            fill="#1a1a1a"
            transform={`rotate(-90 ${ax(minA) - 1.0 * scale} ${(groundY + roofRidgeY) / 2})`}
          >
            {(totalH).toFixed(1)} м
          </text>
        </g>

        {/* Уровень земли подпись */}
        <text
          x={W - 4}
          y={groundY - 4}
          textAnchor="end"
          fontSize={scale * 0.22}
          fontFamily="ui-monospace, monospace"
          fill="#666"
        >
          ±0.000
        </text>
      </svg>
    </div>
  );
}
