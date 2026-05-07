import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useYookassa, openPaymentPage } from "@/components/extensions/yookassa/useYookassa";
import { notify } from "@/lib/notify";
import { formatRubMonth, type Plan } from "@/lib/pricing";

const YOOKASSA_API_URL = "https://functions.poehali.dev/d6579c94-d9f5-44bd-b628-dc62b09aec70";

interface Props {
  plan: Plan;
  yearly: boolean;
  onClose: () => void;
}

/**
 * Диалог оплаты тарифа через ЮKassa.
 * Запрашивает email и имя, создаёт платёж и редиректит на страницу оплаты.
 */
export default function PaymentDialog({ plan, yearly, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);

  const monthlyPrice = yearly ? plan.priceYearly : plan.priceMonthly;
  const totalPrice = yearly ? plan.priceYearly * 12 : plan.priceMonthly;
  const period = yearly ? "год" : "месяц";

  const { createPayment, isLoading } = useYookassa({
    apiUrl: YOOKASSA_API_URL,
    onSuccess: (response) => {
      notify.success("Заказ создан", `№ ${response.order_number}. Перенаправляем на страницу оплаты…`);
    },
    onError: (err) => {
      notify.error("Не удалось создать платёж", err.message);
    },
  });

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !agreed) return;
    const returnUrl = `${window.location.origin}${window.location.pathname}#pricing`;
    const description = yearly
      ? `Тариф ${plan.name} (год) · RoomScan AI`
      : `Тариф ${plan.name} · RoomScan AI`;

    const response = await createPayment({
      amount: totalPrice,
      userEmail: email.trim(),
      userName: name.trim() || undefined,
      description,
      returnUrl,
      cartItems: [{
        id: `plan_${plan.id}_${period}`,
        name: description,
        price: totalPrice,
        quantity: 1,
      }],
    });

    if (response?.payment_url) {
      openPaymentPage(response.payment_url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          aria-label="Закрыть"
        >
          <Icon name="X" size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center">
            <Icon name="CreditCard" size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-primary">Оплата тарифа</p>
            <h2 className="text-xl font-black text-foreground">{plan.name}</h2>
          </div>
        </div>

        {/* Краткая сводка */}
        <div className="bg-secondary/40 rounded-xl p-3 mb-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Период</span>
            <span className="font-bold text-foreground">{yearly ? "1 год (−20%)" : "1 месяц"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Цена за месяц</span>
            <span className="font-bold text-foreground">{formatRubMonth(monthlyPrice)}</span>
          </div>
          <div className="flex justify-between text-base pt-2 border-t border-border">
            <span className="font-bold text-foreground">К оплате</span>
            <span className="font-black text-primary text-lg">{formatRubMonth(totalPrice)}</span>
          </div>
        </div>

        <form onSubmit={handlePay} className="space-y-3">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
              Email для чека *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.ru"
              autoComplete="email"
              required
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              На этот адрес придёт электронный чек ЮKassa и доступ к тарифу
            </p>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
              Имя (необязательно)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Александр Петров"
              autoComplete="name"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <label className="flex items-start gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border accent-primary shrink-0"
            />
            <span className="text-[11px] text-muted-foreground leading-relaxed">
              Согласен с{" "}
              <a href="/legal/terms" target="_blank" rel="noopener" className="text-primary hover:underline">
                офертой
              </a>{" "}
              и{" "}
              <a href="/legal/privacy" target="_blank" rel="noopener" className="text-primary hover:underline">
                Политикой конфиденциальности
              </a>. Оплата производится в адрес ООО «МАТ-Лабс» (ИНН 6312223437).
            </span>
          </label>

          <button
            type="submit"
            disabled={!email.trim() || !agreed || isLoading}
            className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <Icon name="Loader2" size={15} className="animate-spin" />
                Создаём платёж…
              </>
            ) : (
              <>
                <Icon name="ArrowRight" size={15} />
                Перейти к оплате · {formatRubMonth(totalPrice)}
              </>
            )}
          </button>

          <p className="text-[10px] text-muted-foreground text-center font-mono mt-1">
            <Icon name="Lock" size={10} className="inline mr-1" />
            Защищённая оплата через ЮKassa · Visa / Mastercard / МИР / СБП
          </p>
        </form>
      </div>
    </div>
  );
}
