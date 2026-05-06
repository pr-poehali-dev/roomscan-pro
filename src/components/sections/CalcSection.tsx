import { useState } from "react";
import Icon from "@/components/ui/icon";

export default function CalcSection() {
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
