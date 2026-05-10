import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { notify } from "@/lib/notify";
import { saveFloorPlan } from "@/lib/floorPlanStorage";
import { poseToFloorPlan, type PoseResponse } from "@/lib/poseToFloorPlan";

const POSE_URL = "https://functions.poehali.dev/a589338b-beec-49b9-aca7-d490c1d46e05";
const MAX_FILE_MB = 6;

interface Props {
  onApplied?: () => void;
}

/**
 * Детектор позы комнаты — по одной фотографии восстанавливает 3D-планировку:
 * габариты, стены, окна, двери и расставленную мебель. Применяет результат
 * в Планировщик одним кликом.
 */
export default function RoomPoseDetector({ onApplied }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pose, setPose] = useState<PoseResponse | null>(null);
  const [hintW, setHintW] = useState(450);
  const [hintD, setHintD] = useState(380);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
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
    if (fileRef.current) fileRef.current.value = "";
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

      {/* Загрузка фото */}
      {!imageData && (
        <div
          onClick={() => fileRef.current?.click()}
          className="bg-card border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-8 text-center cursor-pointer transition-colors"
        >
          <div className="w-14 h-14 mx-auto bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center mb-3">
            <Icon name="ImagePlus" size={26} className="text-primary" />
          </div>
          <p className="font-bold text-foreground">Выберите фото комнаты</p>
          <p className="text-xs text-muted-foreground mt-1">
            JPG / PNG · до {MAX_FILE_MB} МБ · фронтальный вид с большей частью комнаты
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPickFile}
            className="hidden"
          />
        </div>
      )}

      {/* Превью + параметры */}
      {imageData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <img src={imageData} alt="фото комнаты" className="w-full aspect-video object-cover" />
              <div className="p-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-mono">Исходное фото</p>
                <button
                  onClick={onReset}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Icon name="X" size={12} />
                  Сбросить
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Подсказка размеров (опционально)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Ширина, см</span>
                  <input
                    type="number"
                    value={hintW}
                    onChange={(e) => setHintW(Number(e.target.value) || 450)}
                    min={150}
                    max={2000}
                    className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-mono"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Глубина, см</span>
                  <input
                    type="number"
                    value={hintD}
                    onChange={(e) => setHintD(Number(e.target.value) || 380)}
                    min={150}
                    max={2000}
                    className="w-full mt-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-mono"
                  />
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Если знаете площадь — укажите ширину и глубину. Если нет — оставьте по умолчанию,
                AI оценит сам.
              </p>
              <button
                onClick={onAnalyze}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-bold text-sm py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Icon name="Loader" size={15} className="animate-spin" />
                    Анализирую позу комнаты…
                  </>
                ) : pose ? (
                  <>
                    <Icon name="RefreshCw" size={15} />
                    Распознать ещё раз
                  </>
                ) : (
                  <>
                    <Icon name="ScanEye" size={15} />
                    Распознать комнату
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Результат */}
          {pose && <PoseResult pose={pose} onApply={onApply} />}
        </div>
      )}
    </div>
  );
}

/* ───────── Превью результата: «вид сверху» ───────── */

function PoseResult({ pose, onApply }: { pose: PoseResponse; onApply: () => void }) {
  const { room, openings, furniture } = pose;
  const PADDING = 24;
  const VIEW_W = 720;
  const VIEW_H = Math.round(VIEW_W * (room.depth_cm / room.width_cm));
  const SX = (VIEW_W - PADDING * 2) / room.width_cm;
  const SY = (VIEW_H - PADDING * 2) / room.depth_cm;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Распознанная планировка
          </p>
          <p className="text-sm text-foreground mt-1">
            <span className="font-bold">{room.width_cm}</span> × <span className="font-bold">{room.depth_cm}</span> см
            <span className="text-muted-foreground"> · потолок {room.height_cm} см</span>
            <span className="text-muted-foreground"> · {labelRoomType(pose.room_type)}</span>
          </p>
        </div>
        <button
          onClick={onApply}
          className="bg-primary text-primary-foreground font-bold text-sm py-2.5 px-5 rounded-lg hover:opacity-90 transition flex items-center gap-2"
        >
          <Icon name="LayoutGrid" size={15} />
          Применить в Планировщик
        </button>
      </div>

      {/* SVG вид сверху */}
      <div className="bg-card border border-border rounded-xl p-3 overflow-x-auto">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full h-auto block"
          style={{ maxHeight: 480 }}
        >
          {/* фон комнаты */}
          <rect
            x={PADDING}
            y={PADDING}
            width={room.width_cm * SX}
            height={room.depth_cm * SY}
            fill="hsl(var(--secondary))"
            stroke="hsl(var(--border))"
            strokeWidth={2}
          />

          {/* стены */}
          <rect
            x={PADDING}
            y={PADDING}
            width={room.width_cm * SX}
            height={room.depth_cm * SY}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth={6}
          />

          {/* проёмы */}
          {openings.map((op) => {
            const isWindow = op.kind === "window";
            const stroke = isWindow ? "#3b82f6" : "#10b981";
            const center = op.center_cm;
            const halfW = op.width_cm / 2;
            let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
            if (op.wall_side === "north") {
              x1 = PADDING + (center - halfW) * SX;
              x2 = PADDING + (center + halfW) * SX;
              y1 = y2 = PADDING;
            } else if (op.wall_side === "south") {
              x1 = PADDING + (center - halfW) * SX;
              x2 = PADDING + (center + halfW) * SX;
              y1 = y2 = PADDING + room.depth_cm * SY;
            } else if (op.wall_side === "west") {
              y1 = PADDING + (center - halfW) * SY;
              y2 = PADDING + (center + halfW) * SY;
              x1 = x2 = PADDING;
            } else {
              y1 = PADDING + (center - halfW) * SY;
              y2 = PADDING + (center + halfW) * SY;
              x1 = x2 = PADDING + room.width_cm * SX;
            }
            return (
              <line
                key={op.id}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={stroke}
                strokeWidth={8}
                strokeLinecap="round"
              />
            );
          })}

          {/* мебель */}
          {furniture.map((f) => {
            const x = PADDING + f.x_cm * SX;
            const y = PADDING + f.y_cm * SY;
            const w =
              f.rotation_deg === 90 || f.rotation_deg === 270
                ? f.depth_cm * SX
                : f.width_cm * SX;
            const h =
              f.rotation_deg === 90 || f.rotation_deg === 270
                ? f.width_cm * SY
                : f.depth_cm * SY;
            return (
              <g key={f.id}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill="hsl(var(--primary) / 0.18)"
                  stroke="hsl(var(--primary))"
                  strokeWidth={1.5}
                  rx={3}
                />
                <text
                  x={x + w / 2}
                  y={y + h / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={10}
                  fill="hsl(var(--foreground))"
                  className="font-mono pointer-events-none"
                >
                  {f.label.slice(0, 14)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Легенда */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1 bg-blue-500 rounded" /> Окно
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1 bg-emerald-500 rounded" /> Дверь
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-primary/20 border border-primary rounded-sm" /> Мебель
        </span>
      </div>

      {/* Список объектов */}
      <details className="bg-card border border-border rounded-xl group">
        <summary className="cursor-pointer p-3 flex items-center gap-2 list-none">
          <Icon name="ChevronRight" size={14} className="text-muted-foreground transition-transform group-open:rotate-90" />
          <span className="font-bold text-foreground text-sm">
            Найдено объектов: {furniture.length} мебель + {openings.length} проёмы
          </span>
        </summary>
        <div className="px-3 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {furniture.map((f) => (
            <div key={f.id} className="flex items-center gap-2 text-xs bg-secondary/40 rounded-lg p-2">
              <Icon name={f.icon} size={14} className="text-primary shrink-0" />
              <span className="font-bold text-foreground">{f.label}</span>
              <span className="text-muted-foreground font-mono ml-auto">
                {f.width_cm}×{f.depth_cm}
                {f.against_wall ? " · у " + sideRu(f.against_wall) + " стены" : ""}
              </span>
            </div>
          ))}
          {openings.map((op) => (
            <div key={op.id} className="flex items-center gap-2 text-xs bg-secondary/40 rounded-lg p-2">
              <Icon
                name={op.kind === "window" ? "AppWindow" : "DoorOpen"}
                size={14}
                className={op.kind === "window" ? "text-blue-500" : "text-emerald-500"}
              />
              <span className="font-bold text-foreground">
                {op.kind === "window" ? "Окно" : "Дверь"}
              </span>
              <span className="text-muted-foreground font-mono ml-auto">
                {op.width_cm} см · {sideRu(op.wall_side)}
              </span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function sideRu(side: "north" | "east" | "south" | "west"): string {
  return side === "north" ? "северной" : side === "east" ? "восточной" : side === "south" ? "южной" : "западной";
}

function labelRoomType(t: string): string {
  const map: Record<string, string> = {
    living: "гостиная",
    bedroom: "спальня",
    kitchen: "кухня",
    bathroom: "санузел",
    hall: "прихожая",
    office: "кабинет",
    child: "детская",
  };
  return map[t] ?? t;
}
