import { useMemo } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import Scene3D from "./Scene3D";
import {
  ModularHouseProject,
  HousePlacement,
  getModule,
  BlockModule,
} from "@/lib/modular-houses";

interface Props {
  project: ModularHouseProject;
  /** Кастомная сборка для конструктора */
  customLayout?: HousePlacement[];
  selectedIndex?: number | null;
  onSelectModule?: (index: number) => void;
  height?: number;
}

/**
 * 3D-сцена сборки модульного дома: модули как объёмные блоки,
 * крыша единым контуром, тени, подписи.
 */
export default function ModularHouseScene({
  project,
  customLayout,
  selectedIndex,
  onSelectModule,
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

  // Габариты застройки — для центрирования камеры
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
      height={height}
      cameraPosition={[bounds.cx + bounds.span * 0.9, bounds.span * 0.7, bounds.cz + bounds.span * 0.9]}
      cameraTarget={[bounds.cx, 1.4, bounds.cz]}
      gridSize={Math.max(bounds.span * 2, 30)}
    >
      {/* Площадка-фундамент */}
      <Foundation cx={bounds.cx} cz={bounds.cz} span={bounds.span} />

      {placements.map(({ module: m, placement, idx }) => (
        <ModuleMesh
          key={idx}
          module={m}
          placement={placement}
          isSelected={selectedIndex === idx}
          onSelect={() => onSelectModule?.(idx)}
        />
      ))}
    </Scene3D>
  );
}

/* ───────── Подкомпоненты ───────── */

function Foundation({ cx, cz, span }: { cx: number; cz: number; span: number }) {
  const size = span + 4;
  return (
    <mesh receiveShadow position={[cx, -0.05, cz]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color="#9aa3ad" />
    </mesh>
  );
}

interface MProps {
  module: BlockModule;
  placement: HousePlacement;
  isSelected: boolean;
  onSelect: () => void;
}

function ModuleMesh({ module: m, placement, isSelected, onSelect }: MProps) {
  const [w, h, d] = m.size;
  const isRotated = !!placement.rotationY;
  const realW = isRotated ? d : w;
  const realD = isRotated ? w : d;

  const cx = placement.position[0] + realW / 2;
  const cz = placement.position[1] + realD / 2;

  // Прозрачность открытой террасы
  const isTerrace = m.type === "terrace";

  return (
    <group
      position={[cx, h / 2, cz]}
      rotation={[0, placement.rotationY ?? 0, 0]}
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
      {/* Основной объём модуля */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={m.color}
          roughness={0.7}
          metalness={0.05}
          transparent={isTerrace}
          opacity={isTerrace ? 0.45 : 1}
          emissive={isSelected ? "#1ea54a" : "#000"}
          emissiveIntensity={isSelected ? 0.18 : 0}
        />
      </mesh>

      {/* Крыша двускатная (упрощённо — призма) */}
      {!isTerrace && (
        <mesh position={[0, h / 2 + 0.4, 0]} castShadow>
          <coneGeometry args={[Math.max(w, d) * 0.62, 0.8, 4]} />
          <meshStandardMaterial color="#3a4856" roughness={0.85} />
        </mesh>
      )}

      {/* Окно */}
      {m.type !== "tech" && m.type !== "terrace" && (
        <mesh position={[0, 0.15, d / 2 + 0.001]}>
          <planeGeometry args={[w * 0.5, h * 0.5]} />
          <meshStandardMaterial
            color="#7fbeff"
            metalness={0.6}
            roughness={0.15}
            emissive="#a6cfff"
            emissiveIntensity={0.15}
          />
        </mesh>
      )}

      {/* Дверь — у прихожих и санузлов */}
      {(m.type === "corridor" || m.type === "kitchen") && (
        <mesh position={[w / 2 - 0.45, -h / 2 + 1.05, d / 2 + 0.001]}>
          <planeGeometry args={[0.85, 2.1]} />
          <meshStandardMaterial color="#3d2b1f" roughness={0.85} />
        </mesh>
      )}

      {/* Контур при выделении */}
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
          <lineBasicMaterial color="#1ea54a" linewidth={2} />
        </lineSegments>
      )}

      {/* Подпись модуля */}
      <Html
        position={[0, h / 2 + 1.2, 0]}
        center
        distanceFactor={8}
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
          {m.name}
        </div>
      </Html>
    </group>
  );
}
