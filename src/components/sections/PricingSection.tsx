import { useState } from "react";
import Icon from "@/components/ui/icon";
import { COMPARISON_TABLE, formatRubMonth, PLANS, type Plan } from "@/lib/pricing";
import { notify } from "@/lib/notify";
import PaymentDialog from "@/components/pricing/PaymentDialog";

/**
 * Раздел «Тарифы». 3 плана: Free / PRO / BUSINESS.
 * Тоггл «Месяц / Год -20%». Сравнительная таблица. FAQ.
 * PRO — оплата через ЮKassa. BUSINESS — заявка менеджеру.
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
    // PRO — открываем диалог оплаты ЮKassa
    setPayingPlan(p);
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Шапка */}
      <div className="text-center max-w-3xl mx-auto">
        <p className="text-xs font-mono uppercase tracking-widest text-primary mb-2">Тарифы</p>
        <h2 className="text-3xl sm:text-4xl font-black text-foreground">
          Выберите подходящий план
        </h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Free — для разовых задач. PRO — для профессионалов. BUSINESS — для студий и агентств.
          Все тарифы можно отменить в любой момент.
        </p>

        {/* Тоггл периода оплаты */}
        <div className="inline-flex items-center bg-secondary rounded-full p-1 mt-5">
          <button
            onClick={() => setYearly(false)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              !yearly ? "bg-card text-foreground shadow" : "text-muted-foreground"
            }`}
          >
            Помесячно
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              yearly ? "bg-card text-foreground shadow" : "text-muted-foreground"
            }`}
          >
            Год
            <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              −20%
            </span>
          </button>
        </div>
      </div>

      {/* Карточки тарифов */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} yearly={yearly} onSelect={() => handleSelect(plan)} />
        ))}
      </div>

      {/* Сравнительная таблица */}
      <div className="max-w-5xl mx-auto pt-4">
        <div className="text-center mb-4">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Подробное сравнение</p>
          <h3 className="text-2xl font-black text-foreground mt-1">Что входит в каждый тариф</h3>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
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
                  <th className="text-center p-3 sm:p-4 font-bold text-foreground">BUSINESS</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_TABLE.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-border ${i % 2 === 1 ? "bg-secondary/20" : ""}`}
                  >
                    <td className="p-3 sm:p-4 text-foreground sticky left-0 bg-inherit">{row.label}</td>
                    <Cell value={row.free} />
                    <Cell value={row.pro} highlight />
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "Shield",      title: "Без обязательств",    text: "Отмена подписки в любой момент, без объяснений и комиссий" },
            { icon: "RefreshCw",   title: "7 дней на возврат",   text: "Не подошёл PRO/BUSINESS — вернём 100% оплаты в первые 7 дней" },
            { icon: "Lock",        title: "152-ФЗ + защита",     text: "Все данные хранятся на серверах в РФ, шифрование TLS, оплата через защищённый шлюз" },
          ].map((g) => (
            <div key={g.title} className="bg-card border border-border rounded-xl p-4">
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
            { q: "Free действительно бесплатный?", a: "Да. Без регистрации, без скрытых платежей. Лимиты: до 3 проектов, 5 сканирований и 3 AI-анализа фото в месяц." },
            { q: "Могу ли я перейти с PRO на BUSINESS?", a: "Да, в любой момент — мы пересчитаем оплату пропорционально оставшемуся периоду." },
            { q: "Как платить? Можно ли по счёту от ООО МАТ-Лабс?", a: "Принимаем оплату картой и через СБП для физлиц. Юрлицам — счёт-договор от ООО «МАТ-Лабс» (ИНН 6312223437) с НДС." },
            { q: "Что произойдёт с моими проектами, если я отменю подписку?", a: "Доступ сохранится — переключим на Free. Если проектов больше 3, все остальные станут «только для чтения», без удаления данных." },
            { q: "Где смотреть текущий план и историю платежей?", a: "В разделе «Профиль» (после релиза регистрации). Сейчас сервис в бета-режиме — все пользователи на тарифе Free." },
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
    plan.accent === "premium" ? "border-2 border-amber-500/50" :
    "border border-border";
  const accentBg =
    plan.accent === "primary" ? "bg-gradient-to-br from-primary/10 to-primary/5" :
    plan.accent === "premium" ? "bg-gradient-to-br from-amber-500/10 to-amber-500/5" :
    "bg-card";

  return (
    <div className={`relative ${accentBg} ${accentBorder} rounded-2xl p-5 flex flex-col`}>
      {plan.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
          {plan.badge}
        </span>
      )}

      <div>
        <p className="text-2xl font-black text-foreground">{plan.name}</p>
        <p className="text-xs text-muted-foreground mt-1 min-h-[32px]">{plan.audience}</p>
      </div>

      <div className="my-4">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-foreground">{formatRubMonth(price)}</span>
          {price > 0 && (
            <span className="text-sm text-muted-foreground font-mono">/мес</span>
          )}
        </div>
        {yearly && plan.priceMonthly > 0 && (
          <p className="text-[11px] text-emerald-600 font-mono mt-1">
            Экономия {formatRubMonth((plan.priceMonthly - plan.priceYearly) * 12)} в год
          </p>
        )}
        {!yearly && plan.priceMonthly === 0 && (
          <p className="text-[11px] text-muted-foreground font-mono mt-1">
            Без скрытых платежей
          </p>
        )}
      </div>

      <p className="text-sm text-foreground/80 leading-relaxed mb-4">{plan.tagline}</p>

      <button
        onClick={onSelect}
        className={`w-full font-bold text-sm py-2.5 rounded-lg mb-4 transition-opacity ${
          plan.accent === "primary"
            ? "bg-primary text-primary-foreground hover:opacity-90"
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