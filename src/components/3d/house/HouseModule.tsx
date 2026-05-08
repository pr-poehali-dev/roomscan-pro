import { useMemo, useRef, useState } from "react";
import { ThreeEvent, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BlockModule, HousePlacement } from "@/lib/modular-houses";
import {
  sidingTexture,
  woodTexture,
  metalRoofTexture,
  doorTexture,
} from "../HouseTextures";
import { Wall, Window, Door, PitchedRoof } from "./HouseParts";
import { Selection, Label, palette } from "./HouseHelpers";

interface MProps {
  module: BlockModule;
  placement: HousePlacement;
  isSelected: boolean;
  onSelect: () => void;
  onMove?: (newPos: [number, number]) => void;
}

/**
 * Один модуль дома в фотореалистичном стиле:
 * цоколь, стены с сайдингом, окна со стёклами и подоконниками, дверь со стеклянной вставкой,
 * двускатная крыша с фронтонами и конёком, водосток, крыльцо. Поддерживает drag-and-drop.
 *
 * Терраса рендерится отдельно — открытый деревянный настил с перилами.
 */
export function RealisticHouseModule({
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
