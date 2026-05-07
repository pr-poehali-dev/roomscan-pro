import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { calcStagingScenarios, formatRubShort, type StagingGoal } from "@/lib/staging";
import { saveProject } from "@/lib/projectsStore";
import { getLastScan } from "@/lib/scanStore";
import StagingScenarioCard from "@/components/staging/StagingScenarioCard";
import StagingTasksList from "@/components/staging/StagingTasksList";
import PhotoAnalyzer from "@/components/staging/PhotoAnalyzer";

/**
 * Хоумстейджинг — предпродажная подготовка квартиры.
 * Считает 3 сценария (Сдать / Продать быстро / Продать дорого)
 * с прогнозом увеличения цены продажи.
 */
export default function StagingSection() {
  const [area, setArea] = useState(35);
  const [marketPrice, setMarketPrice] = useState(8500000);
  const [goal, setGoal] = useState<StagingGoal>("fast_sale");

  const scenarios = useMemo(() => calcStagingScenarios({ area, marketPrice }), [area, marketPrice]);
  const active = scenarios.find((s) => s.goal === goal)!;
  const upliftRub = Math.round((marketPrice * active.expectedUplift) / 100);
  const investAvg = Math.round((active.budget.min + active.budget.max) / 2);
  const roi = investAvg > 0 ? Math.round((upliftRub / investAvg) * 100) : 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">
          Хоумстейджинг
        </p>
        <h2 className="text-3xl font-bold">Предпродажная подготовка</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          ИИ-помощник для риелторов и собственников. Считает бюджет подготовки квартиры
          и прогноз роста цены продажи. Готовый чек-лист задач — что убрать, что покрасить, что добавить.
        </p>
      </div>

      {/* Параметры квартиры */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex justify-between mb-2">
            <label className="text-xs text-muted-foreground">Площадь квартиры, м²</label>
            <span className="text-sm font-mono font-bold text-primary">{area} м²</span>
          </div>
          <input
            type="range"
            min={20}
            max={150}
            step={1}
            value={area}
            onChange={(e) => setArea(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: "hsl(142 70% 36%)" }}
          />
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex justify-between mb-2">
            <label className="text-xs text-muted-foreground">Текущая оценка квартиры</label>
            <span className="text-sm font-mono font-bold text-primary">
              {formatRubShort(marketPrice)}
            </span>
          </div>
          <input
            type="range"
            min={2_000_000}
            max={50_000_000}
            step={100_000}
            value={marketPrice}
            onChange={(e) => setMarketPrice(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: "hsl(142 70% 36%)" }}
          />
        </div>
      </div>

      {/* Сценарии */}
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Выберите цель
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {scenarios.map((s) => (
            <StagingScenarioCard
              key={s.goal}
              scenario={s}
              active={s.goal === goal}
              onSelect={() => setGoal(s.goal)}
              marketPrice={marketPrice}
            />
          ))}
        </div>
      </div>

      {/* AI-анализ фото */}
      <PhotoAnalyzer area={area} goal={goal} />

      {/* ROI блок */}
      <div className="bg-gradient-to-br from-emerald-500/15 to-primary/5 border-2 border-emerald-500/40 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="TrendingUp" size={20} className="text-emerald-500" />
          <p className="font-black text-foreground uppercase tracking-wide">
            Прогноз окупаемости
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card/60 rounded-xl p-3">
            <p className="text-[10px] font-mono uppercase text-muted-foreground">Инвестиции</p>
            <p className="font-bold text-foreground mt-1">{formatRubShort(investAvg)}</p>
          </div>
          <div className="bg-card/60 rounded-xl p-3">
            <p className="text-[10px] font-mono uppercase text-muted-foreground">Прирост цены</p>
            <p className="font-bold text-emerald-500 mt-1">+{formatRubShort(upliftRub)}</p>
          </div>
          <div className="bg-card/60 rounded-xl p-3">
            <p className="text-[10px] font-mono uppercase text-muted-foreground">Чистая выгода</p>
            <p className="font-bold text-emerald-500 mt-1">
              +{formatRubShort(Math.max(0, upliftRub - investAvg))}
            </p>
          </div>
          <div className="bg-card/60 rounded-xl p-3">
            <p className="text-[10px] font-mono uppercase text-muted-foreground">ROI</p>
            <p className="font-bold text-emerald-500 mt-1">{roi}%</p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          ⓘ Прогноз основан на средних данных рынка вторичного жилья.
          Реальный результат зависит от региона, состояния квартиры и стратегии продажи.
        </p>
      </div>

      {/* Сохранить как проект */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => {
            const defaultName = `Стейджинг ${area} м²`;
            const name = window.prompt("Название проекта", defaultName) ?? defaultName;
            if (!name.trim()) return;
            saveProject({
              name: name.trim(),
              scan: getLastScan(),
              staging: {
                goal: active.goal,
                budget: investAvg,
                expectedUplift: active.expectedUplift,
              },
            });
            import("@/lib/notify").then(({ notify }) =>
              notify.success("Проект сохранён", "Откройте «Мои проекты» — он там"),
            );
          }}
          className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary text-foreground font-bold text-sm px-3 py-2 rounded-lg transition-colors"
        >
          <Icon name="Bookmark" size={14} />
          Сохранить как проект
        </button>
      </div>

      {/* Чек-лист задач */}
      <StagingTasksList scenario={active} />

      {/* CTA */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 flex-wrap">
        <Icon name="Sparkles" size={28} className="text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm">Нужна помощь со стейджингом?</p>
          <p className="text-xs text-muted-foreground">
            Наши партнёры подготовят квартиру под ключ за {active.daysApprox} дней
          </p>
        </div>
        <a
          href="https://avangard-ai.ru"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          Заказать услугу
          <Icon name="ArrowRight" size={14} />
        </a>
      </div>
    </div>
  );
}