import Icon from "@/components/ui/icon";
import { TIER_META, type Tier } from "@/lib/estimate";

interface Props {
  value: Tier;
  onChange: (t: Tier) => void;
}

const TIER_ICONS: Record<Tier, string> = {
  econom: "Wrench",
  standart: "Star",
  premium: "Crown",
};

const TIER_COLORS: Record<Tier, string> = {
  econom:   "from-emerald-500/15 to-emerald-500/5 border-emerald-500/40 text-emerald-500",
  standart: "from-primary/15 to-primary/5 border-primary/40 text-primary",
  premium:  "from-amber-500/15 to-purple-500/10 border-amber-500/40 text-amber-500",
};

/**
 * Карточный селектор тарифа: Эконом / Стандарт / Премиум.
 * Каждая карточка — крупная, с иконкой, названием и описанием.
 */
export default function TierSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {(Object.keys(TIER_META) as Tier[]).map((t) => {
        const meta = TIER_META[t];
        const active = value === t;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={`relative text-left p-4 rounded-xl border-2 transition-all bg-gradient-to-br ${TIER_COLORS[t]} ${
              active ? "scale-[1.02] shadow-lg" : "opacity-60 hover:opacity-100"
            }`}
          >
            {active && (
              <span className="absolute top-2 right-2 bg-foreground text-background text-[10px] font-bold px-2 py-0.5 rounded-full">
                ВЫБРАН
              </span>
            )}
            <div className="flex items-center gap-2 mb-2">
              <Icon name={TIER_ICONS[t]} size={18} />
              <span className="font-black text-foreground text-base uppercase tracking-wide">
                {meta.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              {meta.desc}
            </p>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              <Icon name="Shield" size={11} />
              Гарантия {meta.warranty}
            </div>
          </button>
        );
      })}
    </div>
  );
}
