import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { calcEstimate, formatRub, type RoomInput } from "@/lib/estimate";
import type { ScanResult } from "./types";

interface Props {
  result: ScanResult;
}

/**
 * «Что дальше?» — блок ярких карточек после успешного скана.
 * Главная фишка: моментально показывает прикидочную смету ремонта
 * прямо здесь, а в один клик переводит в полный калькулятор.
 */
export default function AfterScanActions({ result }: Props) {
  // Мини-таймер «60 секунд» — анимация уверенности
  const [secs, setSecs] = useState(60);
  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  const room: RoomInput = useMemo(() => ({
    area: +result.area.toFixed(1),
    perimeter: +(2 * (result.width + result.length)).toFixed(1),
    height: +result.height.toFixed(2),
    doors: result.doors ?? 1,
    windows: result.windows ?? 1,
  }), [result]);

  const estStandart = useMemo(() => calcEstimate(room, "standart"), [room]);
  const estEconom   = useMemo(() => calcEstimate(room, "econom"),   [room]);
  const estPremium  = useMemo(() => calcEstimate(room, "premium"),  [room]);

  const navigate = (hash: string) => {
    if (typeof window === "undefined") return;
    window.location.hash = hash;
  };

  return (
    <div className="bg-gradient-to-br from-primary/15 via-emerald-500/5 to-amber-500/5 border-2 border-primary/40 rounded-2xl p-5 animate-fade-in space-y-4">
      <div className="flex items-center gap-2">
        <span className="bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
          За 60 секунд
        </span>
        <p className="font-black text-foreground uppercase tracking-wide text-sm">
          Готова прикидочная смета
        </p>
        {secs > 0 && (
          <span className="ml-auto text-[10px] font-mono text-muted-foreground">
            обновлено {60 - secs}с назад
          </span>
        )}
      </div>

      {/* 3 тарифа компактно */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { tier: "Эконом", est: estEconom, color: "border-emerald-500/30" },
          { tier: "Стандарт", est: estStandart, color: "border-primary/40" },
          { tier: "Премиум", est: estPremium, color: "border-amber-500/30" },
        ].map((c) => (
          <button
            key={c.tier}
            onClick={() => navigate("#calc")}
            className={`bg-card hover:bg-secondary/50 transition-colors border ${c.color} rounded-xl p-3 text-left`}
          >
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {c.tier}
            </p>
            <p className="font-black text-foreground font-mono mt-1 text-base leading-tight">
              {formatRub(c.est.grandTotal)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              ~{c.est.daysApprox} дней
            </p>
          </button>
        ))}
      </div>

      {/* Главная CTA */}
      <button
        onClick={() => navigate("#calc")}
        className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-3.5 rounded-xl hover:opacity-90 transition-opacity text-base shadow-lg shadow-primary/20"
      >
        <Icon name="Calculator" size={18} />
        Открыть полный калькулятор
        <Icon name="ArrowRight" size={16} />
      </button>

      {/* Дополнительные действия */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          onClick={() => navigate("#planner")}
          className="bg-card hover:bg-secondary/50 transition-colors border border-border rounded-xl p-3 text-left flex items-center gap-3"
        >
          <Icon name="LayoutGrid" size={18} className="text-primary shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-foreground text-xs">Планировщик</p>
            <p className="text-[10px] text-muted-foreground truncate">Расставить мебель</p>
          </div>
        </button>

        <button
          onClick={() => navigate("#styles")}
          className="bg-card hover:bg-secondary/50 transition-colors border border-border rounded-xl p-3 text-left flex items-center gap-3"
        >
          <Icon name="Wand2" size={18} className="text-primary shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-foreground text-xs">AI-стили</p>
            <p className="text-[10px] text-muted-foreground truncate">Скандинавия, лофт</p>
          </div>
        </button>

        <button
          onClick={() => navigate("#staging")}
          className="bg-card hover:bg-secondary/50 transition-colors border border-border rounded-xl p-3 text-left flex items-center gap-3"
        >
          <Icon name="TrendingUp" size={18} className="text-primary shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-foreground text-xs">Хоумстейджинг</p>
            <p className="text-[10px] text-muted-foreground truncate">Подготовка к продаже</p>
          </div>
        </button>
      </div>
    </div>
  );
}
