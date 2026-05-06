import { useState } from "react";
import Icon from "@/components/ui/icon";

const furnitureItems = [
  { id: 1, name: "Диван угловой Loft", brand: "Arredo", size: "280×170 см", price: "89 400 ₽", priceNum: 89400, category: "Диваны", icon: "Sofa", w: 280, d: 170 },
  { id: 2, name: "Обеденный стол Solid", brand: "Nord", size: "160×80 см", price: "34 200 ₽", priceNum: 34200, category: "Столы", icon: "Table2", w: 160, d: 80 },
  { id: 3, name: "Кресло Arc", brand: "Arredo", size: "85×90 см", price: "22 800 ₽", priceNum: 22800, category: "Кресла", icon: "Armchair", w: 85, d: 90 },
  { id: 4, name: "Шкаф-купе Forma", brand: "Space", size: "240×60 см", price: "67 600 ₽", priceNum: 67600, category: "Шкафы", icon: "Package", w: 240, d: 60 },
  { id: 5, name: "Кровать Frame", brand: "Nord", size: "200×160 см", price: "58 000 ₽", priceNum: 58000, category: "Кровати", icon: "BedDouble", w: 200, d: 160 },
  { id: 6, name: "Тумба TV Unit", brand: "Space", size: "180×40 см", price: "18 500 ₽", priceNum: 18500, category: "ТВ-зоны", icon: "Tv", w: 180, d: 40 },
  { id: 7, name: "Стеллаж Open", brand: "Nord", size: "120×30 см", price: "12 900 ₽", priceNum: 12900, category: "Шкафы", icon: "BookOpen", w: 120, d: 30 },
  { id: 8, name: "Пуф Round", brand: "Arredo", size: "60×60 см", price: "8 400 ₽", priceNum: 8400, category: "Кресла", icon: "Circle", w: 60, d: 60 },
  { id: 9, name: "Журнальный столик Neo", brand: "Space", size: "100×50 см", price: "14 200 ₽", priceNum: 14200, category: "Столы", icon: "Table", w: 100, d: 50 },
];

interface Room { x: number; y: number; w: number; h: number; label: string; area: string; }
interface PlacedItem { id: number; name: string; x: number; y: number; w: number; h: number; icon: string; }

const defaultRooms: Room[] = [
  { x: 10, y: 10, w: 160, h: 120, label: "Гостиная", area: "28.4 м²" },
  { x: 10, y: 140, w: 100, h: 100, label: "Спальня", area: "18.2 м²" },
  { x: 180, y: 10, w: 80, h: 80, label: "Кухня", area: "12.1 м²" },
  { x: 180, y: 100, w: 80, h: 60, label: "Ванная", area: "7.8 м²" },
  { x: 120, y: 140, w: 60, h: 100, label: "Коридор", area: "8.6 м²" },
];

export default function PlannerSection({ cartItems }: { cartItems?: typeof furnitureItems }) {
  const [activeTool, setActiveTool] = useState("select");
  const [view, setView] = useState<"2D" | "3D">("2D");
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [placed, setPlaced] = useState<PlacedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(true);

  const tools = [
    { id: "select", icon: "MousePointer2", label: "Выбор" },
    { id: "move", icon: "Move", label: "Перемещение" },
    { id: "measure", icon: "Ruler", label: "Измерить" },
    { id: "delete", icon: "Trash2", label: "Удалить" },
  ];

  const rooms = defaultRooms;

  const handleRoomClick = (label: string) => {
    if (activeTool === "select") setSelectedRoom(label === selectedRoom ? null : label);
  };

  const handleItemClick = (id: number) => {
    if (activeTool === "delete") {
      setPlaced((prev) => prev.filter((p) => p.id !== id));
      setSelectedItem(null);
    } else {
      setSelectedItem(id === selectedItem ? null : id);
    }
  };

  const totalArea = rooms.reduce((sum, r) => sum + parseFloat(r.area), 0).toFixed(1);

  const selected = rooms.find((r) => r.label === selectedRoom);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">2D / 3D</p>
          <h2 className="text-3xl font-bold">Планировщик</h2>
        </div>
        <div className="flex items-center gap-2">
          {(["2D", "3D"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`text-sm font-mono px-4 py-2 rounded-lg border transition-colors ${
                view === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
              }`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        {/* Инструменты */}
        <div className="flex flex-col gap-1 bg-card border border-border rounded-lg p-2 h-fit">
          {tools.map((t) => (
            <button key={t.id} onClick={() => { setActiveTool(t.id); setSelectedItem(null); }} title={t.label}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                activeTool === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}>
              <Icon name={t.icon} size={17} />
            </button>
          ))}
          {placed.length > 0 && (
            <>
              <div className="h-px bg-border my-1" />
              <button onClick={() => { setPlaced([]); setSelectedItem(null); }} title="Очистить"
                className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <Icon name="Eraser" size={17} />
              </button>
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Шапка плана */}
          <div className="bg-card border border-border rounded-t-lg px-4 py-2 flex items-center gap-4 flex-wrap">
            <p className="text-xs font-mono text-muted-foreground">Квартира · демо-план</p>
            <span className="text-xs font-mono text-border">|</span>
            <p className="text-xs font-mono text-muted-foreground">Масштаб 1:50</p>
            {selectedRoom && (
              <>
                <span className="text-xs font-mono text-border">|</span>
                <span className="text-xs font-mono text-primary font-semibold">{selectedRoom}</span>
              </>
            )}
            <span className="ml-auto text-xs font-mono text-primary">{totalArea} м²</span>
          </div>

          {/* Canvas плана */}
          <div className="bg-card border-x border-b border-border rounded-b-lg overflow-hidden relative" style={{ height: 360 }}>
            <div className="absolute inset-0"
              style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
                backgroundSize: "40px 40px"
              }} />

            {view === "2D" ? (
              <svg width="100%" height="100%" viewBox="0 0 280 250" className="absolute inset-0">
                {/* Комнаты */}
                {rooms.map((r) => {
                  const isSelected = selectedRoom === r.label;
                  return (
                    <g key={r.label} onClick={() => handleRoomClick(r.label)} style={{ cursor: "pointer" }}>
                      <rect x={r.x} y={r.y} width={r.w} height={r.h}
                        fill={isSelected ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.03)"}
                        stroke={isSelected ? "rgba(34,197,94,0.7)" : "rgba(255,255,255,0.15)"}
                        strokeWidth={isSelected ? "2" : "1.5"} rx="1" />
                      <text x={r.x + r.w / 2} y={r.y + r.h / 2 - 6}
                        textAnchor="middle" fill={isSelected ? "hsl(142,70%,50%)" : "rgba(255,255,255,0.5)"}
                        fontSize="8" fontFamily="IBM Plex Mono">{r.label}</text>
                      <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 8}
                        textAnchor="middle" fill="hsl(35,90%,55%)" fontSize="7" fontFamily="IBM Plex Mono">{r.area}</text>
                    </g>
                  );
                })}

                {/* Размещённая мебель */}
                {placed.map((p) => {
                  const isSelected = selectedItem === p.id;
                  return (
                    <g key={p.id} onClick={() => handleItemClick(p.id)} style={{ cursor: activeTool === "delete" ? "not-allowed" : "pointer" }}>
                      <rect x={p.x} y={p.y} width={p.w} height={p.h}
                        fill={isSelected ? "rgba(34,197,94,0.25)" : "rgba(34,197,94,0.10)"}
                        stroke={isSelected ? "rgba(34,197,94,0.9)" : "rgba(34,197,94,0.4)"}
                        strokeWidth="1.5" rx="1" strokeDasharray={isSelected ? "" : "3 2"} />
                      <text x={p.x + p.w / 2} y={p.y + p.h / 2 + 3}
                        textAnchor="middle" fill="rgba(34,197,94,0.8)" fontSize="6" fontFamily="IBM Plex Mono">
                        {p.name.split(" ")[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
                  <Icon name="Box" size={30} className="text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">3D-вид доступен после сканирования помещения</p>
                <p className="text-xs text-muted-foreground/60 font-mono">Перейдите в «Сканирование» → вернитесь сюда</p>
              </div>
            )}

            {/* Хинт при первом открытии */}
            {showHint && view === "2D" && placed.length === 0 && (
              <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2">
                <Icon name="Info" size={13} className="text-primary shrink-0" />
                <p className="text-xs text-muted-foreground flex-1">Кликните на комнату, чтобы выбрать её. Мебель из каталога появится здесь.</p>
                <button onClick={() => setShowHint(false)} className="text-muted-foreground hover:text-foreground">
                  <Icon name="X" size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Панель выбранной комнаты */}
      {selected && (
        <div className="mt-4 bg-card border border-primary/20 rounded-lg p-4 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name="LayoutGrid" size={16} className="text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground">{selected.label}</p>
              <p className="text-xs text-muted-foreground font-mono">{selected.area} · {selected.w / 10}×{selected.h / 10} м</p>
            </div>
            <button onClick={() => setSelectedRoom(null)} className="ml-auto text-muted-foreground hover:text-foreground">
              <Icon name="X" size={16} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              { label: "Ширина", val: `${selected.w / 10} м` },
              { label: "Длина", val: `${selected.h / 10} м` },
              { label: "Площадь", val: selected.area },
            ].map((s) => (
              <div key={s.label} className="bg-secondary rounded-lg p-2 text-center">
                <p className="text-primary font-bold font-mono">{s.val}</p>
                <p className="text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Размещённые предметы */}
      {placed.length > 0 && (
        <div className="mt-4 bg-card border border-border rounded-lg p-4">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Мебель на плане</p>
          <div className="flex flex-wrap gap-2">
            {placed.map((p) => (
              <div key={p.id}
                className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5 text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={() => setPlaced((prev) => prev.filter((x) => x.id !== p.id))}>
                <Icon name={p.icon} size={12} />
                <span>{p.name}</span>
                <Icon name="X" size={11} className="opacity-50" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
