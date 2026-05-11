import Icon from "@/components/ui/icon";
import MobileQRBlock from "./MobileQRBlock";
import MethodCard from "./MethodCard";
import type { Method, Measurement } from "./types";

/**
 * Экран выбора метода сканирования: сетка 4 карточек методов,
 * блок последнего результата (если был), QR для перехода с телефона
 * и общая подсказка-рекомендация.
 */
interface Props {
  onChoose: (method: Method) => void;
  lastResult: Measurement | null;
}

export default function MethodChooser({ onChoose, lastResult }: Props) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MethodCard
          icon="Scan"
          variantLabel="Вариант C"
          title="WebXR Depth API"
          description="Реальная карта глубины через ToF/LiDAR сенсор. Мгновенный результат прямо в браузере."
          features={[
            { icon: "Zap", text: "Быстро — 10 секунд", ok: true },
            { icon: "Crosshair", text: "Точность ±3–8 см", ok: true },
            { icon: "Smartphone", text: "Требует Android + ToF сенсор", ok: null },
            { icon: "Chrome", text: "Только Chrome", ok: null },
          ]}
          onSelect={() => onChoose("webxr")}
        />

        <MethodCard
          icon="Camera"
          variantLabel="Вариант B"
          title="Фотограмметрия (SfM)"
          description="Снимите видео помещения. ИИ восстановит 3D-модель и размеры через Structure from Motion."
          features={[
            { icon: "Smartphone", text: "Любой Android телефон", ok: true },
            { icon: "Camera", text: "Обычная камера — без сенсоров", ok: true },
            { icon: "Clock", text: "30–60 секунд съёмки + обработка", ok: null },
            { icon: "Crosshair", text: "Точность ±5–15 см", ok: null },
          ]}
          onSelect={() => onChoose("photo")}
        />

        <MethodCard
          icon="ScanSearch"
          variantLabel="Вариант D"
          title="AI-детекция по фото"
          description="Загрузите одно фото — нейросеть распознает мебель, окна, двери и сразу создаст план в Планировщике."
          features={[
            { icon: "Zap", text: "Самый быстрый — 5 секунд", ok: true },
            { icon: "Smartphone", text: "Любое устройство", ok: true },
            { icon: "Wand2", text: "Авто-расстановка мебели", ok: true },
            { icon: "Crosshair", text: "Не считает точные размеры", ok: null },
          ]}
          onSelect={() => onChoose("vision")}
          emphasis="accented"
          ribbon={{ text: "NEW · AI", tone: "primary" }}
        />

        <MethodCard
          icon="ScanEye"
          variantLabel="Вариант E"
          title="Полный план из 1 фото"
          description="Pose-детектор определяет габариты комнаты, расположение стен, окон, дверей и каждого предмета мебели в 3D — за один клик."
          features={[
            { icon: "Sparkles", text: "Полная планировка автоматически", ok: true },
            { icon: "Zap", text: "Готовый 3D-план за 5–8 секунд", ok: true },
            { icon: "Smartphone", text: "Любое устройство", ok: true },
            { icon: "LayoutGrid", text: "Применяется в Планировщик 1 кликом", ok: true },
          ]}
          onSelect={() => onChoose("pose")}
          emphasis="highlight"
          ribbon={{ text: "Новинка · Pose AI", tone: "emerald" }}
          featureOkTone="emerald"
        />
      </div>

      {lastResult && (
        <div className="bg-card border border-border rounded-xl p-4 animate-fade-in">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            Последнее сканирование
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Ширина", value: `${lastResult.width} м` },
              { label: "Длина/глубина", value: `${lastResult.length ?? lastResult.depth ?? "—"} м` },
              { label: "Высота", value: `${lastResult.height} м` },
              { label: "Площадь", value: `${lastResult.area} м²` },
            ].map((m) => (
              <div key={m.label} className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-xl font-black text-primary font-mono">{m.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <MobileQRBlock />

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <Icon name="Info" size={16} className="text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Рекомендация:</strong> для самой быстрой работы возьмите{" "}
          <strong className="text-primary">Вариант E</strong> — Pose AI создаёт готовый план из одной фотографии.
          Если нужны точные размеры до сантиметра — <strong className="text-primary">Вариант C</strong> (ToF-сенсор)
          или <strong className="text-primary">Вариант B</strong> (фотограмметрия).
        </div>
      </div>
    </div>
  );
}
