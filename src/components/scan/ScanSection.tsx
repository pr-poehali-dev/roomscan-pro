import { useState } from "react";
import Icon from "@/components/ui/icon";
import WebXRScanner from "./WebXRScanner";
import PhotogrammetryScanner from "./PhotogrammetryScanner";

type Method = "choose" | "webxr" | "photo";

interface Measurement {
  width: number;
  depth?: number;
  length?: number;
  height: number;
  area: number;
  method?: string;
  accuracy_estimate?: string;
  frames_used?: number;
  confidence?: string;
}

export default function ScanSection() {
  const [method, setMethod] = useState<Method>("choose");
  const [lastResult, setLastResult] = useState<Measurement | null>(null);

  const handleComplete = (data: Measurement) => setLastResult(data);

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">
            Android · Chrome
          </p>
          <h2 className="text-3xl font-bold text-foreground">Сканирование</h2>
        </div>
        {method !== "choose" && (
          <button
            onClick={() => setMethod("choose")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name="ChevronLeft" size={16} />
            Сменить метод
          </button>
        )}
      </div>

      {method === "choose" && (
        <div className="space-y-4 animate-fade-in">
          {/* Сравнение методов */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Вариант C — WebXR */}
            <button
              onClick={() => setMethod("webxr")}
              className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary/50 transition-all group space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon name="Scan" size={22} className="text-primary" />
                </div>
                <span className="text-xs font-mono bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  Вариант C
                </span>
              </div>
              <div>
                <p className="font-bold text-foreground text-lg">WebXR Depth API</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Реальная карта глубины через ToF/LiDAR сенсор. Мгновенный результат прямо в браузере.
                </p>
              </div>
              <div className="space-y-1.5">
                {[
                  { icon: "Zap", text: "Быстро — 10 секунд", ok: true },
                  { icon: "Crosshair", text: "Точность ±3–8 см", ok: true },
                  { icon: "Smartphone", text: "Требует Android + ToF сенсор", ok: null },
                  { icon: "Chrome", text: "Только Chrome", ok: null },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-2 text-xs">
                    <Icon
                      name={f.ok === true ? "CheckCircle2" : f.ok === false ? "XCircle" : "Info"}
                      size={13}
                      className={f.ok === true ? "text-primary" : f.ok === false ? "text-destructive" : "text-yellow-500"}
                    />
                    <span className="text-muted-foreground">{f.text}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-primary text-sm font-semibold group-hover:gap-3 transition-all">
                Выбрать <Icon name="ArrowRight" size={15} />
              </div>
            </button>

            {/* Вариант B — Фотограмметрия */}
            <button
              onClick={() => setMethod("photo")}
              className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary/50 transition-all group space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon name="Camera" size={22} className="text-primary" />
                </div>
                <span className="text-xs font-mono bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  Вариант B
                </span>
              </div>
              <div>
                <p className="font-bold text-foreground text-lg">Фотограмметрия (SfM)</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Снимите видео помещения. ИИ восстановит 3D-модель и размеры через Structure from Motion.
                </p>
              </div>
              <div className="space-y-1.5">
                {[
                  { icon: "Smartphone", text: "Любой Android телефон", ok: true },
                  { icon: "Camera", text: "Обычная камера — без сенсоров", ok: true },
                  { icon: "Clock", text: "30–60 секунд съёмки + обработка", ok: null },
                  { icon: "Crosshair", text: "Точность ±5–15 см", ok: null },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-2 text-xs">
                    <Icon
                      name={f.ok === true ? "CheckCircle2" : f.ok === false ? "XCircle" : "Info"}
                      size={13}
                      className={f.ok === true ? "text-primary" : f.ok === false ? "text-destructive" : "text-yellow-500"}
                    />
                    <span className="text-muted-foreground">{f.text}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-primary text-sm font-semibold group-hover:gap-3 transition-all">
                Выбрать <Icon name="ArrowRight" size={15} />
              </div>
            </button>
          </div>

          {/* Последний результат */}
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

          {/* Подсказка */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <Icon name="Info" size={16} className="text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Рекомендация:</strong> Если ваш телефон поддерживает ToF-сенсор
              (Pixel 6+, Samsung Galaxy S21+, OnePlus 9 Pro) — используйте <strong className="text-primary">Вариант C</strong>.
              Для всех остальных устройств — <strong className="text-primary">Вариант B</strong>.
            </div>
          </div>
        </div>
      )}

      {method === "webxr" && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-4 bg-card border border-border rounded-xl px-4 py-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <Icon name="Scan" size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">WebXR Depth API</p>
              <p className="text-xs text-muted-foreground font-mono">Chrome Android · ToF/LiDAR</p>
            </div>
          </div>
          <WebXRScanner onComplete={handleComplete} />
        </div>
      )}

      {method === "photo" && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-4 bg-card border border-border rounded-xl px-4 py-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <Icon name="Camera" size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Фотограмметрия · Structure from Motion</p>
              <p className="text-xs text-muted-foreground font-mono">OpenCV · любой Android</p>
            </div>
          </div>
          <PhotogrammetryScanner onComplete={handleComplete} />
        </div>
      )}
    </div>
  );
}
