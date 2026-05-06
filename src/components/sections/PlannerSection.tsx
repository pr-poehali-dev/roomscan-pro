import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { getLastScan, getCart, type LastScan, type DetectedOpening, type CartItemRef } from "@/lib/scanStore";
import { exportPlanToPDF } from "@/lib/planExporter";

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
  const [lastScan, setLastScan] = useState<LastScan | null>(null);
  const [cartItemsList, setCartItemsList] = useState<CartItemRef[]>([]);

  useEffect(() => {
    const sync = () => {
      setLastScan(getLastScan());
      setCartItemsList(getCart());
    };
    sync();
    window.addEventListener("roomscan:lastScan:changed", sync);
    window.addEventListener("roomscan:cart:changed", sync);
    return () => {
      window.removeEventListener("roomscan:lastScan:changed", sync);
      window.removeEventListener("roomscan:cart:changed", sync);
    };
  }, []);

  const importFromCart = () => {
    if (cartItemsList.length === 0) return;
    const startX = 30;
    const startY = 30;
    const items: PlacedItem[] = cartItemsList.map((c, i) => ({
      id: Date.now() + i,
      name: c.name,
      icon: c.icon,
      x: startX + (i % 3) * 50,
      y: startY + Math.floor(i / 3) * 30,
      w: Math.min(c.w / 5, 60),
      h: Math.min(c.d / 5, 40),
    }));
    setPlaced((prev) => [...prev, ...items]);
  };

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
          {cartItemsList.length > 0 && (
            <button
              onClick={importFromCart}
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5"
              title="Перенести мебель из корзины на план"
            >
              <Icon name="ShoppingCart" size={13} />
              + из корзины ({cartItemsList.length})
            </button>
          )}
          {lastScan && (
            <button
              onClick={() => exportPlanToPDF({
                scan: lastScan,
                cart: cartItemsList,
                placed: placed.map((p) => ({ id: p.id, name: p.name, x: p.x, y: p.y, w: p.w, h: p.h })),
                title: "RoomScan AI · План помещения",
              }, `roomscan-plan-${Date.now()}.pdf`)}
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors flex items-center gap-1.5"
              title="Скачать план в PDF (A4)"
            >
              <Icon name="FileDown" size={13} />
              PDF
            </button>
          )}
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

      {/* Реальный план комнаты со сканированными проёмами */}
      {lastScan && (
        <ScannedRoomPlan scan={lastScan} />
      )}
    </div>
  );
}

// ─── Реальный план от последнего скана ───────────────────────────────────────
function ScannedRoomPlan({ scan }: { scan: LastScan }) {
  const openings = scan.openings ?? [];
  const W = scan.width;
  const L = scan.length;

  // SVG canvas: 320×220, отступ 20
  const PAD = 20;
  const SVG_W = 320;
  const SVG_H = 220;
  const innerW = SVG_W - PAD * 2;
  const innerH = SVG_H - PAD * 2;

  // масштабируем bbox комнаты в SVG (сохраняя пропорции)
  const scale = Math.min(innerW / W, innerH / L);
  const roomW = W * scale;
  const roomL = L * scale;
  const ox = (SVG_W - roomW) / 2;
  const oy = (SVG_H - roomL) / 2;

  // Распределяем проёмы по 4 стенам по wall_idx % 4:
  // 0 = низ, 1 = право, 2 = верх, 3 = лево
  // позиция вдоль стены — равномерно по числу проёмов на этой стене
  type OpeningOnWall = DetectedOpening & { wallSide: 0 | 1 | 2 | 3; orderOnWall: number; totalOnWall: number };

  const byWall: Record<number, DetectedOpening[]> = { 0: [], 1: [], 2: [], 3: [] };
  openings.forEach((o) => {
    const side = (o.wall_idx % 4) as 0 | 1 | 2 | 3;
    byWall[side].push(o);
  });

  const positioned: OpeningOnWall[] = [];
  ([0, 1, 2, 3] as const).forEach((side) => {
    byWall[side].forEach((o, idx) => {
      positioned.push({ ...o, wallSide: side, orderOnWall: idx, totalOnWall: byWall[side].length });
    });
  });

  // координаты проёма на стене
  const renderOpening = (o: OpeningOnWall, key: number) => {
    const segLen = o.width * scale;
    let x = 0, y = 0, w = 0, h = 0;
    const STROKE = 6; // толщина "стены" для отображения проёма
    // позиция вдоль стены: равномерное распределение
    const t = (o.orderOnWall + 0.5) / o.totalOnWall; // 0..1

    if (o.wallSide === 0) {
      // нижняя стена: горизонтальный сегмент
      x = ox + t * roomW - segLen / 2;
      y = oy + roomL - STROKE / 2;
      w = segLen;
      h = STROKE;
    } else if (o.wallSide === 2) {
      // верхняя стена
      x = ox + t * roomW - segLen / 2;
      y = oy - STROKE / 2;
      w = segLen;
      h = STROKE;
    } else if (o.wallSide === 1) {
      // правая стена: вертикальный сегмент
      x = ox + roomW - STROKE / 2;
      y = oy + t * roomL - segLen / 2;
      w = STROKE;
      h = segLen;
    } else {
      // левая стена
      x = ox - STROKE / 2;
      y = oy + t * roomL - segLen / 2;
      w = STROKE;
      h = segLen;
    }

    const isDoor = o.type === "door";
    const color = isDoor ? "rgb(249,115,22)" : "rgb(56,189,248)";
    const labelX = x + w / 2;
    const labelY = y + h / 2;

    return (
      <g key={key}>
        <rect x={x} y={y} width={w} height={h} fill={color} rx="1.5" />
        <circle cx={labelX} cy={labelY} r="7" fill={color} stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
        <text x={labelX} y={labelY + 2.5} textAnchor="middle" fontSize="7" fontFamily="IBM Plex Mono"
              fill="white" fontWeight="700">
          {isDoor ? "Д" : "О"}
        </text>
      </g>
    );
  };

  const doorsCount   = openings.filter((o) => o.type === "door").length;
  const windowsCount = openings.filter((o) => o.type === "window").length;

  return (
    <div className="mt-4 bg-card border border-primary/20 rounded-lg p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="Sparkles" size={14} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Реальный план от скана</p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {W} × {L} м · h={scan.height} м · {scan.area} м²
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 bg-orange-500/10 text-orange-500 rounded-md px-2 py-1 font-semibold">
            <span className="w-2 h-2 bg-orange-500 rounded-sm" /> {doorsCount} {doorsCount === 1 ? "дверь" : "двери"}
          </span>
          <span className="flex items-center gap-1 bg-sky-400/10 text-sky-400 rounded-md px-2 py-1 font-semibold">
            <span className="w-2 h-2 bg-sky-400 rounded-sm" /> {windowsCount} {windowsCount === 1 ? "окно" : "окон"}
          </span>
        </div>
      </div>

      <div className="bg-secondary/30 rounded-lg overflow-hidden border border-border">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ height: 240 }}>
          {/* фон-сетка */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* стены комнаты */}
          <rect
            x={ox} y={oy} width={roomW} height={roomL}
            fill="rgba(34,197,94,0.05)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="3"
            rx="1"
          />

          {/* размеры */}
          <text x={ox + roomW / 2} y={oy - 6} textAnchor="middle"
                fontSize="9" fontFamily="IBM Plex Mono" fill="hsl(142,70%,55%)">
            {W} м
          </text>
          <text x={ox - 8} y={oy + roomL / 2} textAnchor="middle"
                fontSize="9" fontFamily="IBM Plex Mono" fill="hsl(142,70%,55%)"
                transform={`rotate(-90 ${ox - 8} ${oy + roomL / 2})`}>
            {L} м
          </text>

          {/* проёмы поверх стен */}
          {positioned.map((o, i) => renderOpening(o, i))}

          {/* подпись комнаты */}
          <text x={ox + roomW / 2} y={oy + roomL / 2} textAnchor="middle"
                fontSize="11" fontFamily="IBM Plex Mono" fill="rgba(255,255,255,0.4)" fontWeight="600">
            Комната
          </text>
          <text x={ox + roomW / 2} y={oy + roomL / 2 + 14} textAnchor="middle"
                fontSize="9" fontFamily="IBM Plex Mono" fill="rgba(255,255,255,0.3)">
            {scan.area} м²
          </text>
        </svg>
      </div>

      {openings.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
          <Icon name="Info" size={12} />
          Проёмы не обнаружены. Попробуйте сканировать с большим количеством кадров.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {openings.slice(0, 6).map((o, i) => (
            <div key={i} className="flex items-center gap-2 bg-secondary/40 rounded-md px-2 py-1.5 text-xs">
              <Icon
                name={o.type === "door" ? "DoorOpen" : "AppWindow"}
                size={12}
                className={o.type === "door" ? "text-orange-500" : "text-sky-400"}
              />
              <span className="text-foreground font-semibold">
                {o.type === "door" ? "Дверь" : "Окно"} #{i + 1}
              </span>
              <span className="text-muted-foreground font-mono ml-auto">
                {o.width}×{o.height}м
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}