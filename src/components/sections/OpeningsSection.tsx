import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { getLastScan } from "@/lib/scanStore";
import {
  calcWindow, calcDoor, PROFILES, GLAZINGS, DOORS,
  type WindowSpec, type DoorSpec, type WindowProfile, type WindowGlazing, type DoorType, type DoorMaterial,
} from "@/lib/openings";

/**
 * Калькулятор окон и дверей.
 * Считает стоимость с установкой по профилям/материалам/размерам.
 * Поддерживает авто-подстановку количества из последнего скана.
 */
export default function OpeningsSection() {
  const [tab, setTab] = useState<"windows" | "doors">("windows");

  // Авто-подстановка количества из скана
  const [scanWin, setScanWin] = useState<number | null>(null);
  const [scanDoor, setScanDoor] = useState<number | null>(null);
  useEffect(() => {
    const apply = () => {
      const s = getLastScan();
      setScanWin(s?.windows ?? null);
      setScanDoor(s?.doors ?? null);
    };
    apply();
    window.addEventListener("roomscan:lastScan:changed", apply);
    return () => window.removeEventListener("roomscan:lastScan:changed", apply);
  }, []);

  // ─── Окна ──────────────────────────────────────────────────────────────────
  const [win, setWin] = useState<WindowSpec>({
    profile: "pvc",
    glazing: "double",
    width: 140,
    height: 140,
    sashes: 2,
    count: 1,
  });
  const winResult = useMemo(() => calcWindow(win), [win]);

  // ─── Двери ─────────────────────────────────────────────────────────────────
  const [door, setDoor] = useState<DoorSpec>({
    type: "interior",
    material: "mdf",
    width: 80,
    height: 200,
    count: 1,
  });
  const doorResult = useMemo(() => calcDoor(door), [door]);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">
          Калькулятор
        </p>
        <h2 className="text-3xl font-bold">Окна и двери</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Расчёт стоимости с установкой. ПВХ, алюминий, дерево — для окон. МДФ, массив, металл — для дверей.
        </p>
      </div>

      {/* Tabs */}
      <div className="inline-flex bg-secondary rounded-lg p-1">
        {([
          { id: "windows", label: "Окна", icon: "Square" },
          { id: "doors", label: "Двери", icon: "DoorOpen" },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${
              tab === t.id
                ? "bg-card text-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "windows" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            {scanWin !== null && win.count !== scanWin && (
              <button
                onClick={() => setWin({ ...win, count: scanWin })}
                className="w-full bg-primary/10 border border-primary/30 rounded-lg px-3 py-2 text-xs text-primary font-bold flex items-center gap-2 hover:bg-primary/20 transition-colors"
              >
                <Icon name="ScanLine" size={12} />
                Подставить из скана: {scanWin} окон
              </button>
            )}

            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Профиль</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(PROFILES) as WindowProfile[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setWin({ ...win, profile: p })}
                    className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                      win.profile === p ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {PROFILES[p].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Стеклопакет</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(GLAZINGS) as WindowGlazing[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setWin({ ...win, glazing: g })}
                    className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                      win.glazing === g ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {GLAZINGS[g].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NumField label="Ширина, см" min={40} max={400} value={win.width} onChange={(v) => setWin({ ...win, width: v })} />
              <NumField label="Высота, см" min={40} max={300} value={win.height} onChange={(v) => setWin({ ...win, height: v })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NumField label="Створок" min={1} max={4} value={win.sashes} onChange={(v) => setWin({ ...win, sashes: v })} step={1} />
              <NumField label="Количество окон" min={1} max={20} value={win.count} onChange={(v) => setWin({ ...win, count: v })} step={1} />
            </div>
          </div>

          <ResultCard
            title="Стоимость окон"
            unit={winResult.unit}
            total={winResult.total}
            count={win.count}
            lines={winResult.lines}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            {scanDoor !== null && door.count !== scanDoor && (
              <button
                onClick={() => setDoor({ ...door, count: scanDoor })}
                className="w-full bg-primary/10 border border-primary/30 rounded-lg px-3 py-2 text-xs text-primary font-bold flex items-center gap-2 hover:bg-primary/20 transition-colors"
              >
                <Icon name="ScanLine" size={12} />
                Подставить из скана: {scanDoor} двери
              </button>
            )}

            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Тип</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: "interior" as DoorType, label: "Межкомнатная" },
                  { id: "entry" as DoorType, label: "Входная" },
                ]).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setDoor({ ...door, type: t.id, material: "mdf" })}
                    className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                      door.type === t.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Материал</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(DOORS[door.type]) as DoorMaterial[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setDoor({ ...door, material: m })}
                    className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                      door.material === m ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {DOORS[door.type][m].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NumField label="Ширина, см" min={60} max={140} value={door.width} onChange={(v) => setDoor({ ...door, width: v })} />
              <NumField label="Высота, см" min={180} max={250} value={door.height} onChange={(v) => setDoor({ ...door, height: v })} />
            </div>

            <NumField label="Количество дверей" min={1} max={20} value={door.count} onChange={(v) => setDoor({ ...door, count: v })} step={1} />
          </div>

          <ResultCard
            title="Стоимость дверей"
            unit={doorResult.unit}
            total={doorResult.total}
            count={door.count}
            lines={doorResult.lines}
          />
        </div>
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function NumField({
  label, min, max, value, onChange, step = 5,
}: { label: string; min: number; max: number; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-mono font-bold text-primary">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: "hsl(142 70% 36%)" }}
      />
    </div>
  );
}

function ResultCard({
  title, unit, total, count, lines,
}: { title: string; unit: number; total: number; count: number; lines: { label: string; value: string }[] }) {
  return (
    <div className="bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/40 rounded-xl p-5 space-y-4">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
        <p className="text-3xl font-black text-primary font-mono mt-1">
          {total.toLocaleString("ru-RU")} ₽
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {count > 1 ? `${count} шт × ${unit.toLocaleString("ru-RU")} ₽` : "за единицу"}
        </p>
      </div>

      <div className="space-y-1.5 pt-3 border-t border-primary/20">
        {lines.map((l, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{l.label}</span>
            <span className="font-mono text-foreground font-semibold">{l.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
