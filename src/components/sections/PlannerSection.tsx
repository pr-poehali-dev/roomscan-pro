import { useState, useEffect } from "react";
import { getLastScan, getCart, type LastScan, type CartItemRef } from "@/lib/scanStore";
import FloorPlanEditor from "@/components/planner/FloorPlanEditor";
import PlannerTabs from "@/components/planner/PlannerTabs";
import PlannerDemoHeader from "@/components/planner/PlannerDemoHeader";
import PlannerDemoCanvas from "@/components/planner/PlannerDemoCanvas";
import ScannedRoomPlan from "@/components/planner/ScannedRoomPlan";

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
  const [tab, setTab] = useState<"editor" | "demo">("editor");
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

  const totalArea = rooms.reduce((sum, r) => sum + parseFloat(r.area), 0).toFixed(1);

  const selected = rooms.find((r) => r.label === selectedRoom);

  if (tab === "editor") {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">2D-редактор</p>
            <h2 className="text-3xl font-bold">Планировщик</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Профессиональный 2D/3D-редактор планов квартир и домов. Рисуйте стены, расставляйте двери,
              окна и мебель — план автоматически сохраняется на вашем устройстве.
            </p>
          </div>
          <PlannerTabs tab={tab} onChange={setTab} />
        </div>

        <FloorPlanEditor />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PlannerDemoHeader
        tab={tab}
        onTabChange={setTab}
        cartItemsList={cartItemsList}
        importFromCart={importFromCart}
        lastScan={lastScan}
        placed={placed}
        view={view}
        onViewChange={setView}
      />

      <PlannerDemoCanvas
        view={view}
        rooms={rooms}
        placed={placed}
        setPlaced={setPlaced}
        selectedRoom={selectedRoom}
        setSelectedRoom={setSelectedRoom}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        tools={tools}
        showHint={showHint}
        setShowHint={setShowHint}
        totalArea={totalArea}
        selected={selected}
      />

      {/* Реальный план комнаты со сканированными проёмами */}
      {lastScan && (
        <ScannedRoomPlan scan={lastScan} />
      )}
    </div>
  );
}