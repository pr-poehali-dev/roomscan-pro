import { useRef } from "react";
import Icon from "@/components/ui/icon";

/**
 * Дропзона для выбора фото комнаты. Сообщает родителю выбранный файл
 * через onPick. Валидация типа/размера лежит на родителе.
 */
interface Props {
  maxFileMb: number;
  onPick: (file: File) => void;
}

export default function PoseUploader({ maxFileMb, onPick }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onClick={() => fileRef.current?.click()}
      className="bg-card border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-8 text-center cursor-pointer transition-colors"
    >
      <div className="w-14 h-14 mx-auto bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center mb-3">
        <Icon name="ImagePlus" size={26} className="text-primary" />
      </div>
      <p className="font-bold text-foreground">Выберите фото комнаты</p>
      <p className="text-xs text-muted-foreground mt-1">
        JPG / PNG · до {maxFileMb} МБ · фронтальный вид с большей частью комнаты
      </p>
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
    </div>
  );
}
