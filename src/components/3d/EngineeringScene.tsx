import { useMemo } from "react";
import { Html } from "@react-three/drei";
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
  /** Кастомные размещения (для конструктора). Если задано — игнорирует template.layout */
  customLayout?: NodePlacement[];
  /** Подсветить выбранное оборудование */
  selectedId?: string | null;
  onSelect?: (equipmentId: string) => void;
  height?: number;
}

/**
 * 3D-сцена котельной: помещение + размещённое оборудование
 * с аннотациями и кликабельными подсказками.
 */
export default function EngineeringScene({
  template,
  customLayout,
  selectedId,
  onSelect,
  height = 520,
}: Props) {
  const layout = customLayout ?? template.layout;
  const [w, h, d] = template.roomSize;

  // Развёрнутый список с дублированием count
  const expanded = useMemo(() => {
    const result: { item: EquipmentItem; pos: [number, number, number]; rot: number }[] = [];
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
    >
      {/* Помещение котельной — стены + пол */}
      <Room w={w} h={h} d={d} />

      {/* Оборудование */}
      {expanded.map(({ item, pos, rot }, i) => (
        <EquipmentMesh
          key={`${item.id}-${i}`}
          item={item}
          position={pos}
          rotationY={rot}
          isSelected={selectedId === item.id}
          onSelect={() => onSelect?.(item.id)}
        />
      ))}
    </Scene3D>
  );
}

/* ───────── Подкомпоненты ───────── */

function Room({ w, h, d }: { w: number; h: number; d: number }) {
  return (
    <group>
      {/* Пол */}
      <mesh receiveShadow position={[w / 2, 0, d / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#dde3ea" />
      </mesh>

      {/* Задняя стена */}
      <mesh receiveShadow position={[w / 2, h / 2, 0]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#f1f4f8" side={THREE.DoubleSide} />
      </mesh>

      {/* Левая стена */}
      <mesh receiveShadow position={[0, h / 2, d / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[d, h]} />
        <meshStandardMaterial color="#e7ecf2" side={THREE.DoubleSide} />
      </mesh>

      {/* Контурный каркас комнаты для наглядности */}
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
}

function EquipmentMesh({ item, position, rotationY, isSelected, onSelect }: EqProps) {
  const [sx, sy, sz] = item.size;
  // Скрываем «работы» и трубопроводы в 3D — у них нулевые размеры
  if (sx === 0 || sy === 0 || sz === 0) return null;

  const isCylinder =
    item.category === "expansion_tank" ||
    item.category === "boiler_tank" ||
    item.category === "chimney";

  return (
    <group
      position={[position[0] + sx / 2, position[1], position[2] + sz / 2]}
      rotation={[0, rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      <mesh castShadow receiveShadow>
        {isCylinder ? (
          <cylinderGeometry args={[Math.min(sx, sz) / 2, Math.min(sx, sz) / 2, sy, 24]} />
        ) : (
          <boxGeometry args={[sx, sy, sz]} />
        )}
        <meshStandardMaterial
          color={item.color}
          metalness={0.35}
          roughness={0.5}
          emissive={isSelected ? "#1ea54a" : "#000"}
          emissiveIntensity={isSelected ? 0.25 : 0}
        />
      </mesh>

      {/* Контур при выделении */}
      {isSelected && (
        <lineSegments>
          <edgesGeometry
            args={[
              isCylinder
                ? new THREE.CylinderGeometry(Math.min(sx, sz) / 2, Math.min(sx, sz) / 2, sy, 24)
                : new THREE.BoxGeometry(sx, sy, sz),
            ]}
          />
          <lineBasicMaterial color="#1ea54a" linewidth={2} />
        </lineSegments>
      )}

      {/* Подпись */}
      <Html
        position={[0, sy / 2 + 0.15, 0]}
        center
        distanceFactor={6}
        occlude={false}
        style={{ pointerEvents: "none" }}
      >
        <div
          className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shadow-md ${
            isSelected
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
