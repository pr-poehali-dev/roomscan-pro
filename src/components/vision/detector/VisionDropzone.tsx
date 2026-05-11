import { useRef } from "react";
import Icon from "@/components/ui/icon";

/**
 * Пустая зона загрузки фото для AI-детектора объектов.
 * Триггерит выбор файла системным диалогом и отдаёт File наверх.
 */
interface Props {
  onPick: (file: File) => void;
}

export default function VisionDropzone({ onPick }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-colors"
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
          <Icon name="ScanSearch" size={26} className="text-primary" />
        </div>
        <p className="font-bold text-foreground mb-1">Загрузите фото комнаты</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Лучше фронтально — чтобы камера видела все стены
        </p>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
        className="hidden"
      />
    </>
  );
}
