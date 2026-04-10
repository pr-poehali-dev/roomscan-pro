import { useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
export { default as ScanSection } from "@/components/scan/ScanSection";

// ─── Данные каталога ────────────────────────────────────────────────────────
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

// ─── PlannerSection ──────────────────────────────────────────────────────────
interface Room { x: number; y: number; w: number; h: number; label: string; area: string; }
interface PlacedItem { id: number; name: string; x: number; y: number; w: number; h: number; icon: string; }

const defaultRooms: Room[] = [
  { x: 10, y: 10, w: 160, h: 120, label: "Гостиная", area: "28.4 м²" },
  { x: 10, y: 140, w: 100, h: 100, label: "Спальня", area: "18.2 м²" },
  { x: 180, y: 10, w: 80, h: 80, label: "Кухня", area: "12.1 м²" },
  { x: 180, y: 100, w: 80, h: 60, label: "Ванная", area: "7.8 м²" },
  { x: 120, y: 140, w: 60, h: 100, label: "Коридор", area: "8.6 м²" },
];

export function PlannerSection({ cartItems }: { cartItems?: typeof furnitureItems }) {
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

// ─── CatalogSection ──────────────────────────────────────────────────────────
export function CatalogSection() {
  const [filter, setFilter] = useState("Все");
  const [cart, setCart] = useState<number[]>([]);
  const [added, setAdded] = useState<number | null>(null);
  const categories = ["Все", "Диваны", "Столы", "Кресла", "Шкафы", "Кровати", "ТВ-зоны"];
  const filtered = filter === "Все" ? furnitureItems : furnitureItems.filter((f) => f.category === filter);

  const addToCart = useCallback((id: number) => {
    setCart((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    setAdded(id);
    setTimeout(() => setAdded(null), 1200);
  }, []);

  const totalPrice = cart.reduce((sum, id) => {
    const item = furnitureItems.find((f) => f.id === id);
    return sum + (item?.priceNum ?? 0);
  }, 0);

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">3D-библиотека</p>
          <h2 className="text-3xl font-bold">Каталог мебели</h2>
        </div>
        {cart.length > 0 && (
          <div className="flex items-center gap-3 bg-card border border-primary/20 rounded-lg px-4 py-2">
            <Icon name="ShoppingCart" size={16} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">{cart.length} поз.</span>
            <span className="text-sm font-black text-primary font-mono">
              {totalPrice.toLocaleString("ru-RU")} ₽
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {categories.map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors ${
              filter === c ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
            }`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const inCart = cart.includes(item.id);
          const justAdded = added === item.id;
          return (
            <div key={item.id}
              className={`bg-card border rounded-lg overflow-hidden transition-all cursor-pointer group ${
                inCart ? "border-primary/40" : "border-border hover:border-primary/30"
              }`}>
              <div className={`aspect-video flex items-center justify-center transition-colors ${
                inCart ? "bg-primary/10" : "bg-secondary group-hover:bg-primary/5"
              }`}>
                <Icon name={item.icon} size={40} className={`transition-colors ${
                  inCart ? "text-primary" : "text-border group-hover:text-primary/40"
                }`} />
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground font-mono mb-1">{item.brand} · {item.category}</p>
                <p className="font-semibold text-foreground mb-1">{item.name}</p>
                <p className="text-xs text-muted-foreground mb-3">{item.size}</p>
                <div className="flex items-center justify-between">
                  <span className="text-primary font-bold">{item.price}</span>
                  <button
                    onClick={() => addToCart(item.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all ${
                      justAdded
                        ? "bg-primary text-primary-foreground scale-95"
                        : inCart
                        ? "bg-primary/10 text-primary border border-primary/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                        : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
                    }`}>
                    <Icon name={inCart ? "Check" : "Plus"} size={12} />
                    {justAdded ? "Добавлено!" : inCart ? "В плане" : "В план"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {cart.length > 0 && (
        <div className="mt-6 bg-card border border-border rounded-lg p-5 animate-fade-in">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Выбранная мебель</p>
          <div className="space-y-2 mb-4">
            {cart.map((id) => {
              const item = furnitureItems.find((f) => f.id === id)!;
              return (
                <div key={id} className="flex items-center gap-3 text-sm">
                  <Icon name={item.icon} size={15} className="text-primary shrink-0" />
                  <span className="flex-1 text-foreground">{item.name}</span>
                  <span className="font-mono text-muted-foreground">{item.size}</span>
                  <span className="font-bold text-primary font-mono">{item.price}</span>
                  <button onClick={() => setCart((p) => p.filter((x) => x !== id))}
                    className="text-muted-foreground hover:text-destructive transition-colors">
                    <Icon name="X" size={14} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-sm text-muted-foreground">Итого: {cart.length} позиций</span>
            <span className="text-xl font-black text-primary font-mono">{totalPrice.toLocaleString("ru-RU")} ₽</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CalcSection ─────────────────────────────────────────────────────────────
export function CalcSection() {
  const [area, setArea] = useState(87.4);
  const [perim, setPerim] = useState(47.6);
  const [height, setHeight] = useState(2.8);
  const [doors, setDoors] = useState(6);
  const [windows, setWindows] = useState(8);
  const [lamPrice, setLamPrice] = useState(220);
  const [wallPrice, setWallPrice] = useState(480);
  const [ceilPrice, setCeilPrice] = useState(95);
  const [plinthPrice, setPlinthPrice] = useState(120);

  const wallArea = Math.max(0, perim * height - doors * 2.1 * 0.9 - windows * 1.4 * 1.1);
  const ceilArea = area;
  const floorArea = area * 0.98;

  const lamTotal  = Math.round(floorArea * 1.08 * lamPrice);
  const wallTotal = Math.round(wallArea * 1.1 * wallPrice);
  const ceilTotal = Math.round(ceilArea * ceilPrice);
  const plinthTotal = Math.round(perim * plinthPrice);
  const total = lamTotal + wallTotal + ceilTotal + plinthTotal;

  const params = [
    { label: "Площадь помещений", value: `${area.toFixed(1)} м²` },
    { label: "Периметр стен", value: `${perim.toFixed(1)} м` },
    { label: "Площадь пола", value: `${floorArea.toFixed(1)} м²` },
    { label: "Площадь потолка", value: `${ceilArea.toFixed(1)} м²` },
    { label: "Площадь стен (чистая)", value: `${wallArea.toFixed(1)} м²` },
    { label: "Дверных проёмов", value: `${doors} шт.` },
    { label: "Оконных проёмов", value: `${windows} шт.` },
    { label: "Объём помещений", value: `${(area * height).toFixed(1)} м³` },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">Калькулятор</p>
        <h2 className="text-3xl font-bold">Расчёты</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ввод параметров */}
        <div className="space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Параметры помещения</p>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            {[
              { label: "Площадь, м²", value: area, set: setArea, min: 1, max: 500, step: 0.1 },
              { label: "Периметр стен, м", value: perim, set: setPerim, min: 4, max: 200, step: 0.1 },
              { label: "Высота потолка, м", value: height, set: setHeight, min: 2, max: 5, step: 0.05 },
            ].map(({ label, value, set, min, max, step }) => (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-muted-foreground">{label}</label>
                  <span className="text-xs font-mono text-primary font-semibold">{value}</span>
                </div>
                <input type="range" min={min} max={max} step={step} value={value}
                  onChange={(e) => set(parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: "hsl(142 70% 36%)" }} />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              {[
                { label: "Дверей", value: doors, set: setDoors, max: 20 },
                { label: "Окон", value: windows, set: setWindows, max: 20 },
              ].map(({ label, value, set, max }) => (
                <div key={label}>
                  <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => set(Math.max(0, value - 1))}
                      className="w-7 h-7 bg-secondary rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-border transition-colors">
                      <Icon name="Minus" size={12} />
                    </button>
                    <span className="flex-1 text-center font-mono font-bold text-foreground text-sm">{value}</span>
                    <button onClick={() => set(Math.min(max, value + 1))}
                      className="w-7 h-7 bg-secondary rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-border transition-colors">
                      <Icon name="Plus" size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Цены материалов, ₽/м²</p>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            {[
              { label: "Ламинат", value: lamPrice, set: setLamPrice, min: 50, max: 2000, step: 10 },
              { label: "Обои/штукатурка", value: wallPrice, set: setWallPrice, min: 50, max: 3000, step: 10 },
              { label: "Краска потолка", value: ceilPrice, set: setCeilPrice, min: 20, max: 500, step: 5 },
              { label: "Плинтус (₽/м)", value: plinthPrice, set: setPlinthPrice, min: 20, max: 1000, step: 10 },
            ].map(({ label, value, set, min, max, step }) => (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-muted-foreground">{label}</label>
                  <span className="text-xs font-mono text-primary font-semibold">{value} ₽</span>
                </div>
                <input type="range" min={min} max={max} step={step} value={value}
                  onChange={(e) => set(parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: "hsl(142 70% 36%)" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Параметры + Смета */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Основные параметры</p>
            <div className="grid grid-cols-2 gap-2">
              {params.map((item) => (
                <div key={item.label} className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="font-mono font-semibold text-primary text-sm">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Смета материалов</p>
            <div className="space-y-2">
              {[
                { mat: "Напольное покрытие (ламинат)", qty: `${(floorArea * 1.08).toFixed(1)} м²`, price: `${lamPrice} ₽/м²`, total: lamTotal },
                { mat: "Стеновое покрытие (обои)", qty: `${(wallArea * 1.1).toFixed(1)} м²`, price: `${wallPrice} ₽/м²`, total: wallTotal },
                { mat: "Краска потолочная", qty: `${ceilArea.toFixed(1)} м²`, price: `${ceilPrice} ₽/м²`, total: ceilTotal },
                { mat: "Плинтус (пол)", qty: `${perim.toFixed(1)} м`, price: `${plinthPrice} ₽/м`, total: plinthTotal },
              ].map((r) => (
                <div key={r.mat} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-1.5">
                    <p className="text-sm font-semibold text-foreground">{r.mat}</p>
                    <p className="text-primary font-bold font-mono text-sm">{r.total.toLocaleString("ru-RU")} ₽</p>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground font-mono">
                    <span>{r.qty}</span><span>×</span><span>{r.price}</span>
                  </div>
                </div>
              ))}

              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground">Итого материалы</span>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">без учёта работ и доставки</p>
                </div>
                <span className="text-primary font-black text-2xl font-mono">{total.toLocaleString("ru-RU")} ₽</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ExportSection ────────────────────────────────────────────────────────────
export function ExportSection() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);

  const demoData = {
    project: "Квартира · демо-план",
    rooms: [
      { name: "Гостиная", area: 28.4, width: 16, length: 12, height: 2.8 },
      { name: "Спальня", area: 18.2, width: 10, length: 10, height: 2.8 },
      { name: "Кухня", area: 12.1, width: 8, length: 8, height: 2.8 },
      { name: "Ванная", area: 7.8, width: 8, length: 6, height: 2.5 },
      { name: "Коридор", area: 8.6, width: 6, length: 10, height: 2.8 },
    ],
    total_area: 75.1,
    generated: new Date().toISOString(),
  };

  const handleDownload = (label: string, action: () => void) => {
    setDownloading(label);
    setTimeout(() => {
      action();
      setDownloading(null);
      setDone((prev) => [...prev, label]);
    }, 900);
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(demoData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "roomscan-plan.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const rows = [
      ["Комната", "Площадь, м²", "Ширина, м", "Длина, м", "Высота, м"],
      ...demoData.rooms.map((r) => [r.name, r.area, r.width, r.length, r.height]),
      ["ИТОГО", demoData.total_area, "", "", ""],
    ];
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "roomscan-plan.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTXT = () => {
    const lines = [
      `RoomScan AI — Отчёт по помещению`,
      `Дата: ${new Date().toLocaleDateString("ru-RU")}`,
      `Проект: ${demoData.project}`,
      ``,
      `КОМНАТЫ:`,
      ...demoData.rooms.map((r) => `  ${r.name}: ${r.area} м² (${r.width}×${r.length} м, h=${r.height} м)`),
      ``,
      `Общая площадь: ${demoData.total_area} м²`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "roomscan-report.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const formats = [
    {
      icon: "FileJson", label: "JSON", desc: "Структурированные данные для разработчиков и интеграций",
      badge: "Реально", action: downloadJSON,
    },
    {
      icon: "Table2", label: "CSV / Excel-смета", desc: "Таблица помещений с размерами для Excel и Google Sheets",
      badge: "Реально", action: downloadCSV,
    },
    {
      icon: "FileText", label: "Текстовый отчёт", desc: "Читаемый отчёт с размерами всех помещений",
      badge: "Реально", action: downloadTXT,
    },
    {
      icon: "FileImage", label: "PNG / JPEG", desc: "Изображение плана в высоком разрешении",
      badge: "Скоро", action: null,
    },
    {
      icon: "File", label: "PDF", desc: "Полный документ с планом и спецификацией",
      badge: "Скоро", action: null,
    },
    {
      icon: "Box", label: "DWG / DXF", desc: "Файл AutoCAD для подрядчиков и проектировщиков",
      badge: "Про", action: null,
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">Форматы</p>
        <h2 className="text-3xl font-bold">Экспорт</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {formats.map((f) => {
          const isDownloading = downloading === f.label;
          const isDone = done.includes(f.label);
          const isActive = !!f.action;

          return (
            <div key={f.label}
              className={`bg-card border rounded-lg p-5 transition-all group ${
                isActive ? "border-border hover:border-primary/40 cursor-pointer" : "border-border opacity-60"
              }`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                  isDone ? "bg-primary/20" : "bg-secondary group-hover:bg-primary/10"
                }`}>
                  <Icon name={isDone ? "CheckCircle2" : f.icon} size={22}
                    className={isDone ? "text-primary" : "text-primary"} />
                </div>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${
                  f.badge === "Про" ? "bg-border text-muted-foreground"
                  : f.badge === "Реально" ? "bg-primary/10 text-primary"
                  : "bg-yellow-500/10 text-yellow-500"
                }`}>
                  {f.badge}
                </span>
              </div>
              <p className="font-bold text-foreground mb-1">{f.label}</p>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{f.desc}</p>
              <button
                disabled={!isActive || isDownloading}
                onClick={() => isActive && f.action && handleDownload(f.label, f.action)}
                className={`w-full text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all ${
                  !isActive
                    ? "bg-secondary/50 text-muted-foreground/50 cursor-not-allowed"
                    : isDone
                    ? "bg-primary/10 text-primary"
                    : isDownloading
                    ? "bg-primary text-primary-foreground opacity-80"
                    : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
                }`}>
                <Icon name={isDownloading ? "Loader2" : isDone ? "Check" : "Download"} size={14}
                  className={isDownloading ? "animate-spin" : ""} />
                {isDownloading ? "Подготовка..." : isDone ? "Скачано" : isActive ? "Скачать" : "Скоро"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-card border border-border rounded-lg p-5">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Предпросмотр данных</p>
        <div className="bg-secondary rounded-lg overflow-hidden">
          <div className="px-4 py-2 border-b border-border flex items-center gap-2">
            <Icon name="FileJson" size={13} className="text-primary" />
            <span className="text-xs font-mono text-muted-foreground">roomscan-plan.json</span>
          </div>
          <pre className="p-4 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed">
{JSON.stringify(demoData, null, 2).split("\n").slice(0, 18).join("\n")}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ─── HelpSection ──────────────────────────────────────────────────────────────
export function HelpSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: "Как запустить сканирование?", a: "Перейдите в раздел «Сканирование» и выберите метод: WebXR (для Android с ToF-сенсором) или Фотограмметрия (работает на любом смартфоне). Медленно обводите камерой все стены." },
    { q: "Какая точность измерений?", a: "WebXR Depth API даёт точность ±3–8 см при наличии ToF/LiDAR сенсора. Фотограмметрия (SfM) — ±5–15 см в зависимости от количества и качества кадров." },
    { q: "Можно ли экспортировать план?", a: "Да, в разделе «Экспорт» доступны форматы JSON, CSV (для Excel) и текстовый отчёт. Форматы PDF, PNG и DWG/DXF в разработке." },
    { q: "Как добавить мебель из каталога?", a: "В разделе «Каталог мебели» нажмите «В план» — предмет добавится в список. Итоговая стоимость считается автоматически." },
    { q: "Как работает калькулятор материалов?", a: "В разделе «Расчёты» введите параметры помещения (площадь, периметр, высота, число проёмов) и цены материалов — смета пересчитывается в реальном времени." },
    { q: "На каких устройствах работает WebXR?", a: "Google Pixel 4+, Samsung Galaxy S21 Ultra и другие Android-смартфоны с ToF-сенсором. Браузер: только Chrome 90+. iOS и iPhone не поддерживаются." },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">Документация</p>
        <h2 className="text-3xl font-bold">Помощь</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Частые вопросы</p>
          {faqs.map((faq, i) => (
            <div key={i} className="bg-card border border-border rounded-lg overflow-hidden transition-all">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-secondary/40 transition-colors">
                <Icon name="HelpCircle" size={16} className="text-primary shrink-0" />
                <span className="font-semibold text-foreground text-sm flex-1">{faq.q}</span>
                <Icon name={openFaq === i ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground shrink-0 transition-transform" />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 pl-[calc(1.25rem+16px+0.75rem)]">
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Связаться с нами</p>
          {[
            { icon: "MessageCircle", label: "Чат поддержки", desc: "Ответ в течение 5 минут", action: "Открыть чат", href: "https://poehali.dev/help" },
            { icon: "Mail", label: "Email", desc: "support@roomscan-ai.ru", action: "Написать", href: "mailto:support@roomscan-ai.ru" },
            { icon: "BookOpen", label: "База знаний", desc: "Видеоинструкции и статьи", action: "Перейти", href: "#" },
          ].map((c) => (
            <div key={c.label} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon name={c.icon} size={16} className="text-primary" />
                </div>
                <p className="font-semibold text-foreground text-sm">{c.label}</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{c.desc}</p>
              <a href={c.href} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                {c.action} <Icon name="ArrowRight" size={12} />
              </a>
            </div>
          ))}

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Zap" size={14} className="text-primary" />
              <p className="text-sm font-semibold text-foreground">RoomScan AI v1.0</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Сканирование через WebXR Depth API и фотограмметрию (Structure from Motion).
              Часть экосистемы <a href="https://avangard-ai.ru" target="_blank" rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline">АВАНГАРД</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
