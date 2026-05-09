import Icon from "@/components/ui/icon";

interface Props {
  loading: boolean;
  onPickGallery: () => void;
  onPickCamera: () => void;
}

/**
 * Экран первоначальной загрузки фото комнаты.
 * Логика 1:1 перенесена из RoomTryOn.tsx (внутренний компонент UploadScreen).
 */
export default function RoomTryOnUploadScreen({
  loading,
  onPickGallery,
  onPickCamera,
}: Props) {
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
          <Icon name="Camera" size={16} />
          Сделать фото
        </button>
        <button
          onClick={onPickGallery}
          disabled={loading}
          className="flex-1 bg-secondary text-foreground py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-secondary/70 transition-colors disabled:opacity-50"
        >
          <Icon name="Image" size={16} />
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
