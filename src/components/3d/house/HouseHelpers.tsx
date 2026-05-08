import * as THREE from "three";
import { Html } from "@react-three/drei";
import { BlockModule } from "@/lib/modular-houses";

/**
 * Палитра отделки модуля под его тип.
 * Возвращает цвета: стен, цоколя, крыши, наличников.
 */
export function palette(module: BlockModule): {
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

/**
 * Контур-подсветка выделенного / перетаскиваемого модуля.
 */
export function Selection({
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

/**
 * HTML-подпись над модулем с названием.
 */
export function Label({
  module: m,
  y,
  active,
}: {
  module: BlockModule;
  y: number;
  active: boolean;
}) {
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
