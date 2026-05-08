import { Suspense, ReactNode, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  Environment,
  Sky,
  ContactShadows,
  SoftShadows,
} from "@react-three/drei";
import * as THREE from "three";
import Icon from "@/components/ui/icon";

interface Props {
  children: ReactNode;
  height?: string | number;
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
  gridSize?: number;
  hideGrid?: boolean;
  className?: string;
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
  /**
   * Режим отображения:
   * - "studio" (по умолчанию) — нейтральный фон, для инженерных узлов
   * - "outdoor" — небо, солнечный свет, контактные тени, мягкие тени, фотореалистичный режим
   */
  preset?: "studio" | "outdoor";
}

function CanvasReporter({ onReady }: { onReady?: (c: HTMLCanvasElement | null) => void }) {
  const { gl } = useThree();
  useEffect(() => {
    onReady?.(gl.domElement);
    return () => onReady?.(null);
  }, [gl, onReady]);
  return null;
}

/**
 * Универсальный 3D-холст. Поддерживает 2 пресета:
 * - studio: нейтральный фон с лёгкой подсветкой (для инженерки)
 * - outdoor: небо, солнечный свет, мягкие и контактные тени (для домов)
 */
export default function Scene3D({
  children,
  height = 480,
  cameraPosition = [6, 5, 8],
  cameraTarget = [0, 1, 0],
  gridSize = 20,
  hideGrid = false,
  className = "",
  onCanvasReady,
  preset = "studio",
}: Props) {
  const isOutdoor = preset === "outdoor";

  return (
    <div
      className={`relative w-full bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 rounded-xl overflow-hidden border border-border ${className}`}
      style={{ height }}
    >
      <Canvas
        shadows={isOutdoor ? { type: THREE.PCFSoftShadowMap } : true}
        camera={{ position: cameraPosition, fov: 45 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isOutdoor ? 1.0 : 1.05,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <CanvasReporter onReady={onCanvasReady} />

        {/* Фон / небо */}
        {isOutdoor ? (
          <>
            <color attach="background" args={["#bcd8f0"]} />
            <Sky
              distance={450000}
              sunPosition={[12, 18, 8]}
              inclination={0.49}
              azimuth={0.25}
              mieCoefficient={0.005}
              mieDirectionalG={0.8}
              rayleigh={2}
              turbidity={6}
            />
            <fog attach="fog" args={["#cfdfeb", 35, 90]} />
          </>
        ) : (
          <>
            <color attach="background" args={["#eef2f7"]} />
            <fog attach="fog" args={["#eef2f7", 25, 60]} />
          </>
        )}

        {/* Освещение */}
        {isOutdoor ? (
          <>
            <SoftShadows size={28} samples={12} focus={0.9} />
            <ambientLight intensity={0.42} color="#cfdfff" />
            <hemisphereLight args={["#cfe5ff", "#7d9263", 0.55]} />
            {/* Солнце */}
            <directionalLight
              position={[14, 18, 9]}
              intensity={2.4}
              color="#fff5e0"
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-camera-far={60}
              shadow-camera-left={-25}
              shadow-camera-right={25}
              shadow-camera-top={25}
              shadow-camera-bottom={-25}
              shadow-bias={-0.0005}
              shadow-normalBias={0.04}
            />
            {/* Заполняющий свет */}
            <directionalLight position={[-10, 8, -6]} intensity={0.45} color="#a4c8ff" />
          </>
        ) : (
          <>
            <ambientLight intensity={0.55} />
            <directionalLight
              position={[10, 12, 8]}
              intensity={1.1}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
              shadow-camera-far={30}
              shadow-camera-left={-15}
              shadow-camera-right={15}
              shadow-camera-top={15}
              shadow-camera-bottom={-15}
            />
            <directionalLight position={[-8, 6, -6]} intensity={0.35} />
          </>
        )}

        {/* Сетка-пол (только для studio) */}
        {!hideGrid && !isOutdoor && (
          <Grid
            args={[gridSize, gridSize]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#a3b3c2"
            sectionSize={2}
            sectionThickness={1.2}
            sectionColor="#1ea54a"
            fadeDistance={40}
            fadeStrength={1.2}
            infiniteGrid
            position={[0, 0, 0]}
          />
        )}

        <Suspense fallback={null}>
          <Environment preset={isOutdoor ? "park" : "city"} />
          {children}
        </Suspense>

        {/* Дополнительные мягкие тени для outdoor */}
        {isOutdoor && (
          <ContactShadows
            position={[cameraTarget[0], 0.005, cameraTarget[2]]}
            opacity={0.55}
            scale={Math.max(gridSize, 30)}
            blur={2.4}
            far={10}
            resolution={1024}
            color="#0a1218"
          />
        )}

        <OrbitControls
          target={cameraTarget}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={2}
          maxDistance={isOutdoor ? 60 : 30}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>

      <div className="absolute bottom-3 left-3 bg-card/85 backdrop-blur border border-border rounded-lg px-2.5 py-1.5 text-[10px] text-muted-foreground font-mono pointer-events-none flex items-center gap-1.5">
        <Icon name="Move3d" size={11} className="text-primary" />
        ЛКМ — поворот · ПКМ — перенос · колесо — зум
      </div>
    </div>
  );
}
