import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import {
  buildStyleBundle,
  styleLabel,
  tierLabel,
  type BundleStyle,
  type BundleTier,
  type StyleBundle,
} from "@/lib/styleBundleBuilder";
import { addProjectItem, getLastScan, getWallsGeometry } from "@/lib/scanStore";

/**
 * AI-подбор готового комплекта материалов и мебели под стиль интерьера.
 *
 * Пользователь:
 *  1. Выбирает стиль (13 направлений)
 *  2. Выбирает уровень бюджета (Эконом / Стандарт / Премиум)
 *  3. Включает/выключает тёплый пол VALTEC
 *  4. Получает готовый комплект со сметой и палитрой
 *  5. Может одним кликом добавить весь комплект в проект.
 */

const STYLE_OPTIONS: { id: BundleStyle; icon: string; tagline: string }[] = [
  { id: "scandi",      icon: "TreeDeciduous",  tagline: "Светлые тона, дерево, минимализм" },
  { id: "japandi",     icon: "Sprout",         tagline: "Японский дзен × сканди уют" },
  { id: "loft",        icon: "Factory",        tagline: "Кирпич, металл, индастриал" },
  { id: "industrial",  icon: "Hammer",         tagline: "Грубо, мужественно, винтаж" },
  { id: "classic",     icon: "Crown",          tagline: "Симметрия, лепнина, тёплое дерево" },
  { id: "artdeco",     icon: "Gem",            tagline: "Золото, бархат, геометрия" },
  { id: "glam",        icon: "Sparkles",       tagline: "Зеркала, мрамор, акценты золота" },
  { id: "midcentury",  icon: "Armchair",       tagline: "Тиковое дерево, 60-е, изгибы" },
  { id: "modern",      icon: "Square",         tagline: "Чистые линии, нейтрально" },
  { id: "minimal",     icon: "Minus",          tagline: "Только нужное и ничего лишнего" },
  { id: "boho",        icon: "Flower2",        tagline: "Текстиль, эклектика, тёплые тона" },
  { id: "provence",    icon: "Wind",           tagline: "Прованс: лаванда и натуральное" },
  { id: "wabi-sabi",   icon: "Droplets",       tagline: "Несовершенство как красота" },
];

const TIERS: { id: BundleTier; label: string; hint: string; icon: string }[] = [
  { id: "econom",   label: "Эконом",   hint: "Минимальный бюджет", icon: "PiggyBank" },
  { id: "standard", label: "Стандарт", hint: "Оптимальный баланс", icon: "Scale" },
  { id: "premium",  label: "Премиум",  hint: "Лучшие материалы",   icon: "Crown" },
];

function fmt(n: number): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n);
}

export default function StyleBundleStudio() {
  const [style, setStyle] = useState<BundleStyle>("scandi");
  const [tier, setTier] = useState<BundleTier>("standard");
  const [withFloor, setWithFloor] = useState(true);

  /* Геометрия из скана. */
  const scan = getLastScan();
  const walls = getWallsGeometry();
  const area = scan?.area ?? 25;
  const wallsArea = walls?.wallsAreaNet ?? walls?.wallsArea ?? 50;

  const bundle: StyleBundle = useMemo(
    () => buildStyleBundle(style, { area, wallsArea, withFloorHeating: withFloor }, tier),
    [style, tier, withFloor, area, wallsArea],
  );

  function addAllToProject() {
    if (!bundle.lines.length) {
      toast.error("Не удалось собрать комплект для этого стиля");
      return;
    }
    for (const l of bundle.lines) {
      const src =
        l.source === "wall" ? "walls" :
        l.source === "tile" ? "tiles" :
        l.source === "furniture" ? "furniture" : "other";
      addProjectItem({
        id: `bundle-${bundle.style}-${l.source}-${l.id}`,
        source: src,
        title: l.title,
        subtitle: l.brand ?? styleLabel(bundle.style),
        unit: (l.unit as "шт" | "м²" | "рулон" | "м" | "комплект"),
        qty: l.qty,
        pricePerUnit: l.pricePerUnit,
        addedAt: Date.now(),
      });
    }
    toast.success(`Комплект «${styleLabel(bundle.style)}» добавлен в проект`, {
      description: `${bundle.lines.length} позиций · ${fmt(bundle.totals.grand)}`,
    });
  }

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
          <Icon name="Wand2" size={26} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            AI-комплект под стиль интерьера
            <span className="px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-700 dark:text-violet-300 text-[10px] font-mono uppercase tracking-widest">
              New
            </span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Выберите стиль и уровень бюджета — ИИ соберёт согласованный набор: отделка стен,
            пол, мебель, тёплый пол VALTEC. Готовая смета и палитра.
          </p>
        </div>
      </div>

      {/* Стили */}
      <section>
        <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground mb-2">
          1. Стиль
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {STYLE_OPTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={`text-left p-3 rounded-xl border-2 transition-all ${
                style === s.id
                  ? "bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/30"
                  : "bg-card border-border hover:border-violet-500/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon name={s.icon} size={18} className={style === s.id ? "" : "text-violet-500"} />
                <div className="text-sm font-bold">{styleLabel(s.id)}</div>
              </div>
              <div className={`text-[11px] leading-tight ${style === s.id ? "text-white/85" : "text-muted-foreground"}`}>
                {s.tagline}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Бюджет + тёплый пол */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground mb-2">
            2. Уровень бюджета
          </div>
          <div className="grid grid-cols-3 gap-2">
            {TIERS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTier(t.id)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  tier === t.id
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon name={t.icon} size={18} className={tier === t.id ? "" : "text-primary"} />
                  <span className="text-sm font-bold">{t.label}</span>
                </div>
                <div className={`text-[11px] mt-0.5 ${tier === t.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {t.hint}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground mb-2">
            3. Опция
          </div>
          <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
            withFloor ? "bg-blue-500/10 border-blue-500" : "bg-card border-border"
          }`}>
            <input
              type="checkbox"
              checked={withFloor}
              onChange={(e) => setWithFloor(e.target.checked)}
              className="w-5 h-5 accent-blue-500"
            />
            <div className="flex-1">
              <div className="text-sm font-bold flex items-center gap-1.5">
                <Icon name="Thermometer" size={14} className="text-blue-500" />
                Тёплый пол VALTEC
              </div>
              <div className="text-[11px] text-muted-foreground">
                {tier === "econom"
                  ? "Недоступно в Эконом"
                  : "PEX-EVOH + Combimix под ключ"}
              </div>
            </div>
          </label>
        </div>
      </section>

      {/* Палитра */}
      <section className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
        <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
          Палитра
        </div>
        <div className="flex gap-1.5">
          {bundle.palette.map((c, i) => (
            <div key={i} className="w-8 h-8 rounded-md border border-border shadow-sm" style={{ backgroundColor: c }} />
          ))}
        </div>
        <div className="text-xs text-muted-foreground ml-auto hidden sm:block">
          {styleLabel(bundle.style)} · {tierLabel(bundle.tier)}
        </div>
      </section>

      {/* Спецификация */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
            Что входит в комплект
          </div>
          {!scan && (
            <div className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <Icon name="Info" size={12} />
              Без скана: расчёт по комнате 25 м²
            </div>
          )}
        </div>

        {bundle.lines.length === 0 ? (
          <div className="p-8 rounded-xl border-2 border-dashed border-border text-center">
            <Icon name="Search" size={24} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Для стиля «{styleLabel(bundle.style)}» в выбранном бюджете пока нет позиций.
              Попробуйте сменить уровень или стиль.
            </p>
          </div>
        ) : (
          <div className="bg-card border-2 border-border rounded-xl overflow-hidden divide-y divide-border">
            {bundle.lines.map((l, idx) => (
              <div key={idx} className="p-3 flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-border shrink-0 flex items-center justify-center"
                  style={l.color ? { backgroundColor: l.color } : undefined}
                >
                  <Icon
                    name={
                      l.source === "wall" ? "Wallpaper" :
                      l.source === "tile" ? "Grid2x2" :
                      l.source === "floor-heating" ? "Thermometer" :
                      "Sofa"
                    }
                    size={18}
                    className={l.color ? "text-white drop-shadow" : "text-primary"}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground">{l.title}</div>
                  {l.brand && (
                    <div className="text-[11px] font-mono text-muted-foreground">{l.brand}</div>
                  )}
                  <div className="text-[11px] text-muted-foreground mt-0.5 italic">{l.reason}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-muted-foreground">
                    {l.qty} {l.unit} × {fmt(l.pricePerUnit)}
                  </div>
                  <div className="text-sm font-bold text-foreground">{fmt(l.total)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Итоги */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        <SummaryCard label="Стены" value={bundle.totals.walls} icon="Wallpaper" tone="rose" />
        <SummaryCard label="Пол" value={bundle.totals.floor} icon="Grid2x2" tone="amber" />
        <SummaryCard label="Мебель" value={bundle.totals.furniture} icon="Sofa" tone="emerald" />
        <SummaryCard label="Тёплый пол" value={bundle.totals.floorHeating} icon="Thermometer" tone="blue" />
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white rounded-xl p-3 shadow-lg">
          <div className="text-[10px] uppercase tracking-widest font-mono opacity-80">Итого</div>
          <div className="text-xl font-black mt-0.5 leading-tight">{fmt(bundle.totals.grand)}</div>
        </div>
      </section>

      {/* CTA */}
      <button
        onClick={addAllToProject}
        disabled={!bundle.lines.length}
        className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        <Icon name="ShoppingBag" size={18} />
        Добавить весь комплект в проект ({bundle.lines.length} позиций)
      </button>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: string;
  tone: "rose" | "amber" | "emerald" | "blue";
}) {
  const toneMap = {
    rose: "from-rose-500/10 to-rose-500/0 border-rose-500/30 text-rose-700 dark:text-rose-300",
    amber: "from-amber-500/10 to-amber-500/0 border-amber-500/30 text-amber-700 dark:text-amber-300",
    emerald: "from-emerald-500/10 to-emerald-500/0 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
    blue: "from-blue-500/10 to-blue-500/0 border-blue-500/30 text-blue-700 dark:text-blue-300",
  } as const;
  return (
    <div className={`bg-gradient-to-br ${toneMap[tone]} border-2 rounded-xl p-3`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-mono">
        <Icon name={icon} size={12} />
        {label}
      </div>
      <div className="text-base font-black text-foreground mt-1">{fmt(value)}</div>
    </div>
  );
}
