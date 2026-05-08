import { Suspense, ReactNode, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import Icon from "@/components/ui/icon";

interface Props {
  children: ReactNode;
  /** Высота канваса в пикселях или CSS */
  height?: string | number;
  /** Стартовая позиция камеры */
  cameraPosition?: [number, number, number];
  /** На какую точку смотрит камера */
  cameraTarget?: [number, number, number];
  /** Размер сетки на полу */
  gridSize?: number;
  /** Скрыть сетку */
  hideGrid?: boolean;
  /** Дополнительный класс контейнера */
  className?: string;
  /** Колбэк, через который наружу передаётся canvas (для PDF-снимков) */
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
}

/** Внутренний хук — пробрасывает canvas из контекста three наружу */
function CanvasReporter({ onReady }: { onReady?: (c: HTMLCanvasElement | null) => void }) {
  const { gl } = useThree();
  useEffect(() => {
    onReady?.(gl.domElement);
    return () => onReady?.(null);
  }, [gl, onReady]);
  return null;
}

/**
 * Универсальный 3D-холст: освещение, орбитальная камера, сетка.
 * Используется и для инженерных узлов, и для модульных домов.
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
}: Props) {
  return (
    <div
      className={`relative w-full bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 rounded-xl overflow-hidden border border-border ${className}`}
      style={{ height }}
    >
      <Canvas
        shadows
        camera={{ position: cameraPosition, fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
      >
        <CanvasReporter onReady={onCanvasReady} />
        <color attach="background" args={["#eef2f7"]} />
        <fog attach="fog" args={["#eef2f7", 25, 60]} />

        {/* Освещение */}
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

        {/* Сетка-пол */}
        {!hideGrid && (
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
          <Environment preset="city" />
          {children}
        </Suspense>

        <OrbitControls
          target={cameraTarget}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={2}
          maxDistance={30}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>

      {/* Подсказка по управлению */}
      <div className="absolute bottom-3 left-3 bg-card/85 backdrop-blur border border-border rounded-lg px-2.5 py-1.5 text-[10px] text-muted-foreground font-mono pointer-events-none flex items-center gap-1.5">
        <Icon name="Move3d" size={11} className="text-primary" />
        ЛКМ — поворот · ПКМ — перенос · колесо — зум
      </div>
    </div>
  );
}