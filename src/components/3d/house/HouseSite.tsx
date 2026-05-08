import { useMemo } from "react";
import { grassTexture, pavingTexture } from "../HouseTextures";

/**
 * Декоративный кустик: 4 икосаэдра разного размера в одной куче.
 */
export function Bush({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
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

/**
 * Участок: газон с травяной текстурой, плиточная дорожка к дому, декоративные кусты по углам.
 */
export function Site({ cx, cz, span }: { cx: number; cz: number; span: number }) {
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
