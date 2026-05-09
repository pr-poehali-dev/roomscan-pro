import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import type { FurnitureItem } from "@/lib/furnitureCatalog";

interface Props {
  item: FurnitureItem;
  onClose: () => void;
}

interface Transform {
  x: number;       // px от левого верхнего угла канвы
  y: number;
  scale: number;   // множитель размера
  rotation: number; // градусы
  flipped: boolean; // зеркальное отражение
  opacity: number;  // 0..1
}

const STORAGE_KEY = "roomscan:tryon:room-photo";

/**
 * Виртуальная примерка мебели на фото реальной комнаты.
 * Работает кросс-платформенно (iOS / Android / Desktop).
 *
 * Поток:
 *  1. Пользователь делает или загружает фото комнаты
 *  2. Поверх накладывается изображение мебели
 *  3. Двигает / масштабирует / поворачивает / меняет прозрачность
 *  4. Сохраняет результат в PNG
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

  const overlayWidth = 300 * transform.scale;
  const overlayHeight = 200 * transform.scale;
  const overlayTransform = `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotation}deg) ${
    transform.flipped ? "scaleX(-1)" : ""
  }`;

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
          <UploadScreen
            loading={loading}
            onPickGallery={() => fileInputRef.current?.click()}
            onPickCamera={() => cameraInputRef.current?.click()}
          />
        ) : (
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
                onPointerDown={(e) => startInteraction(e, "move")}
                style={{
                  position: "absolute",
                  width: overlayWidth,
                  height: overlayHeight,
                  transform: overlayTransform,
                  transformOrigin: "center",
                  opacity: transform.opacity,
                  cursor: dragRef.current.type === "move" ? "grabbing" : "grab",
                  touchAction: "none",
                }}
                className="will-change-transform"
              >
                <img
                  src={furnitureImage}
                  alt={item.name}
                  className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
                  draggable={false}
                />

                {/* Ручка масштаба */}
                <button
                  onPointerDown={(e) => startInteraction(e, "scale")}
                  className="absolute -bottom-3 -right-3 w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white touch-none"
                  aria-label="Масштаб"
                  style={{ touchAction: "none" }}
                >
                  <Icon name="Maximize2" size={14} className="text-primary-foreground" />
                </button>

                {/* Ручка поворота */}
                <button
                  onPointerDown={(e) => startInteraction(e, "rotate")}
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
        <div className="bg-card/95 backdrop-blur-sm border-t border-border p-3 shrink-0 space-y-2.5">
          {/* Слайдер прозрачности */}
          <div className="flex items-center gap-2">
            <Icon name="Eye" size={13} className="text-muted-foreground shrink-0" />
            <input
              type="range"
              min={0.3}
              max={1}
              step={0.05}
              value={transform.opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
            />
            <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
              {Math.round(transform.opacity * 100)}%
            </span>
          </div>

          {/* Кнопки */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <CtrlBtn icon="Minus" label="−" onClick={() => adjustScale(-0.1)} />
            <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap px-1">
              {Math.round(transform.scale * 100)}%
            </span>
            <CtrlBtn icon="Plus" label="+" onClick={() => adjustScale(0.1)} />

            <span className="w-px h-6 bg-border mx-1" />

            <CtrlBtn icon="RotateCcw" label="−15°" onClick={() => adjustRotation(-15)} />
            <CtrlBtn icon="RotateCw" label="+15°" onClick={() => adjustRotation(15)} />

            <span className="w-px h-6 bg-border mx-1" />

            <CtrlBtn icon="FlipHorizontal" label="Зеркало" onClick={toggleFlip} active={transform.flipped} />
            <CtrlBtn icon="Undo2" label="Сброс" onClick={reset} />

            <span className="flex-1" />

            <CtrlBtn
              icon="ImagePlus"
              label="Сменить фото"
              onClick={() => fileInputRef.current?.click()}
            />
            <CtrlBtn icon="Trash2" label="Очистить" onClick={clearRoomPhoto} danger />
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────── ВСПОМОГАТЕЛЬНЫЕ ────────────── */

function UploadScreen({
  loading,
  onPickGallery,
  onPickCamera,
}: {
  loading: boolean;
  onPickGallery: () => void;
  onPickCamera: () => void;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mb-4">
        <Icon name="Camera" size={28} className="text-primary" />
      </div>
      <h3 className="text-lg font-bold text-white mb-1.5">Сфотографируйте комнату</h3>
      <p className="text-sm text-neutral-300 mb-6 max-w-xs leading-relaxed">
        Сделайте фото комнаты или выберите из галереи — наложим диван и посмотрим, как впишется
      </p>
      <div className="flex flex-col sm:flex-row gap-2 w-full max-w-sm">
        <button
          onClick={onPickCamera}
          disabled={loading}
          className="flex-1 bg-primary text-primary-foreground py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Icon name={loading ? "Loader2" : "Camera"} size={16} className={loading ? "animate-spin" : ""} />
          Сделать фото
        </button>
        <button
          onClick={onPickGallery}
          disabled={loading}
          className="flex-1 bg-card border-2 border-border py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:border-primary/40 transition-colors disabled:opacity-50"
        >
          <Icon name="ImagePlus" size={16} />
          Из галереи
        </button>
      </div>
      <div className="mt-6 flex items-start gap-2 max-w-xs text-left">
        <Icon name="Info" size={12} className="text-neutral-400 mt-0.5 shrink-0" />
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          Совет: снимайте с уровня сидения, чтобы перспектива дивана совпала с реальным масштабом комнаты
        </p>
      </div>
    </div>
  );
}

function CtrlBtn({
  icon,
  label,
  onClick,
  active,
  danger,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold flex items-center gap-1 whitespace-nowrap transition-colors border ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : danger
            ? "bg-card border-destructive/30 text-destructive hover:bg-destructive/10"
            : "bg-card border-border text-foreground hover:border-primary/40 hover:text-primary"
      }`}
    >
      <Icon name={icon} size={11} />
      {label}
    </button>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Простой плейсхолдер на основе цвета и иконки товара */
function generateFallback(item: FurnitureItem): string {
  const c = item.color ?? "#a78b6f";
  const w = 600;
  const h = 400;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${c}" stop-opacity="1"/>
        <stop offset="1" stop-color="${c}" stop-opacity="0.7"/>
      </linearGradient>
    </defs>
    <rect x="40" y="120" width="${w - 80}" height="${h - 180}" rx="20" fill="url(#g)" stroke="#000" stroke-width="2" stroke-opacity="0.15"/>
    <rect x="40" y="120" width="${w - 80}" height="80" rx="20" fill="#000" fill-opacity="0.08"/>
    <rect x="60" y="${h - 60}" width="40" height="40" fill="#222" rx="4"/>
    <rect x="${w - 100}" y="${h - 60}" width="40" height="40" fill="#222" rx="4"/>
    <text x="${w / 2}" y="${h / 2}" text-anchor="middle" font-family="ui-sans-serif" font-size="18" font-weight="700" fill="#fff" opacity="0.85">${item.name}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
