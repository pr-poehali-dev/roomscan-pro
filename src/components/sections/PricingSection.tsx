import { useState } from "react";
import Icon from "@/components/ui/icon";
import {
  COMPARISON_TABLE,
  COMPETITORS_COMPARISON,
  formatRubMonth,
  PLANS,
  type Plan,
} from "@/lib/pricing";
import { notify } from "@/lib/notify";
import PaymentDialog from "@/components/pricing/PaymentDialog";

/**
 * Раздел «Тарифы». 4 плана: Free / PRO / STUDIO / BUSINESS.
 * Тоггл «Месяц / Год -20%». Сравнение с конкурентами. Сравнительная таблица. FAQ.
 * PRO/STUDIO — оплата через ЮKassa. BUSINESS — заявка менеджеру.
 */
export default function PricingSection() {
  const [yearly, setYearly] = useState(false);
  const [payingPlan, setPayingPlan] = useState<Plan | null>(null);

  const handleSelect = (p: Plan) => {
    if (p.id === "free") {
      notify.info("Free уже активен", "Все возможности тарифа Free доступны без регистрации");
      return;
    }
    if (p.id === "business") {
      notify.success("Заявка отправлена", "Мы свяжемся с вами в течение рабочего дня");
      return;
    }
    // PRO / STUDIO — открываем диалог оплаты ЮKassa
    setPayingPlan(p);
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Шапка */}
      <div className="text-center max-w-3xl mx-auto">
        <p className="t-meta text-primary mb-3">Тарифы</p>
        <h2 className="h-section text-foreground">Выберите подходящий план</h2>
        <p className="t-lead mt-3 max-w-2xl mx-auto">
          Free — для разовых задач. PRO — для профессионалов. BUSINESS — для студий и агентств.
          Все тарифы можно отменить в любой момент.
        </p>

        {/* Тоггл периода оплаты */}
        <div className="inline-flex items-center bg-secondary rounded-full p-1 mt-6">
          <button
            onClick={() => setYearly(false)}
            aria-pressed={!yearly}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              !yearly ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Помесячно
          </button>
          <button
            onClick={() => setYearly(true)}
            aria-pressed={yearly}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              yearly ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Год
            <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full t-num">
              −20%
            </span>
          </button>
        </div>
      </div>

      {/* Карточки тарифов — 4 плана */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} yearly={yearly} onSelect={() => handleSelect(plan)} />
        ))}
      </div>

      {/* Сравнение с конкурентами */}
      <div className="max-w-5xl mx-auto pt-4">
        <div className="text-center mb-6">
          <p className="t-meta text-primary mb-2">Почему мы</p>
          <h3 className="h-block text-foreground">Сравнение с конкурентами</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">
            Мы — единственный сервис в РФ, где совмещены AI-детекция мебели,
            real-time 3D, AR-примерка и смета по регионам.
          </p>
        </div>

        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary/10 border-b border-border">
                  <th className="text-left p-3 sm:p-4 font-bold text-foreground sticky left-0 bg-primary/10">
                    Возможность
                  </th>
                  <th className="text-center p-3 sm:p-4 font-bold text-primary">
                    RoomScan AI
                    <span className="block text-[9px] font-mono opacity-70 normal-case">Мы</span>
                  </th>
                  <th className="text-center p-3 sm:p-4 font-bold text-muted-foreground">Planoplan</th>
                  <th className="text-center p-3 sm:p-4 font-bold text-muted-foreground">HomeStyler</th>
                  <th className="text-center p-3 sm:p-4 font-bold text-muted-foreground">Houzz Pro</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITORS_COMPARISON.map((row, i) => (
                  <tr key={row.feature} className={`border-b border-border ${i % 2 === 1 ? "bg-secondary/20" : ""}`}>
                    <td className="p-3 sm:p-4 text-foreground sticky left-0 bg-inherit font-semibold">
                      {row.feature}
                    </td>
                    <Cell value={row.us} highlight />
                    <Cell value={row.planoplan} />
                    <Cell value={row.homestyler} />
                    <Cell value={row.houzz} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Сравнительная таблица тарифов */}
      <div className="max-w-6xl mx-auto pt-4">
        <div className="text-center mb-6">
          <p className="t-meta mb-2">Подробное сравнение</p>
          <h3 className="h-block text-foreground">Что входит в каждый тариф</h3>
        </div>

        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="text-left p-3 sm:p-4 font-bold text-foreground sticky left-0 bg-secondary/50">
                    Функция
                  </th>
                  <th className="text-center p-3 sm:p-4 font-bold text-muted-foreground">Free</th>
                  <th className="text-center p-3 sm:p-4 font-bold text-primary">
                    PRO
                    <span className="block text-[9px] font-mono opacity-70">Популярно</span>
                  </th>
                  <th className="text-center p-3 sm:p-4 font-bold text-blue-600">
                    STUDIO
                    <span className="block text-[9px] font-mono opacity-70">Новинка</span>
                  </th>
                  <th className="text-center p-3 sm:p-4 font-bold text-foreground">BUSINESS</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_TABLE.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-border ${i % 2 === 1 ? "bg-secondary/20" : ""}`}
                  >
                    <td className="p-3 sm:p-4 text-foreground sticky left-0 bg-inherit">
                      <span className="flex items-center gap-1.5">
                        {row.label}
                        {row.unique && (
                          <span
                            className="text-[9px] font-bold uppercase tracking-wider bg-primary/15 text-primary px-1.5 py-0.5 rounded"
                            title="Уникальная функция — есть только у нас"
                          >
                            Только у нас
                          </span>
                        )}
                      </span>
                    </td>
                    <Cell value={row.free} />
                    <Cell value={row.pro} highlight />
                    <Cell value={row.studio} />
                    <Cell value={row.business} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Гарантии и FAQ */}
      <div className="max-w-4xl mx-auto pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: "Gift",        title: "7-14 дней триала",    text: "Тестируйте PRO бесплатно 7 дней, STUDIO — 14 дней. Без карты вперёд." },
            { icon: "Shield",      title: "Без обязательств",    text: "Отмена подписки в любой момент, без объяснений и комиссий" },
            { icon: "RefreshCw",   title: "Возврат 7 дней",      text: "Не подошёл — вернём 100% оплаты в первые 7 дней после старта" },
            { icon: "Lock",        title: "152-ФЗ + защита",     text: "Серверы в РФ, шифрование TLS, защищённый шлюз ЮKassa" },
          ].map((g) => (
            <div key={g.title} className="card-base p-4">
              <Icon name={g.icon} size={18} className="text-primary mb-2" />
              <p className="font-bold text-foreground text-sm">{g.title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{g.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Частые вопросы
          </p>
          {[
            { q: "Free действительно бесплатный?", a: "Да. Без регистрации, без скрытых платежей. Лимиты: до 3 проектов, 5 сканирований и 3 AI-генерации в месяц." },
            { q: "Чем STUDIO отличается от PRO?", a: "STUDIO — для команд из 2-5 человек: white-label PDF и Excel с вашим логотипом, безлимит AI, спецификация с маржой студии. PRO — для одного дизайнера. Если работаете в студии или хотите шарить проекты под брендом — берите STUDIO." },
            { q: "Как работает 7/14-дневный триал?", a: "Регистрируетесь, получаете полный доступ к PRO (7 дней) или STUDIO (14 дней). Без блокировки карты вперёд. По окончании — автоматический переход на Free, ничего не списывается, если не оформили подписку." },
            { q: "Могу ли я перейти с PRO на STUDIO/BUSINESS?", a: "Да, в любой момент — мы пересчитаем оплату пропорционально оставшемуся периоду." },
            { q: "Как платить? Можно ли по счёту от ООО МАТ-Лабс?", a: "Принимаем оплату картой и через СБП для физлиц. Юрлицам — счёт-договор от ООО «МАТ-Лабс» (ИНН 6312223437) с НДС." },
            { q: "Что произойдёт с проектами при отмене подписки?", a: "Доступ сохранится — переключим на Free. Если проектов больше 3, остальные станут «только для чтения», без удаления данных." },
            { q: "Чем мы отличаемся от Planoplan, Houzz, HomeStyler?", a: "Мы — единственный сервис в РФ с AI-детекцией мебели по фото, реальной FLUX-стилизацией, AR-примеркой и сметой по 20 регионам. Polnoplan — только 3D-визуализация без AI. Houzz — только США, $85+/мес. HomeStyler — английский, без сметы РФ." },
          ].map((f, i) => (
            <details key={i} className="bg-card border border-border rounded-xl group">
              <summary className="cursor-pointer p-3 flex items-center gap-2 list-none">
                <Icon name="ChevronRight" size={14} className="text-muted-foreground transition-transform group-open:rotate-90" />
                <span className="font-bold text-foreground text-sm">{f.q}</span>
              </summary>
              <p className="px-3 pb-3 text-xs text-muted-foreground leading-relaxed pl-9">{f.a}</p>
            </details>
          ))}
        </div>

        {/* Реквизиты */}
        <div className="mt-6 text-center text-[11px] text-muted-foreground font-mono">
          Оплата зачисляется в адрес ООО «МАТ-Лабс» · ИНН 6312223437 · ОГРН 126630004288
        </div>
      </div>

      {/* Модалка оплаты ЮKassa */}
      {payingPlan && (
        <PaymentDialog
          plan={payingPlan}
          yearly={yearly}
          onClose={() => setPayingPlan(null)}
        />
      )}
    </div>
  );
}

/* ───────── Подкомпоненты ───────── */

function PlanCard({ plan, yearly, onSelect }: { plan: Plan; yearly: boolean; onSelect: () => void }) {
  const price = yearly ? plan.priceYearly : plan.priceMonthly;
  const accentBorder =
    plan.accent === "primary" ? "border-2 border-primary" :
    plan.accent === "studio"  ? "border-2 border-blue-500/60" :
    plan.accent === "premium" ? "border-2 border-amber-500/50" :
    "border border-border";
  const accentBg =
    plan.accent === "primary" ? "bg-gradient-to-br from-primary/10 to-primary/5" :
    plan.accent === "studio"  ? "bg-gradient-to-br from-blue-500/10 to-blue-500/5" :
    plan.accent === "premium" ? "bg-gradient-to-br from-amber-500/10 to-amber-500/5" :
    "bg-card";
  const badgeBg =
    plan.accent === "primary" ? "bg-primary text-primary-foreground" :
    plan.accent === "studio"  ? "bg-blue-500 text-white" :
    plan.accent === "premium" ? "bg-amber-500 text-amber-950" :
    "bg-secondary text-foreground";

  return (
    <div className={`relative ${accentBg} ${accentBorder} rounded-2xl p-5 flex flex-col`}>
      {plan.badge && (
        <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap ${badgeBg}`}>
          {plan.badge}
        </span>
      )}

      <div>
        <p className="text-2xl font-black text-foreground">{plan.name}</p>
        <p className="text-xs text-muted-foreground mt-1 min-h-[32px]">{plan.audience}</p>
      </div>

      <div className="my-4">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-foreground t-num leading-none">{formatRubMonth(price)}</span>
          {price > 0 && (
            <span className="text-sm text-muted-foreground t-num">/мес</span>
          )}
        </div>
        {yearly && plan.priceMonthly > 0 && (
          <p className="text-[11px] text-emerald-600 t-num mt-1.5">
            Экономия {formatRubMonth((plan.priceMonthly - plan.priceYearly) * 12)} в год
          </p>
        )}
        {!yearly && plan.priceMonthly === 0 && (
          <p className="text-[11px] text-muted-foreground font-mono mt-1.5">
            Без скрытых платежей
          </p>
        )}
        {plan.trialDays && plan.priceMonthly > 0 && (
          <p className="text-[11px] mt-1.5 inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded">
            <Icon name="Gift" size={10} />
            {plan.trialDays} дней бесплатно
          </p>
        )}
      </div>

      {/* ROI-подсказка */}
      {plan.roiHint && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-2">
          <Icon name="TrendingUp" size={12} className="text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-snug">
            <span className="font-bold">ROI: </span>{plan.roiHint}
          </p>
        </div>
      )}

      <p className="text-sm text-foreground/80 leading-relaxed mb-4">{plan.tagline}</p>

      <button
        onClick={onSelect}
        className={`w-full font-bold text-sm py-2.5 rounded-lg mb-4 transition-opacity ${
          plan.accent === "primary"
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : plan.accent === "studio"
              ? "bg-blue-500 text-white hover:opacity-90"
              : plan.accent === "premium"
                ? "bg-foreground text-background hover:opacity-90"
                : "bg-secondary text-foreground hover:bg-secondary/70"
        }`}
      >
        {plan.cta}
      </button>

      <ul className="space-y-2 text-sm flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            <Icon
              name={f.off ? "X" : f.highlight ? "Sparkles" : "Check"}
              size={13}
              className={`shrink-0 mt-0.5 ${
                f.off ? "text-muted-foreground/50" :
                f.highlight ? "text-primary" : "text-emerald-500"
              }`}
            />
            <span className={`leading-snug ${
              f.off ? "text-muted-foreground/50 line-through" :
              f.highlight ? "text-foreground font-bold" :
              "text-foreground/90"
            }`}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Cell({ value, highlight }: { value: string | boolean; highlight?: boolean }) {
  if (value === true) {
    return (
      <td className={`text-center p-3 sm:p-4 ${highlight ? "bg-primary/5" : ""}`}>
        <Icon name="Check" size={16} className="text-emerald-500 mx-auto" />
      </td>
    );
  }
  if (value === false) {
    return (
      <td className={`text-center p-3 sm:p-4 ${highlight ? "bg-primary/5" : ""}`}>
        <Icon name="Minus" size={14} className="text-muted-foreground/40 mx-auto" />
      </td>
    );
  }
  return (
    <td className={`text-center p-3 sm:p-4 font-mono text-xs ${highlight ? "bg-primary/5 text-primary font-bold" : "text-foreground"}`}>
      {value}
    </td>
  );
}