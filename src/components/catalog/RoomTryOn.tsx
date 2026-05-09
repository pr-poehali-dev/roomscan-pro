import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import type { FurnitureItem } from "@/lib/furnitureCatalog";
import RoomTryOnUploadScreen from "./room-tryon/RoomTryOnUploadScreen";
import RoomTryOnCanvas from "./room-tryon/RoomTryOnCanvas";
import RoomTryOnControls from "./room-tryon/RoomTryOnControls";
import {
  STORAGE_KEY,
  loadImage,
  generateFallback,
  type Transform,
} from "./room-tryon/roomTryOnUtils";

interface Props {
  item: FurnitureItem;
  onClose: () => void;
}

/**
 * Виртуальная примерка мебели на фото реальной комнаты.
 * Работает кросс-платформенно (iOS / Android / Desktop).
 *
 * Поток:
 *  1. Пользователь делает или загружает фото комнаты
 *  2. Поверх накладывается изображение мебели
 *  3. Двигает / масштабирует / поворачивает / меняет прозрачность
 *  4. Сохраняет результат в PNG
 *
 * Декомпозиция (логика 1:1 совпадает с прежней монолитной версией):
 *  - RoomTryOnUploadScreen — экран загрузки фото
 *  - RoomTryOnCanvas       — фото комнаты + наложение мебели + ручки + подсказка
 *  - RoomTryOnControls     — нижняя панель управления (масштаб, поворот, зеркало, сброс)
 */
export default function RoomTryOn({ item, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [roomPhoto, setRoomPhoto] = useState<string | null>(null);
  const [furnitureImage, setFurnitureImage] = useState<string | null>(null);
  const [transform, setTransform] = useState<Transform>({
    x: 0,
    y: 0,
    scale: 0.5,
    rotation: 0,
    flipped: false,
    opacity: 1,
  });
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Drag state
  const dragRef = useRef<{
    type: "move" | "scale" | "rotate" | null;
    startX: number;
    startY: number;
    startTransform: Transform;
  }>({ type: null, startX: 0, startY: 0, startTransform: transform });

  /* ────── Восстановление сохранённого фото ────── */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setRoomPhoto(stored);
    } catch {
      /* noop */
    }
  }, []);

  /* ────── Загрузка изображения дивана ────── */
  useEffect(() => {
    const url = item.imageUrl;
    if (url) {
      setFurnitureImage(url);
      return;
    }
    // Если нет imageUrl — генерируем плейсхолдер из иконки + цвета
    const fallback = generateFallback(item);
    setFurnitureImage(fallback);
  }, [item]);

  /* ────── Центрирование наложения при первой загрузке фото ────── */
  useEffect(() => {
    if (!roomPhoto || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTransform((prev) => ({
      ...prev,
      x: rect.width / 2 - 150,
      y: rect.height / 2 - 100,
      scale: Math.min(rect.width / 600, 0.7),
    }));
  }, [roomPhoto]);

  /* ────── Загрузка файла ────── */

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Это не изображение", { description: "Выберите файл фото (JPG, PNG)" });
      return;
    }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setRoomPhoto(dataUrl);
      try {
        localStorage.setItem(STORAGE_KEY, dataUrl);
      } catch {
        /* размер фото может превысить квоту — игнорируем */
      }
      setLoading(false);
      setShowHint(true);
    };
    reader.onerror = () => {
      toast.error("Не удалось прочитать файл");
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }

  function clearRoomPhoto() {
    setRoomPhoto(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }

  /* ────── Drag-and-drop наложения ────── */

  function startInteraction(
    e: React.PointerEvent,
    type: "move" | "scale" | "rotate",
  ) {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    dragRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startTransform: { ...transform },
    };
    setShowHint(false);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current.type || !containerRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const start = dragRef.current.startTransform;

    if (dragRef.current.type === "move") {
      setTransform({ ...start, x: start.x + dx, y: start.y + dy });
    } else if (dragRef.current.type === "scale") {
      // Изменение масштаба пропорционально вертикальному движению
      const delta = -dy / 200;
      const newScale = Math.max(0.1, Math.min(3, start.scale + delta));
      setTransform({ ...start, scale: newScale });
    } else if (dragRef.current.type === "rotate") {
      // Поворот пропорционально горизонтальному движению
      const delta = dx / 2;
      setTransform({ ...start, rotation: start.rotation + delta });
    }
  }

  function endInteraction(e: React.PointerEvent) {
    if (dragRef.current.type) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      dragRef.current.type = null;
    }
  }

  /* ────── Кнопки управления ────── */

  function adjustScale(delta: number) {
    setTransform((t) => ({ ...t, scale: Math.max(0.1, Math.min(3, t.scale + delta)) }));
  }
  function adjustRotation(delta: number) {
    setTransform((t) => ({ ...t, rotation: t.rotation + delta }));
  }
  function toggleFlip() {
    setTransform((t) => ({ ...t, flipped: !t.flipped }));
  }
  function setOpacity(v: number) {
    setTransform((t) => ({ ...t, opacity: v }));
  }
  function reset() {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTransform({
      x: rect.width / 2 - 150,
      y: rect.height / 2 - 100,
      scale: Math.min(rect.width / 600, 0.7),
      rotation: 0,
      flipped: false,
      opacity: 1,
    });
  }

  /* ────── Сохранение в PNG ────── */

  async function saveAsPng() {
    if (!roomPhoto || !furnitureImage || !containerRef.current) return;
    try {
      const roomImg = await loadImage(roomPhoto);
      const furniImg = await loadImage(furnitureImage);

      const containerRect = containerRef.current.getBoundingClientRect();

      const canvas = document.createElement("canvas");
      // Рисуем в исходном разрешении фото комнаты
      canvas.width = roomImg.width;
      canvas.height = roomImg.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas-ctx");

      ctx.drawImage(roomImg, 0, 0);

      // Пересчитываем координаты с экрана в координаты фото
      const scaleToReal = roomImg.width / containerRect.width;
      const baseW = 300; // базовая ширина наложения
      const baseH = 200;
      const realW = baseW * transform.scale * scaleToReal;
      const realH = baseH * transform.scale * scaleToReal;
      const realX = (transform.x + baseW * transform.scale / 2) * scaleToReal;
      const realY = (transform.y + baseH * transform.scale / 2) * scaleToReal;

      ctx.save();
      ctx.globalAlpha = transform.opacity;
      ctx.translate(realX, realY);
      ctx.rotate((transform.rotation * Math.PI) / 180);
      if (transform.flipped) ctx.scale(-1, 1);
      ctx.drawImage(furniImg, -realW / 2, -realH / 2, realW, realH);
      ctx.restore();

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("blob-failed");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.name.replace(/[^\wа-яА-ЯёЁ0-9-]/g, "_")}_примерка.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Изображение сохранено", {
        description: "Файл скачан в браузер",
      });
    } catch (e) {
      toast.error("Не удалось сохранить", {
        description: e instanceof Error ? e.message : "Ошибка экспорта",
      });
    }
  }

  /* ────────────── РЕНДЕР ────────────── */

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col">
      {/* Шапка */}
      <div className="px-4 py-3 bg-card/95 backdrop-blur-sm border-b border-border flex items-center gap-3 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary/70 flex items-center justify-center"
          aria-label="Закрыть"
        >
          <Icon name="X" size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
            Примерка в комнате
          </p>
          <p className="text-sm font-bold truncate">{item.name}</p>
        </div>
        {roomPhoto && (
          <button
            onClick={saveAsPng}
            className="bg-primary text-primary-foreground px-3 py-2 rounded-md text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5"
          >
            <Icon name="Download" size={13} />
            <span className="hidden sm:inline">Сохранить</span>
          </button>
        )}
      </div>

      {/* Канвас / экран загрузки */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-neutral-900 select-none touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={endInteraction}
        onPointerCancel={endInteraction}
      >
        {!roomPhoto ? (
          <RoomTryOnUploadScreen
            loading={loading}
            onPickGallery={() => fileInputRef.current?.click()}
            onPickCamera={() => cameraInputRef.current?.click()}
          />
        ) : (
          <RoomTryOnCanvas
            roomPhoto={roomPhoto}
            furnitureImage={furnitureImage}
            itemName={item.name}
            transform={transform}
            showHint={showHint}
            dragType={dragRef.current.type}
            onStartInteraction={startInteraction}
          />
        )}

        {/* Скрытые инпуты для выбора файла */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Нижняя панель управления */}
      {roomPhoto && (
        <RoomTryOnControls
          transform={transform}
          onSetOpacity={setOpacity}
          onAdjustScale={adjustScale}
          onAdjustRotation={adjustRotation}
          onToggleFlip={toggleFlip}
          onReset={reset}
          onChangePhoto={() => fileInputRef.current?.click()}
          onClearPhoto={clearRoomPhoto}
        />
      )}
    </div>
  );
}
