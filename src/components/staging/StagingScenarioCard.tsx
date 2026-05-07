import Icon from "@/components/ui/icon";
import { formatRubShort, type StagingScenario } from "@/lib/staging";

interface Props {
  scenario: StagingScenario;
  active: boolean;
  onSelect: () => void;
  marketPrice?: number;
}

const GOAL_ICONS: Record<StagingScenario["goal"], string> = {
  rent: "KeyRound",
  fast_sale: "Zap",
  max_price: "TrendingUp",
};

const GOAL_COLORS: Record<StagingScenario["goal"], string> = {
  rent:      "from-blue-500/15 to-blue-500/5 border-blue-500/40",
  fast_sale: "from-primary/15 to-primary/5 border-primary/40",
  max_price: "from-amber-500/15 to-purple-500/10 border-amber-500/40",
};

export default function StagingScenarioCard({ scenario, active, onSelect, marketPrice }: Props) {
  const upliftRub = marketPrice ? Math.round((marketPrice * scenario.expectedUplift) / 100) : 0;

  return (
    <button
      onClick={onSelect}
      className={`text-left p-4 rounded-xl border-2 transition-all bg-gradient-to-br ${GOAL_COLORS[scenario.goal]} ${
        active ? "scale-[1.02] shadow-lg" : "opacity-70 hover:opacity-100"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon name={GOAL_ICONS[scenario.goal]} size={18} className="text-foreground" />
        <span className="font-black text-foreground uppercase tracking-wide text-sm">
          {scenario.label}
        </span>
        {active && (
          <span className="ml-auto bg-foreground text-background text-[9px] font-bold px-2 py-0.5 rounded-full">
            ВЫБРАН
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        {scenario.desc}
      </p>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Бюджет</span>
          <span className="font-bold font-mono text-foreground">
            {formatRubShort(scenario.budget.min)} – {formatRubShort(scenario.budget.max)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Прирост цены</span>
          <span className="font-bold font-mono text-emerald-500">+{scenario.expectedUplift}%</span>
        </div>
        {marketPrice && upliftRub > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">≈ выгода</span>
            <span className="font-bold font-mono text-emerald-500">+{formatRubShort(upliftRub)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Срок</span>
          <span className="font-bold font-mono text-foreground">~{scenario.daysApprox} дн.</span>
        </div>
      </div>
    </button>
  );
}
