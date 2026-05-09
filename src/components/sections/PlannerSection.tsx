import { useState, useEffect } from "react";
import { getLastScan, getCart, type LastScan, type CartItemRef } from "@/lib/scanStore";
import FloorPlanEditor from "@/components/planner/FloorPlanEditor";
import PlannerTabs from "@/components/planner/PlannerTabs";
import PlannerDemoHeader from "@/components/planner/PlannerDemoHeader";
import PlannerDemoCanvas from "@/components/planner/PlannerDemoCanvas";
import ScannedRoomPlan from "@/components/planner/ScannedRoomPlan";

interface Room { x: number; y: number; w: number; h: number; label: string; area: string; }
interface PlacedItem { id: number; name: string; x: number; y: number; w: number; h: number; icon: string; }

const defaultRooms: Room[] = [
  { x: 10, y: 10, w: 160, h: 120, label: "Гостиная", area: "28.4 м²" },
  { x: 10, y: 140, w: 100, h: 100, label: "Спальня", area: "18.2 м²" },
  { x: 180, y: 10, w: 80, h: 80, label: "Кухня", area: "12.1 м²" },
  { x: 180, y: 100, w: 80, h: 60, label: "Ванная", area: "7.8 м²" },
  { x: 120, y: 140, w: 60, h: 100, label: "Коридор", area: "8.6 м²" },
];

export default function PlannerSection({
  onNavigate,
}: {
  onNavigate?: (section: string) => void;
}) {
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

        <FloorPlanEditor onNavigateCatalog={onNavigate ? () => onNavigate("catalog") : undefined} />
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