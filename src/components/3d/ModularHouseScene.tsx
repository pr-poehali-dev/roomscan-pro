import { useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { ThreeEvent, useThree } from "@react-three/fiber";
import * as THREE from "three";
import Scene3D from "./Scene3D";
import {
  ModularHouseProject,
  HousePlacement,
  getModule,
  BlockModule,
} from "@/lib/modular-houses";
import {
  sidingTexture,
  woodTexture,
  metalRoofTexture,
  grassTexture,
  pavingTexture,
  doorTexture,
} from "./HouseTextures";

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

/* ──────────────────────── УЧАСТОК ──────────────────────── */

function Site({ cx, cz, span }: { cx: number; cz: number; span: number }) {
  const grass = useMemo(() => {
    const tiles = Math.max(8, Math.round(span * 2));
    return grassTexture([tiles, tiles]);
  }, [span]);
  const paving = useMemo(() => pavingTexture([2, 2]), []);

  const grassSize = span + 30;

  return (
    <group>
      <mesh receiveShadow position={[cx, -0.01, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[grassSize, grassSize]} />
        <meshStandardMaterial map={grass} roughness={1} metalness={0} color="#9bc06f" />
      </mesh>

      <mesh receiveShadow position={[cx + span * 0.9, 0.006, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[span * 1.6, 1.4]} />
        <meshStandardMaterial map={paving} roughness={0.9} color="#a8a29a" />
      </mesh>

      <Bush position={[cx + span * 0.7, 0, cz - span * 0.7]} />
      <Bush position={[cx - span * 0.7, 0, cz + span * 0.7]} scale={1.2} />
      <Bush position={[cx + span * 0.65, 0, cz + span * 0.6]} scale={0.8} />
    </group>
  );
}

function Bush({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const positions: [number, number, number][] = [
    [0, 0.3 * scale, 0],
    [0.25 * scale, 0.5 * scale, 0.1 * scale],
    [-0.2 * scale, 0.45 * scale, -0.1 * scale],
    [0.05 * scale, 0.65 * scale, -0.2 * scale],
  ];
  return (
    <group position={position}>
      {positions.map((p, i) => (
        <mesh key={i} castShadow position={p}>
          <icosahedronGeometry args={[0.32 * scale, 0]} />
          <meshStandardMaterial color="#3f6a2c" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/* ──────────────────────── МОДУЛЬ ДОМА ──────────────────────── */

interface MProps {
  module: BlockModule;
  placement: HousePlacement;
  isSelected: boolean;
  onSelect: () => void;
  onMove?: (newPos: [number, number]) => void;
}

function palette(module: BlockModule): {
  wall: string;
  base: string;
  roof: string;
  trim: string;
} {
  switch (module.type) {
    case "living":
      return { wall: "#e8d8b8", base: "#3a3a3a", roof: "#3a4a5a", trim: "#ffffff" };
    case "kitchen":
      return { wall: "#d8c79a", base: "#3a3a3a", roof: "#5a3a30", trim: "#ffffff" };
    case "bath":
      return { wall: "#cdd6dd", base: "#3a3a3a", roof: "#3a4a5a", trim: "#ffffff" };
    case "tech":
      return { wall: "#a4a8ad", base: "#2c2c2c", roof: "#2c2c2c", trim: "#dddddd" };
    case "terrace":
      return { wall: "#9a7848", base: "#3a3a3a", roof: "#3a4a5a", trim: "#7a5a3a" };
    case "corridor":
      return { wall: "#dac8a4", base: "#3a3a3a", roof: "#3a4a5a", trim: "#ffffff" };
    default:
      return { wall: "#e0d0b0", base: "#3a3a3a", roof: "#3a4a5a", trim: "#ffffff" };
  }
}

function RealisticHouseModule({
  module: m,
  placement,
  isSelected,
  onSelect,
  onMove,
}: MProps) {
  const [w, h, d] = m.size;
  const isRotated = !!placement.rotationY;
  const realW = isRotated ? d : w;
  const realD = isRotated ? w : d;

  const groupRef = useRef<THREE.Group>(null);
  const [dragging, setDragging] = useState(false);
  const [livePos, setLivePos] = useState<[number, number] | null>(null);
  const { camera, gl } = useThree();

  const draggable = !!onMove;
  const renderPos = livePos ?? placement.position;
  const cx = renderPos[0] + realW / 2;
  const cz = renderPos[1] + realD / 2;

  const isTerrace = m.type === "terrace";
  const isTech = m.type === "tech";
  const isBath = m.type === "bath";
  const hasDoor = m.type === "corridor" || m.type === "kitchen";

  const pal = useMemo(() => palette(m), [m]);

  const wallMap = useMemo(
    () => sidingTexture(pal.wall, [Math.max(1, Math.round(w / 1.5)), Math.max(2, Math.round(h * 1.2))]),
    [pal.wall, w, h],
  );
  const roofMap = useMemo(
    () => metalRoofTexture(pal.roof, [Math.max(2, Math.round(w / 0.8)), Math.max(2, Math.round(d / 1.2))]),
    [pal.roof, w, d],
  );
  const woodMap = useMemo(() => woodTexture("#8a6a44", [Math.max(2, Math.round(w / 1.5)), 1]), [w]);
  const doorMap = useMemo(() => doorTexture("#4a2f1c"), []);

  /* ───── Drag-and-drop ───── */
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onSelect();
    if (!draggable) return;
    setDragging(true);
    (e.target as Element)?.setPointerCapture?.(e.pointerId);
  };
  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging || !draggable) return;
    e.stopPropagation();
    const rect = gl.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, hit);
    if (!hit) return;
    const snap = 0.5;
    const newX = Math.round((hit.x - realW / 2) / snap) * snap;
    const newZ = Math.round((hit.z - realD / 2) / snap) * snap;
    setLivePos([newX, newZ]);
  };
  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging) return;
    e.stopPropagation();
    setDragging(false);
    if (livePos && onMove) onMove(livePos);
    setLivePos(null);
  };

  const baseH = 0.4;
  const wallH = h - baseH;
  const roofOverhang = 0.35;
  const ridgeH = 0.9;

  /* ───── Терраса (открытая) ───── */
  if (isTerrace) {
    return (
      <group
        ref={groupRef}
        position={[cx, 0, cz]}
        rotation={[0, placement.rotationY ?? 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = draggable ? "grab" : "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "default"; }}
      >
        <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
          <boxGeometry args={[w, 0.15, d]} />
          <meshStandardMaterial map={woodMap} roughness={0.85} />
        </mesh>
        {/* Перила */}
        <mesh position={[0, 0.6, -d / 2 + 0.04]} castShadow>
          <boxGeometry args={[w, 0.08, 0.04]} />
          <meshStandardMaterial color="#6a4a2a" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.6, d / 2 - 0.04]} castShadow>
          <boxGeometry args={[w, 0.08, 0.04]} />
          <meshStandardMaterial color="#6a4a2a" roughness={0.85} />
        </mesh>
        <mesh position={[-w / 2 + 0.04, 0.6, 0]} castShadow>
          <boxGeometry args={[0.04, 0.08, d]} />
          <meshStandardMaterial color="#6a4a2a" roughness={0.85} />
        </mesh>
        {/* Столбики перил */}
        {Array.from({ length: Math.max(2, Math.floor(w / 0.8)) }).map((_, i, arr) => {
          const x = -w / 2 + (i / Math.max(1, arr.length - 1)) * w;
          return (
            <group key={`pf-${i}`}>
              <mesh position={[x, 0.4, -d / 2 + 0.04]} castShadow>
                <boxGeometry args={[0.06, 0.5, 0.06]} />
                <meshStandardMaterial color="#7a5a3a" roughness={0.9} />
              </mesh>
              <mesh position={[x, 0.4, d / 2 - 0.04]} castShadow>
                <boxGeometry args={[0.06, 0.5, 0.06]} />
                <meshStandardMaterial color="#7a5a3a" roughness={0.9} />
              </mesh>
            </group>
          );
        })}

        <Selection box={[w, 0.5, d]} pos={[0, 0.25, 0]} active={isSelected || dragging} dragging={dragging} />
        <Label module={m} y={1.6} active={isSelected || dragging} />
      </group>
    );
  }

  /* ───── Жилой/прочий модуль ───── */
  return (
    <group
      ref={groupRef}
      position={[cx, 0, cz]}
      rotation={[0, placement.rotationY ?? 0, 0]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = draggable ? "grab" : "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = "default"; }}
    >
      {/* Цоколь (бетонный) */}
      <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.05, baseH, d + 0.05]} />
        <meshStandardMaterial color={pal.base} roughness={0.95} metalness={0.02} />
      </mesh>

      {/* Стены */}
      <group position={[0, baseH + wallH / 2, 0]}>
        <Wall width={w} height={wallH} map={wallMap} color={pal.wall} position={[0, 0, d / 2 + 0.001]} rotationY={0} />
        <Wall width={w} height={wallH} map={wallMap} color={pal.wall} position={[0, 0, -d / 2 - 0.001]} rotationY={Math.PI} />
        <Wall width={d} height={wallH} map={wallMap} color={pal.wall} position={[-w / 2 - 0.001, 0, 0]} rotationY={-Math.PI / 2} />
        <Wall width={d} height={wallH} map={wallMap} color={pal.wall} position={[w / 2 + 0.001, 0, 0]} rotationY={Math.PI / 2} />
      </group>

      {/* Угловые накладки */}
      {([
        [-w / 2, baseH + wallH / 2, -d / 2],
        [w / 2, baseH + wallH / 2, -d / 2],
        [-w / 2, baseH + wallH / 2, d / 2],
        [w / 2, baseH + wallH / 2, d / 2],
      ] as [number, number, number][]).map((pos, i) => (
        <mesh key={`corner-${i}`} position={pos} castShadow>
          <boxGeometry args={[0.08, wallH, 0.08]} />
          <meshStandardMaterial color={pal.trim} roughness={0.7} />
        </mesh>
      ))}

      {/* Окна */}
      {!isTech && !isBath && (
        <>
          <Window
            position={[0, baseH + wallH * 0.55, d / 2 + 0.025]}
            width={Math.min(w * 0.45, 1.6)}
            height={Math.min(wallH * 0.5, 1.3)}
            trim={pal.trim}
          />
          <Window
            position={[0, baseH + wallH * 0.55, -d / 2 - 0.025]}
            width={Math.min(w * 0.45, 1.6)}
            height={Math.min(wallH * 0.5, 1.3)}
            trim={pal.trim}
            backside
          />
        </>
      )}

      {isBath && (
        <Window
          position={[0, baseH + wallH * 0.7, d / 2 + 0.025]}
          width={Math.min(0.7, w * 0.3)}
          height={Math.min(0.5, wallH * 0.3)}
          trim={pal.trim}
          frosted
        />
      )}

      {/* Боковые окна для длинного жилого */}
      {m.type === "living" && d > 5 && (
        <>
          <Window
            position={[w / 2 + 0.025, baseH + wallH * 0.55, d * 0.2]}
            width={Math.min(d * 0.25, 1.4)}
            height={Math.min(wallH * 0.5, 1.3)}
            trim={pal.trim}
            rotationY={Math.PI / 2}
          />
          <Window
            position={[-w / 2 - 0.025, baseH + wallH * 0.55, -d * 0.2]}
            width={Math.min(d * 0.25, 1.4)}
            height={Math.min(wallH * 0.5, 1.3)}
            trim={pal.trim}
            rotationY={-Math.PI / 2}
          />
        </>
      )}

      {/* Дверь и крыльцо */}
      {hasDoor && (
        <>
          <Door
            position={[w * 0.3, baseH, d / 2 + 0.025]}
            width={Math.min(0.95, w * 0.3)}
            height={Math.min(2.1, wallH * 0.85)}
            map={doorMap}
            trim={pal.trim}
          />
          <group position={[w * 0.3, 0, d / 2 + 0.4]}>
            <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.4, 0.12, 0.45]} />
              <meshStandardMaterial color="#8b8378" roughness={0.95} />
            </mesh>
            <mesh position={[0, 0.2, -0.15]} castShadow receiveShadow>
              <boxGeometry args={[1.2, 0.12, 0.32]} />
              <meshStandardMaterial color="#8b8378" roughness={0.95} />
            </mesh>
          </group>
        </>
      )}

      {/* Двускатная крыша */}
      <PitchedRoof
        w={w}
        d={d}
        ridgeH={ridgeH}
        overhang={roofOverhang}
        y={baseH + wallH}
        map={roofMap}
        gableColor={pal.wall}
      />

      {/* Водосток (горизонтальный жёлоб) */}
      <mesh
        position={[0, baseH + wallH - 0.05, d / 2 + roofOverhang - 0.05]}
        castShadow
      >
        <cylinderGeometry args={[0.04, 0.04, w + roofOverhang * 2 - 0.2, 12]} />
        <meshStandardMaterial color="#888" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Стояк водостока */}
      <mesh
        position={[w / 2 - 0.15, (baseH + wallH) / 2, d / 2 + roofOverhang - 0.05]}
        castShadow
      >
        <cylinderGeometry args={[0.04, 0.04, baseH + wallH, 12]} />
        <meshStandardMaterial color="#888" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Дымоход для технического модуля */}
      {isTech && (
        <mesh position={[w * 0.3, baseH + wallH + ridgeH + 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 1.2, 12]} />
          <meshStandardMaterial color="#3a3a3a" roughness={0.6} metalness={0.4} />
        </mesh>
      )}

      <Selection
        box={[w + 0.1, baseH + wallH + ridgeH, d + 0.1]}
        pos={[0, (baseH + wallH + ridgeH) / 2, 0]}
        active={isSelected || dragging}
        dragging={dragging}
      />

      <Label module={m} y={baseH + wallH + ridgeH + 0.4} active={isSelected || dragging} />
    </group>
  );
}

/* ──────────────────────── ЭЛЕМЕНТЫ ──────────────────────── */

function Wall({
  width,
  height,
  map,
  color,
  position,
  rotationY,
}: {
  width: number;
  height: number;
  map: THREE.Texture;
  color: string;
  position: [number, number, number];
  rotationY: number;
}) {
  return (
    <mesh position={position} rotation={[0, rotationY, 0]} castShadow receiveShadow>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        map={map}
        color={color}
        roughness={0.78}
        metalness={0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Window({
  position,
  width,
  height,
  trim,
  rotationY = 0,
  backside = false,
  frosted = false,
}: {
  position: [number, number, number];
  width: number;
  height: number;
  trim: string;
  rotationY?: number;
  backside?: boolean;
  frosted?: boolean;
}) {
  const frameDepth = 0.06;
  const frameTh = 0.08;
  const yRot = rotationY + (backside ? Math.PI : 0);
  const sillDepth = 0.16;

  return (
    <group position={position} rotation={[0, yRot, 0]}>
      <mesh position={[0, height / 2 - frameTh / 2, 0]} castShadow>
        <boxGeometry args={[width, frameTh, frameDepth]} />
        <meshStandardMaterial color={trim} roughness={0.55} />
      </mesh>
      <mesh position={[0, -height / 2 + frameTh / 2, 0]} castShadow>
        <boxGeometry args={[width, frameTh, frameDepth]} />
        <meshStandardMaterial color={trim} roughness={0.55} />
      </mesh>
      <mesh position={[-width / 2 + frameTh / 2, 0, 0]} castShadow>
        <boxGeometry args={[frameTh, height, frameDepth]} />
        <meshStandardMaterial color={trim} roughness={0.55} />
      </mesh>
      <mesh position={[width / 2 - frameTh / 2, 0, 0]} castShadow>
        <boxGeometry args={[frameTh, height, frameDepth]} />
        <meshStandardMaterial color={trim} roughness={0.55} />
      </mesh>
      {/* Центральный штапик */}
      <mesh position={[0, 0, 0.001]} castShadow>
        <boxGeometry args={[0.04, Math.max(0.05, height - frameTh * 2), frameDepth - 0.01]} />
        <meshStandardMaterial color={trim} roughness={0.55} />
      </mesh>

      {/* Стекло */}
      <mesh position={[0, 0, 0.003]}>
        <planeGeometry
          args={[
            Math.max(0.05, width - frameTh * 2 - 0.02),
            Math.max(0.05, height - frameTh * 2 - 0.02),
          ]}
        />
        <meshPhysicalMaterial
          color={frosted ? "#cfd9e0" : "#9cc4e8"}
          metalness={0}
          roughness={frosted ? 0.55 : 0.05}
          transmission={frosted ? 0 : 0.85}
          thickness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={1.4}
          ior={1.45}
          opacity={frosted ? 0.85 : 0.8}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Подоконник */}
      <mesh
        position={[0, -height / 2 - 0.04, sillDepth / 2 - frameDepth / 2]}
        castShadow
      >
        <boxGeometry args={[width + 0.1, 0.04, sillDepth]} />
        <meshStandardMaterial color={trim} roughness={0.6} />
      </mesh>
    </group>
  );
}

function Door({
  position,
  width,
  height,
  map,
  trim,
}: {
  position: [number, number, number];
  width: number;
  height: number;
  map: THREE.Texture;
  trim: string;
}) {
  const frameTh = 0.07;
  return (
    <group position={position}>
      <mesh position={[0, height / 2, -0.005]} castShadow>
        <boxGeometry args={[width + frameTh * 2, height + frameTh, 0.04]} />
        <meshStandardMaterial color={trim} roughness={0.6} />
      </mesh>
      <mesh position={[0, height / 2, 0.025]} castShadow>
        <boxGeometry args={[width, height, 0.05]} />
        <meshStandardMaterial map={map} roughness={0.7} />
      </mesh>
      <mesh position={[0, height * 0.78, 0.052]}>
        <planeGeometry args={[width * 0.6, height * 0.18]} />
        <meshPhysicalMaterial
          color="#9cc4e8"
          roughness={0.05}
          transmission={0.85}
          thickness={0.04}
          opacity={0.8}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/* ──────────────────────── КРЫША ──────────────────────── */

function PitchedRoof({
  w,
  d,
  ridgeH,
  overhang,
  y,
  map,
  gableColor,
}: {
  w: number;
  d: number;
  ridgeH: number;
  overhang: number;
  y: number;
  map: THREE.Texture;
  gableColor: string;
}) {
  const slopeLen = Math.sqrt((w / 2 + overhang) ** 2 + ridgeH ** 2);
  const slopeAngle = Math.atan2(ridgeH, w / 2 + overhang);
  const roofD = d + overhang * 2;

  return (
    <group position={[0, y, 0]}>
      {/* Левый скат */}
      <mesh
        position={[-((w / 2 + overhang) / 2), ridgeH / 2, 0]}
        rotation={[0, 0, slopeAngle]}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[slopeLen, roofD]} />
        <meshStandardMaterial
          map={map}
          roughness={0.5}
          metalness={0.3}
          side={THREE.DoubleSide}
          color="#e0e0e0"
        />
      </mesh>
      {/* Правый скат */}
      <mesh
        position={[(w / 2 + overhang) / 2, ridgeH / 2, 0]}
        rotation={[0, 0, -slopeAngle]}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[slopeLen, roofD]} />
        <meshStandardMaterial
          map={map}
          roughness={0.5}
          metalness={0.3}
          side={THREE.DoubleSide}
          color="#e0e0e0"
        />
      </mesh>

      {/* Конёк */}
      <mesh position={[0, ridgeH, 0]} castShadow>
        <boxGeometry args={[0.12, 0.08, roofD]} />
        <meshStandardMaterial color="#444" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Фронтоны */}
      <Gable w={w} ridgeH={ridgeH} z={d / 2 + 0.001} color={gableColor} />
      <Gable w={w} ridgeH={ridgeH} z={-d / 2 - 0.001} color={gableColor} flip />
    </group>
  );
}

function Gable({
  w,
  ridgeH,
  z,
  color,
  flip = false,
}: {
  w: number;
  ridgeH: number;
  z: number;
  color: string;
  flip?: boolean;
}) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0);
    s.lineTo(w / 2, 0);
    s.lineTo(0, ridgeH);
    s.lineTo(-w / 2, 0);
    return s;
  }, [w, ridgeH]);

  return (
    <mesh position={[0, 0, z]} rotation={[0, flip ? Math.PI : 0, 0]} castShadow>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color={color} roughness={0.78} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ──────────────────────── ВЫДЕЛЕНИЕ + ЛЕЙБЛ ──────────────────────── */

function Selection({
  box,
  pos,
  active,
  dragging,
}: {
  box: [number, number, number];
  pos: [number, number, number];
  active: boolean;
  dragging: boolean;
}) {
  if (!active) return null;
  return (
    <lineSegments position={pos}>
      <edgesGeometry args={[new THREE.BoxGeometry(box[0], box[1], box[2])]} />
      <lineBasicMaterial color={dragging ? "#ff6f3c" : "#1ea54a"} linewidth={2} />
    </lineSegments>
  );
}

function Label({ module: m, y, active }: { module: BlockModule; y: number; active: boolean }) {
  return (
    <Html
      position={[0, y, 0]}
      center
      distanceFactor={9}
      occlude={false}
      style={{ pointerEvents: "none" }}
    >
      <div
        className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shadow-md ${
          active
            ? "bg-primary text-primary-foreground"
            : "bg-card/90 backdrop-blur text-foreground border border-border"
        }`}
      >
        {m.name}
      </div>
    </Html>
  );
}
