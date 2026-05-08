import { useMemo } from "react";
import * as THREE from "three";

/**
 * Стена: плоскость с PBR-сайдинговой текстурой, двусторонняя.
 */
export function Wall({
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

/**
 * Окно: рама из 4 планок + центральный штапик + стекло (возможно матовое) + подоконник.
 */
export function Window({
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

/**
 * Дверь: наличник + полотно с филёнчатой текстурой + стеклянное окошко сверху.
 */
export function Door({
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

/**
 * Фронтон (треугольник торца крыши).
 */
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

/**
 * Двускатная крыша: 2 ската, конёк, два фронтона.
 */
export function PitchedRoof({
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
