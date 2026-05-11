import { useState } from "react";
import Icon from "@/components/ui/icon";
import { notify } from "@/lib/notify";
import { saveFloorPlan } from "@/lib/floorPlanStorage";
import { poseToFloorPlan, type PoseResponse } from "@/lib/poseToFloorPlan";
import PoseUploader from "./pose/PoseUploader";
import PoseControls from "./pose/PoseControls";
import PoseResult from "./pose/PoseResult";

const POSE_URL = "https://functions.poehali.dev/a589338b-beec-49b9-aca7-d490c1d46e05";
const MAX_FILE_MB = 6;

interface Props {
  onApplied?: () => void;
}

/**
 * Детектор позы комнаты — по одной фотографии восстанавливает 3D-планировку:
 * габариты, стены, окна, двери и расставленную мебель. Применяет результат
 * в Планировщик одним кликом.
 *
 * Этот компонент держит state (фото / хинты / loading / результат) и
 * сетевую логику. Презентация разнесена в pose/PoseUploader, pose/PoseControls
 * и pose/PoseResult.
 */
export default function RoomPoseDetector({ onApplied }: Props) {
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pose, setPose] = useState<PoseResponse | null>(null);
  const [hintW, setHintW] = useState(450);
  const [hintD, setHintD] = useState(380);

  const onPickFile = (f: File) => {
    if (!f.type.startsWith("image/")) {
      notify.error("Не похоже на фото", "Загрузите JPG или PNG-фото комнаты");
      return;
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      notify.error("Файл больше " + MAX_FILE_MB + " МБ", "Сожмите фото и попробуйте снова");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setImageData(url);
      setPose(null);
    };
    reader.readAsDataURL(f);
  };

  const onAnalyze = async () => {
    if (!imageData) return;
    setLoading(true);
    try {
      const base64 = imageData.includes(",") ? imageData.split(",")[1] : imageData;
      const resp = await fetch(POSE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: base64,
          hint_w_cm: hintW,
          hint_d_cm: hintD,
        }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${text.slice(0, 200)}`);
      }
      const data = (await resp.json()) as PoseResponse;
      setPose(data);
      const fcount = data.furniture?.length ?? 0;
      const ocount = data.openings?.length ?? 0;
      if (data.fallback || data.source === "fallback") {
        notify.info(
          "Демо-результат",
          "AI не подключён, показан пример. Найдено " + fcount + " предметов и " + ocount + " проёмов",
        );
      } else {
        notify.success(
          "Поза определена",
          "Найдено " + fcount + " предметов и " + ocount + " проёмов за " + ((data.latency_ms ?? 0) / 1000).toFixed(1) + " с",
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      notify.error("Не удалось распознать", msg.slice(0, 200));
    } finally {
      setLoading(false);
    }
  };

  const onApply = () => {
    if (!pose) return;
    const plan = poseToFloorPlan(pose, "План из фото");
    saveFloorPlan(plan);
    notify.success(
      "План создан",
      "Открой Планировщик — комната, стены, окна и мебель уже расставлены",
    );
    onApplied?.();
  };

  const onReset = () => {
    setImageData(null);
    setPose(null);
  };

  return (
    <div className="space-y-4">
      {/* Описание */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <Icon name="Sparkles" size={18} className="text-primary shrink-0 mt-0.5" />
        <div className="text-sm leading-relaxed">
          <p className="font-bold text-foreground">Полный 3D-план из одной фотографии</p>
          <p className="text-muted-foreground mt-1">
            Нейросеть определяет габариты комнаты, расположение окон/дверей и каждого предмета мебели.
            Результат применяется в Планировщик одной кнопкой.
          </p>
        </div>
      </div>

      {!imageData && <PoseUploader maxFileMb={MAX_FILE_MB} onPick={onPickFile} />}

      {imageData && (
        <div className="space-y-4">
          <PoseControls
            imageData={imageData}
            hintW={hintW}
            hintD={hintD}
            loading={loading}
            hasResult={!!pose}
            onReset={onReset}
            onChangeHintW={setHintW}
            onChangeHintD={setHintD}
            onAnalyze={onAnalyze}
          />

          {pose && <PoseResult pose={pose} onApply={onApply} />}
        </div>
      )}
    </div>
  );
}
