import Icon from "@/components/ui/icon";
import type { Transform } from "./roomTryOnUtils";

interface Props {
  roomPhoto: string;
  furnitureImage: string | null;
  itemName: string;
  transform: Transform;
  showHint: boolean;
  dragType: "move" | "scale" | "rotate" | null;
  onStartInteraction: (
    e: React.PointerEvent,
    type: "move" | "scale" | "rotate",
  ) => void;
}

/**
 * Канвас примерки: фото комнаты + наложение мебели + ручки масштаба и поворота + подсказка.
 * Логика 1:1 перенесена из RoomTryOn.tsx без изменений.
 */
export default function RoomTryOnCanvas({
  roomPhoto,
  furnitureImage,
  itemName,
  transform,
  showHint,
  dragType,
  onStartInteraction,
}: Props) {
  const overlayWidth = 300 * transform.scale;
  const overlayHeight = 200 * transform.scale;
  const overlayTransform = `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotation}deg) ${
    transform.flipped ? "scaleX(-1)" : ""
  }`;

  return (
    <>
      {/* Фото комнаты */}
      <img
        src={roomPhoto}
        alt="Ваша комната"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        draggable={false}
      />

      {/* Наложение мебели */}
      {furnitureImage && (
        <div
          onPointerDown={(e) => onStartInteraction(e, "move")}
          style={{
            position: "absolute",
            width: overlayWidth,
            height: overlayHeight,
            transform: overlayTransform,
            transformOrigin: "center",
            opacity: transform.opacity,
            cursor: dragType === "move" ? "grabbing" : "grab",
            touchAction: "none",
          }}
          className="will-change-transform"
        >
          <img
            src={furnitureImage}
            alt={itemName}
            className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
            draggable={false}
          />

          {/* Ручка масштаба */}
          <button
            onPointerDown={(e) => onStartInteraction(e, "scale")}
            className="absolute -bottom-3 -right-3 w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white touch-none"
            aria-label="Масштаб"
            style={{ touchAction: "none" }}
          >
            <Icon name="Maximize2" size={14} className="text-primary-foreground" />
          </button>

          {/* Ручка поворота */}
          <button
            onPointerDown={(e) => onStartInteraction(e, "rotate")}
            className="absolute -top-3 -right-3 w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white touch-none"
            aria-label="Поворот"
            style={{ touchAction: "none" }}
          >
            <Icon name="RotateCw" size={14} className="text-white" />
          </button>

          {/* Рамка-индикатор */}
          <div className="absolute inset-0 border-2 border-white/60 border-dashed pointer-events-none rounded" />
        </div>
      )}

      {/* Подсказка */}
      {showHint && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm border border-border rounded-full px-4 py-2 text-xs font-medium text-foreground shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top">
          <Icon name="MousePointer2" size={14} className="text-primary" />
          Тяни мебель — двигай по комнате
        </div>
      )}
    </>
  );
}
