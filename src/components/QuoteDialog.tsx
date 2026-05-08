import { useState } from "react";
import Icon from "@/components/ui/icon";
import { sendQuote, QuotePayload } from "@/lib/engineering-api";
import { notify } from "@/lib/notify";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Что заказываем */
  kind: "engineering" | "modular_house";
  /** Название проекта (для письма менеджеру) */
  projectTitle: string;
  /** Сумма проекта */
  totalPrice: number;
  /** Топ-позиции для письма менеджеру */
  items?: { name: string; quantity: number; price?: number }[];
}

export default function QuoteDialog({
  open,
  onClose,
  kind,
  projectTitle,
  totalPrice,
  items = [],
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return notify.error("Укажи имя");
    if (!phone.trim() && !email.trim()) return notify.error("Укажи телефон или email");

    setBusy(true);
    try {
      const payload: QuotePayload = {
        kind,
        project_title: projectTitle,
        client_name: name.trim(),
        client_phone: phone.trim() || undefined,
        client_email: email.trim() || undefined,
        comment: comment.trim() || undefined,
        total_price: totalPrice,
        snapshot: { items },
      };
      const res = await sendQuote(payload);
      if (res.telegram_sent) {
        notify.success("Заявка отправлена!", "Менеджер получил уведомление, свяжется в течение часа");
      } else {
        notify.success("Заявка принята", "Сохранили в системе, свяжемся в ближайшее время");
      }
      setName(""); setPhone(""); setEmail(""); setComment("");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ошибка отправки";
      notify.error("Не удалось отправить", msg);
    } finally {
      setBusy(false);
    }
  };

  const kindLabel = kind === "engineering" ? "Котельная" : "Модульный дом";

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl"
      >
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <p className="font-bold flex items-center gap-2">
            <Icon name="MessageSquareText" size={16} className="text-primary" />
            Заявка на расчёт
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Закрыть"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-3">
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
            <p className="text-[10px] uppercase font-mono text-primary">{kindLabel}</p>
            <p className="text-sm font-bold truncate">{projectTitle}</p>
            {totalPrice > 0 && (
              <p className="text-base font-black text-primary mt-1">
                {new Intl.NumberFormat("ru-RU").format(totalPrice)} ₽
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-foreground mb-1 block">Имя *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Иван"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground mb-1 block">Телефон</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 999 123-45-67"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ivan@example.com"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground mb-1 block">Комментарий</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Когда удобно перезвонить, особые пожелания…"
              rows={3}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Нажимая «Отправить», вы соглашаетесь на обработку персональных данных.
            Мы свяжемся в течение 1 часа в рабочее время.
          </p>
        </div>

        <div className="px-5 py-3 border-t border-border flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-secondary text-foreground"
            disabled={busy}
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy ? (
              <>
                <Icon name="Loader2" size={14} className="animate-spin" />
                Отправляем…
              </>
            ) : (
              <>
                <Icon name="Send" size={14} />
                Отправить
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
