import { Dispatch, RefObject, SetStateAction } from "react";
import * as THREE from "three";
import Icon from "@/components/ui/icon";

interface Props {
  placedCount: number;
  selectedIdx: number | null;
  setSelectedIdx: Dispatch<SetStateAction<number | null>>;
  gestureMode: "place" | "edit";
  setGestureMode: Dispatch<SetStateAction<"place" | "edit">>;
  placedMeshesRef: RefObject<THREE.Mesh[]>;
  sceneRef: RefObject<THREE.Scene | null>;
  setPlacedCount: Dispatch<SetStateAction<number>>;
  clearPlaced: () => void;
  stopAR: () => void;
}

export default function ARActiveControls({
  placedCount,
  selectedIdx,
  setSelectedIdx,
  gestureMode,
  setGestureMode,
  placedMeshesRef,
  sceneRef,
  setPlacedCount,
  clearPlaced,
  stopAR,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center gap-2">
        <span className="w-2 h-2 bg-primary rounded-full pulse-dot" />
        <p className="text-sm font-bold text-foreground">AR активен</p>
        <span className="ml-auto text-xs font-mono text-primary">
          Поставлено: {placedCount}
        </span>
      </div>

      {/* Режим */}
      <div className="grid grid-cols-2 gap-2 bg-secondary/30 rounded-lg p-1">
        {(["place", "edit"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setGestureMode(m);
              if (m === "place") setSelectedIdx(null);
            }}
            className={`text-xs font-semibold py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              gestureMode === m
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon name={m === "place" ? "MousePointerClick" : "Move3d"} size={12} />
            {m === "place" ? "Установка" : "Редактор"}
          </button>
        ))}
      </div>

      {gestureMode === "place" ? (
        <p className="text-xs text-muted-foreground">
          Тапайте на экран в позиции зелёного кружка — мебель появится в реальном масштабе.
        </p>
      ) : placedCount === 0 ? (
        <p className="text-xs text-muted-foreground">
          Сначала поставьте хотя бы один предмет в режиме «Установка».
        </p>
      ) : (
        <>
          <div className="bg-secondary/40 rounded-lg p-3 space-y-2">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Жесты в режиме редактора
            </p>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <Icon name="Hand" size={12} className="text-primary" />
                <span className="text-foreground">1 палец — перемещение по полу</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="RotateCw" size={12} className="text-primary" />
                <span className="text-foreground">2 пальца — вращение</span>
              </div>
            </div>
          </div>

          {/* Селектор объекта */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIdx((i) => {
                const n = placedMeshesRef.current!.length;
                if (n === 0) return null;
                return i == null ? n - 1 : (i - 1 + n) % n;
              })}
              className="w-9 h-9 rounded-md bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center"
            >
              <Icon name="ChevronLeft" size={14} />
            </button>
            <div className="flex-1 text-center bg-secondary/40 rounded-md py-2">
              <p className="text-xs font-mono text-foreground font-semibold">
                {selectedIdx == null ? "Выберите объект" : `Объект ${selectedIdx + 1} из ${placedCount}`}
              </p>
            </div>
            <button
              onClick={() => setSelectedIdx((i) => {
                const n = placedMeshesRef.current!.length;
                if (n === 0) return null;
                return i == null ? 0 : (i + 1) % n;
              })}
              className="w-9 h-9 rounded-md bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center"
            >
              <Icon name="ChevronRight" size={14} />
            </button>
          </div>

          {/* Быстрые действия с выбранным */}
          {selectedIdx != null && (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  const mesh = placedMeshesRef.current![selectedIdx];
                  if (mesh) mesh.rotation.y -= Math.PI / 2;
                }}
                className="bg-secondary py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1 hover:bg-border transition-colors"
              >
                <Icon name="RotateCcw" size={12} />
                −90°
              </button>
              <button
                onClick={() => {
                  const mesh = placedMeshesRef.current![selectedIdx];
                  if (mesh) mesh.rotation.y += Math.PI / 2;
                }}
                className="bg-secondary py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1 hover:bg-border transition-colors"
              >
                <Icon name="RotateCw" size={12} />
                +90°
              </button>
              <button
                onClick={() => {
                  const mesh = placedMeshesRef.current![selectedIdx];
                  if (mesh && sceneRef.current) {
                    sceneRef.current.remove(mesh);
                    placedMeshesRef.current!.splice(selectedIdx, 1);
                    setPlacedCount(placedMeshesRef.current!.length);
                    setSelectedIdx(null);
                  }
                }}
                className="bg-destructive/10 text-destructive py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1 hover:bg-destructive/20 transition-colors"
              >
                <Icon name="Trash2" size={12} />
                Удалить
              </button>
            </div>
          )}
        </>
      )}

      <div className="flex gap-2">
        {placedCount > 0 && (
          <button
            onClick={clearPlaced}
            className="flex-1 bg-secondary text-secondary-foreground py-2.5 rounded-lg hover:bg-border transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <Icon name="Eraser" size={15} />
            Очистить
          </button>
        )}
        <button
          onClick={stopAR}
          className="flex-1 bg-destructive/10 text-destructive py-2.5 rounded-lg hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
        >
          <Icon name="X" size={15} />
          Завершить AR
        </button>
      </div>
    </div>
  );
}