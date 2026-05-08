import { useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { ThreeEvent, useThree } from "@react-three/fiber";
import * as THREE from "three";
import Scene3D from "./Scene3D";
import {
  EquipmentItem,
  NodeTemplate,
  getEquipment,
  NodePlacement,
} from "@/lib/engineering";

interface Props {
  template: NodeTemplate;
  customLayout?: NodePlacement[];
  selectedId?: string | null;
  onSelect?: (equipmentId: string) => void;
  /** Drag-and-drop. Если задан — вызывается при отпускании мыши с новой позицией [x,y,z] */
  onMove?: (equipmentId: string, newPos: [number, number, number]) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
  height?: number;
}

/**
 * 3D-сцена котельной с оборудованием.
 * Поддерживает выделение и drag-and-drop по плоскости пола.
 */
export default function EngineeringScene({
  template,
  customLayout,
  selectedId,
  onSelect,
  onMove,
  onCanvasReady,
  height = 520,
}: Props) {
  const layout = customLayout ?? template.layout;
  const [w, h, d] = template.roomSize;

  const expanded = useMemo(() => {
    const result: {
      item: EquipmentItem;
      pos: [number, number, number];
      rot: number;
    }[] = [];
    for (const placement of layout) {
      const item = getEquipment(placement.equipmentId);
      if (!item) continue;
      const count = placement.count ?? 1;
      for (let i = 0; i < count; i++) {
        const offsetX = i * (item.size[0] + 0.15);
        result.push({
          item,
          pos: [
            placement.position[0] + offsetX,
            placement.position[1],
            placement.position[2],
          ],
          rot: placement.rotationY ?? 0,
        });
      }
    }
    return result;
  }, [layout]);

  return (
    <Scene3D
      height={height}
      cameraPosition={[w + 3, h + 1.5, d + 3]}
      cameraTarget={[w / 2, h / 2 - 0.4, d / 2]}
      gridSize={Math.max(w, d) * 3}
      onCanvasReady={onCanvasReady}
    >
      <Room w={w} h={h} d={d} />

      {expanded.map(({ item, pos, rot }, i) => (
        <EquipmentMesh
          key={`${item.id}-${i}`}
          item={item}
          position={pos}
          rotationY={rot}
          isSelected={selectedId === item.id}
          onSelect={() => onSelect?.(item.id)}
          onMove={onMove}
          roomBounds={[w, d]}
        />
      ))}
    </Scene3D>
  );
}

/* ───────── Подкомпоненты ───────── */

function Room({ w, h, d }: { w: number; h: number; d: number }) {
  return (
    <group>
      <mesh receiveShadow position={[w / 2, 0, d / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#dde3ea" />
      </mesh>
      <mesh receiveShadow position={[w / 2, h / 2, 0]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#f1f4f8" side={THREE.DoubleSide} />
      </mesh>
      <mesh receiveShadow position={[0, h / 2, d / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[d, h]} />
        <meshStandardMaterial color="#e7ecf2" side={THREE.DoubleSide} />
      </mesh>
      <lineSegments position={[w / 2, h / 2, d / 2]}>
        <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
        <lineBasicMaterial color="#1ea54a" opacity={0.4} transparent />
      </lineSegments>
    </group>
  );
}

interface EqProps {
  item: EquipmentItem;
  position: [number, number, number];
  rotationY: number;
  isSelected: boolean;
  onSelect: () => void;
  onMove?: (equipmentId: string, newPos: [number, number, number]) => void;
  roomBounds: [number, number];
}

function EquipmentMesh({
  item,
  position,
  rotationY,
  isSelected,
  onSelect,
  onMove,
  roomBounds,
}: EqProps) {
  const [sx, sy, sz] = item.size;
  const groupRef = useRef<THREE.Group>(null);
  const [dragging, setDragging] = useState(false);
  const [livePos, setLivePos] = useState<[number, number, number] | null>(null);
  const { camera, gl } = useThree();

  if (sx === 0 || sy === 0 || sz === 0) return null;

  const isCylinder =
    item.category === "expansion_tank" ||
    item.category === "boiler_tank" ||
    item.category === "chimney" ||
    item.category === "gas_cylinder" ||
    item.category === "evaporator";

  // Газгольдер — горизонтальный цилиндр (длина по Z)
  const isHorizontalTank = item.category === "gas_tank";

  const draggable = !!onMove;
  const renderPos = livePos ?? position;

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
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -position[1]);
    const hit = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, hit);
    if (!hit) return;

    const [rw, rd] = roomBounds;
    const newX = Math.max(sx / 2, Math.min(rw - sx / 2, hit.x)) - sx / 2;
    const newZ = Math.max(sz / 2, Math.min(rd - sz / 2, hit.z)) - sz / 2;

    setLivePos([newX, position[1], newZ]);
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging) return;
    e.stopPropagation();
    setDragging(false);
    if (livePos && onMove) {
      onMove(item.id, livePos);
    }
    setLivePos(null);
  };

  return (
    <group
      ref={groupRef}
      position={[renderPos[0] + sx / 2, renderPos[1], renderPos[2] + sz / 2]}
      rotation={[0, rotationY, 0]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = draggable ? "grab" : "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      <mesh castShadow receiveShadow rotation={isHorizontalTank ? [Math.PI / 2, 0, 0] : [0, 0, 0]}>
        {isHorizontalTank ? (
          <cylinderGeometry args={[Math.min(sx, sy) / 2, Math.min(sx, sy) / 2, sz, 32]} />
        ) : isCylinder ? (
          <cylinderGeometry args={[Math.min(sx, sz) / 2, Math.min(sx, sz) / 2, sy, 24]} />
        ) : (
          <boxGeometry args={[sx, sy, sz]} />
        )}
        <meshStandardMaterial
          color={item.color}
          metalness={isHorizontalTank ? 0.7 : 0.35}
          roughness={isHorizontalTank ? 0.35 : 0.5}
          emissive={isSelected || dragging ? "#1ea54a" : "#000"}
          emissiveIntensity={dragging ? 0.45 : isSelected ? 0.25 : 0}
        />
      </mesh>

      {(isSelected || dragging) && (
        <lineSegments rotation={isHorizontalTank ? [Math.PI / 2, 0, 0] : [0, 0, 0]}>
          <edgesGeometry
            args={[
              isHorizontalTank
                ? new THREE.CylinderGeometry(Math.min(sx, sy) / 2, Math.min(sx, sy) / 2, sz, 32)
                : isCylinder
                ? new THREE.CylinderGeometry(Math.min(sx, sz) / 2, Math.min(sx, sz) / 2, sy, 24)
                : new THREE.BoxGeometry(sx, sy, sz),
            ]}
          />
          <lineBasicMaterial color={dragging ? "#ff6f3c" : "#1ea54a"} linewidth={2} />
        </lineSegments>
      )}

      <Html
        position={[0, sy / 2 + 0.15, 0]}
        center
        distanceFactor={6}
        occlude={false}
        style={{ pointerEvents: "none" }}
      >
        <div
          className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shadow-md ${
            isSelected || dragging
              ? "bg-primary text-primary-foreground"
              : "bg-card text-foreground border border-border"
          }`}
        >
          {item.brand ? `${item.brand}` : item.name.split(" ").slice(0, 2).join(" ")}
        </div>
      </Html>
    </group>
  );
}