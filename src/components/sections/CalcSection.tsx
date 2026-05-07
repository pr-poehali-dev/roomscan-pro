import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { getLastScan } from "@/lib/scanStore";
import { calcEstimate, formatRub, type RoomInput, type Tier } from "@/lib/estimate";
import { saveProject } from "@/lib/projectsStore";
import { exportEstimatePDF } from "@/lib/pdfExport";
import TierSelector from "@/components/calc/TierSelector";
import EstimateGroupCard from "@/components/calc/EstimateGroupCard";
import RoomInputs from "@/components/calc/RoomInputs";

/**
 * Расширенный калькулятор сметы.
 * Считает все категории работ + материалы по 3 тарифам (Эконом / Стандарт / Премиум).
 * Может подставлять размеры из последнего скана.
 */
export default function CalcSection() {
  const [room, setRoom] = useState<RoomInput>(() => {
    const s = getLastScan();
    if (s) {
      return {
        area: +s.area.toFixed(1),
        perimeter: +(2 * (s.width + s.length)).toFixed(1),
        height: +s.height.toFixed(2),
        doors: s.doors ?? 1,
        windows: s.windows ?? 1,
      };
    }
    return { area: 30, perimeter: 22, height: 2.7, doors: 2, windows: 2 };
  });

  const [tier, setTier] = useState<Tier>("standart");
  const [autoFromScan, setAutoFromScan] = useState(false);

  // Если скан появился пока пользователь на странице — предложим подставить
  useEffect(() => {
    const handler = () => {
      const s = getLastScan();
      if (s) setAutoFromScan(true);
    };
    window.addEventListener("roomscan:lastScan:changed", handler);
    return () => window.removeEventListener("roomscan:lastScan:changed", handler);
  }, []);

  const result = useMemo(() => calcEstimate(room, tier), [room, tier]);

  // Сравнение всех тарифов
  const allTiers = useMemo(() => ({
    econom:   calcEstimate(room, "econom"),
    standart: calcEstimate(room, "standart"),
    premium:  calcEstimate(room, "premium"),
  }), [room]);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">Калькулятор</p>
        <h2 className="text-3xl font-bold">Расчёт стоимости ремонта</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Полная смета: демонтаж, черновые, чистовые работы, сантехника, электрика. Три уровня качества.
        </p>
      </div>

      {autoFromScan && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <Icon name="ScanLine" size={20} className="text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">У вас есть свежий скан комнаты</p>
            <p className="text-xs text-muted-foreground">Подставить размеры автоматически?</p>
          </div>
          <button
            onClick={() => {
              const s = getLastScan();
              if (s) {
                setRoom({
                  area: +s.area.toFixed(1),
                  perimeter: +(2 * (s.width + s.length)).toFixed(1),
                  height: +s.height.toFixed(2),
                  doors: s.doors ?? room.doors,
                  windows: s.windows ?? room.windows,
                });
              }
              setAutoFromScan(false);
            }}
            className="bg-primary text-primary-foreground font-bold text-xs px-3 py-2 rounded-lg hover:opacity-90"
          >
            Подставить
          </button>
          <button
            onClick={() => setAutoFromScan(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Icon name="X" size={16} />
          </button>
        </div>
      )}

      <TierSelector value={tier} onChange={setTier} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RoomInputs value={room} onChange={setRoom} />
        </div>

        <div className="lg:col-span-2 space-y-4">
          {/* Главный итог */}
          <div className="bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/40 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Итоговая стоимость · {result.tier === "econom" ? "Эконом" : result.tier === "standart" ? "Стандарт" : "Премиум"}
                </p>
                <p className="text-4xl font-black text-primary font-mono mt-1">
                  {formatRub(result.grandTotal)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ≈ {formatRub(result.perSqm)} за м² · работы + материалы
                </p>
              </div>
              <div className="flex flex-col gap-2 text-right">
                <span className="bg-card border border-border rounded-lg px-3 py-2 text-xs">
                  <Icon name="Calendar" size={11} className="inline mr-1 text-primary" />
                  ~{result.daysApprox} дней
                </span>
                <span className="bg-card border border-border rounded-lg px-3 py-2 text-xs">
                  <Icon name="Shield" size={11} className="inline mr-1 text-primary" />
                  Гарантия {result.warranty}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-primary/20">
              <div className="bg-card/60 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground font-mono uppercase">Работы</p>
                <p className="font-bold text-foreground">{formatRub(result.worksTotal)}</p>
              </div>
              <div className="bg-card/60 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground font-mono uppercase">Материалы</p>
                <p className="font-bold text-foreground">{formatRub(result.materialsTotal)}</p>
              </div>
            </div>
          </div>

          {/* Сравнение тарифов */}
          <div className="grid grid-cols-3 gap-2">
            {(["econom", "standart", "premium"] as Tier[]).map((t) => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  tier === t ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground"
                }`}
              >
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {t === "econom" ? "Эконом" : t === "standart" ? "Стандарт" : "Премиум"}
                </p>
                <p className={`font-bold font-mono mt-0.5 text-sm ${tier === t ? "text-primary" : "text-foreground"}`}>
                  {formatRub(allTiers[t].grandTotal)}
                </p>
              </button>
            ))}
          </div>

          {/* Действия со сметой */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                const name = prompt("Название проекта", `Ремонт ${room.area} м²`);
                if (!name) return;
                const lastScan = getLastScan();
                saveProject({
                  name,
                  scan: lastScan,
                  estimate: {
                    tier: result.tier,
                    grandTotal: result.grandTotal,
                    daysApprox: result.daysApprox,
                  },
                });
                alert("Проект сохранён в «Мои проекты»");
              }}
              className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary text-foreground font-bold text-sm px-3 py-2 rounded-lg transition-colors"
            >
              <Icon name="Bookmark" size={14} />
              Сохранить как проект
            </button>
            <button
              onClick={() => {
                const text = `Смета ремонта · ${room.area} м² · ${result.tier === "econom" ? "Эконом" : result.tier === "standart" ? "Стандарт" : "Премиум"}\n` +
                  result.groups.map((g) => `${g.name}: ${formatRub(g.total)}`).join("\n") +
                  `\nИтого: ${formatRub(result.grandTotal)} (${result.daysApprox} дней)`;
                navigator.clipboard?.writeText(text);
              }}
              className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary text-foreground font-bold text-sm px-3 py-2 rounded-lg transition-colors"
            >
              <Icon name="Copy" size={14} />
              Скопировать
            </button>
            <button
              onClick={() => exportEstimatePDF(room, result)}
              className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary font-bold text-sm px-3 py-2 rounded-lg transition-colors"
            >
              <Icon name="FileDown" size={14} />
              Скачать PDF
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary text-foreground font-bold text-sm px-3 py-2 rounded-lg transition-colors"
            >
              <Icon name="Printer" size={14} />
              Распечатать
            </button>
          </div>

          {/* Группы работ */}
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Детализация сметы
            </p>
            <div className="space-y-2">
              {result.groups.map((g) => (
                <EstimateGroupCard key={g.key} group={g} />
              ))}
            </div>
          </div>

          {/* CTA — заявка */}
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 flex-wrap">
            <Icon name="Hammer" size={28} className="text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm">Готовы начать ремонт?</p>
              <p className="text-xs text-muted-foreground">
                Партнёры АВАНГАРД работают по этой смете с фиксированной ценой
              </p>
            </div>
            <a
              href="https://avangard-ai.ru"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Найти мастера
              <Icon name="ArrowRight" size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}