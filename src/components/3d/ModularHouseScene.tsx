import { useMemo } from "react";
import Scene3D from "./Scene3D";
import {
  ModularHouseProject,
  HousePlacement,
  getModule,
  BlockModule,
} from "@/lib/modular-houses";
import { Site } from "./house/HouseSite";
import { RealisticHouseModule } from "./house/HouseModule";

interface Props {
  project: ModularHouseProject;
  customLayout?: HousePlacement[];
  selectedIndex?: number | null;
  onSelectModule?: (index: number) => void;
  onMoveModule?: (index: number, newPosition: [number, number]) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
  height?: number;
}

/**
 * Фотореалистичная сцена модульного дома:
 * - небо, солнечный свет, мягкие и контактные тени
 * - PBR-материалы: сайдинг, металлочерепица, окна со стёклами и рамами,
 *   деревянные террасы, входная дверь с филёнками и ручкой
 * - детали: двускатная крыша со свесами, цоколь, водосток, ступеньки крыльца
 * - окружение: трава, отмостка, аккуратный участок
 *
 * Точка входа: декомпозирован на:
 *   - house/HouseSite      — газон, дорожка, кусты
 *   - house/HouseModule    — основной модуль с drag-and-drop
 *   - house/HouseParts     — стены, окна, дверь, крыша
 *   - house/HouseHelpers   — палитра, выделение, подпись
 */
export default function ModularHouseScene({
  project,
  customLayout,
  selectedIndex,
  onSelectModule,
  onMoveModule,
  onCanvasReady,
  height = 540,
}: Props) {
  const layout = customLayout ?? project.layout;

  const placements = useMemo(() => {
    return layout
      .map((p, idx) => {
        const m = getModule(p.moduleId);
        if (!m) return null;
        return { module: m, placement: p, idx };
      })
      .filter(Boolean) as { module: BlockModule; placement: HousePlacement; idx: number }[];
  }, [layout]);

  const bounds = useMemo(() => {
    let minX = 0, maxX = 0, minZ = 0, maxZ = 0;
    for (const { module: m, placement: p } of placements) {
      const [w, , d] = m.size;
      const x1 = p.position[0];
      const z1 = p.position[1];
      const x2 = x1 + (p.rotationY ? d : w);
      const z2 = z1 + (p.rotationY ? w : d);
      if (x1 < minX) minX = x1;
      if (x2 > maxX) maxX = x2;
      if (z1 < minZ) minZ = z1;
      if (z2 > maxZ) maxZ = z2;
    }
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const span = Math.max(maxX - minX, maxZ - minZ, 6);
    return { cx, cz, span };
  }, [placements]);

  return (
    <Scene3D
      preset="outdoor"
      height={height}
      cameraPosition={[bounds.cx + bounds.span * 1.1, bounds.span * 0.8, bounds.cz + bounds.span * 1.2]}
      cameraTarget={[bounds.cx, 1.4, bounds.cz]}
      gridSize={Math.max(bounds.span * 3, 40)}
      hideGrid
      onCanvasReady={onCanvasReady}
    >
      <Site cx={bounds.cx} cz={bounds.cz} span={bounds.span} />

      {placements.map(({ module: m, placement, idx }) => (
        <RealisticHouseModule
          key={idx}
          module={m}
          placement={placement}
          isSelected={selectedIndex === idx}
          onSelect={() => onSelectModule?.(idx)}
          onMove={onMoveModule ? (p) => onMoveModule(idx, p) : undefined}
        />
      ))}
    </Scene3D>
  );
}
