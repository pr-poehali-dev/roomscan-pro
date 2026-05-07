import Icon from "@/components/ui/icon";

interface Room { x: number; y: number; w: number; h: number; label: string; area: string; }
interface PlacedItem { id: number; name: string; x: number; y: number; w: number; h: number; icon: string; }

interface Tool { id: string; icon: string; label: string }

/**
 * Демо-холст планировщика: панель инструментов, SVG-план с комнатами и мебелью,
 * хинт, панель выбранной комнаты и список размещённых предметов.
 * Логика и стили 1:1 перенесены из PlannerSection.tsx без изменений.
 */
export default function PlannerDemoCanvas({
  view,
  rooms,
  placed,
  setPlaced,
  selectedRoom,
  setSelectedRoom,
  selectedItem,
  setSelectedItem,
  activeTool,
  setActiveTool,
  tools,
  showHint,
  setShowHint,
  totalArea,
  selected,
}: {
  view: "2D" | "3D";
  rooms: Room[];
  placed: PlacedItem[];
  setPlaced: React.Dispatch<React.SetStateAction<PlacedItem[]>>;
  selectedRoom: string | null;
  setSelectedRoom: React.Dispatch<React.SetStateAction<string | null>>;
  selectedItem: number | null;
  setSelectedItem: React.Dispatch<React.SetStateAction<number | null>>;
  activeTool: string;
  setActiveTool: React.Dispatch<React.SetStateAction<string>>;
  tools: Tool[];
  showHint: boolean;
  setShowHint: React.Dispatch<React.SetStateAction<boolean>>;
  totalArea: string;
  selected: Room | undefined;
}) {
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

  return (
    <>
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
                backgroundImage: "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
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
                        fill={isSelected ? "rgba(34,197,94,0.12)" : "rgba(0,0,0,0.03)"}
                        stroke={isSelected ? "rgba(34,197,94,0.7)" : "rgba(0,0,0,0.25)"}
                        strokeWidth={isSelected ? "2" : "1.5"} rx="1" />
                      <text x={r.x + r.w / 2} y={r.y + r.h / 2 - 6}
                        textAnchor="middle" fill={isSelected ? "hsl(142,70%,40%)" : "rgba(0,0,0,0.55)"}
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
    </>
  );
}
