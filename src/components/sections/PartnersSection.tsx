import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { PARTNERS_URL } from "@/lib/api";

type PartnershipType = "catalog" | "api" | "branded" | "enterprise";

interface Tier {
  id: PartnershipType;
  name: string;
  icon: string;
  price: string;
  tagline: string;
  features: string[];
  cta: string;
  badge?: string;
}

const TIERS: Tier[] = [
  {
    id: "catalog",
    name: "Каталог",
    icon: "Package",
    price: "Бесплатно",
    tagline: "Базовое размещение SKU",
    features: [
      "До 50 товаров в каталоге",
      "Карточки с размерами и фото",
      "Кнопка «Купить» на сайт партнёра",
      "Базовая аналитика просмотров",
      "Поддержка через email",
    ],
    cta: "Подать заявку",
  },
  {
    id: "api",
    name: "API-интеграция",
    icon: "Plug",
    price: "от 25 000 ₽/мес",
    tagline: "Автосинхронизация каталога",
    features: [
      "Неограниченное число SKU",
      "REST API для синхронизации цен и остатков",
      "Webhooks о заказах",
      "Размещение в AR-просмотре",
      "Расширенная аналитика",
      "Менеджер аккаунта",
    ],
    cta: "Запросить доступ",
    badge: "Популярно",
  },
  {
    id: "branded",
    name: "Брендированный раздел",
    icon: "Award",
    price: "от 80 000 ₽/мес",
    tagline: "Витрина бренда внутри платформы",
    features: [
      "Отдельная страница бренда",
      "Логотип в каталоге и фильтрах",
      "AI-стиль с вашей мебелью по умолчанию",
      "Промо в email-рассылках",
      "Реклама в подборках",
      "Приоритетная техподдержка 24/7",
    ],
    cta: "Обсудить условия",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: "Building2",
    price: "По договору",
    tagline: "Whitelabel + API + кастом",
    features: [
      "Вся платформа под вашим брендом",
      "Размещение на ваших серверах",
      "Кастомные доработки CV-pipeline",
      "SLA 99.9%",
      "Юридическое сопровождение",
      "Индивидуальное обучение менеджеров",
    ],
    cta: "Связаться с отделом продаж",
  },
];

const BENEFITS = [
  { icon: "TrendingUp", title: "Снижение возвратов",         desc: "Покупатели сверяют габариты с реальной комнатой до заказа" },
  { icon: "Eye",        title: "Тёплый трафик",              desc: "Пользователь приходит к вам с конкретным интерьером и нуждой" },
  { icon: "Users",      title: "Аудитория ремонта и стройки", desc: "Владельцы квартир в активной фазе обустройства" },
  { icon: "Bot",        title: "AI-рекомендации",            desc: "Ваши товары попадают в подборки по стилю и размерам" },
];

export default function PartnersSection() {
  const [selectedTier, setSelectedTier] = useState<PartnershipType>("api");
  const [stats, setStats] = useState<{ active_partners: number; total: number } | null>(null);

  // Форма
  const [companyName, setCompanyName]   = useState("");
  const [contactName, setContactName]   = useState("");
  const [email, setEmail]               = useState("");
  const [phone, setPhone]               = useState("");
  const [website, setWebsite]           = useState("");
  const [catalogSize, setCatalogSize]   = useState<number | "">("");
  const [description, setDescription]   = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [error, setError]               = useState("");

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);

    fetch(PARTNERS_URL, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (!cancelled) setStats(d);
      })
      .catch(() => {
        if (!cancelled) setStats({ partners_count: 50, total_volume: 0 });
      })
      .finally(() => clearTimeout(timer));

    return () => {
      cancelled = true;
      ctrl.abort();
      clearTimeout(timer);
    };
  }, []);

  const submit = async () => {
    setError("");
    if (!companyName || !contactName || !email) {
      setError("Заполните обязательные поля");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch(PARTNERS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          contact_name: contactName,
          email,
          phone: phone || undefined,
          website: website || undefined,
          partnership_type: selectedTier,
          catalog_size: catalogSize === "" ? undefined : Number(catalogSize),
          description: description || undefined,
        }),
      });
      const data = await r.json();
      if (r.ok && data.ok) {
        setSubmitted(true);
        // сбрасываем поля
        setCompanyName(""); setContactName(""); setEmail("");
        setPhone(""); setWebsite(""); setCatalogSize(""); setDescription("");
      } else {
        setError(data.error || "Не удалось отправить заявку");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Сетевая ошибка");
    } finally {
      setSubmitting(false);
    }
  };

  const tier = TIERS.find((t) => t.id === selectedTier) ?? TIERS[1];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
        <p className="text-primary text-xs font-mono uppercase tracking-widest mb-2">
          Для производителей мебели и ретейла
        </p>
        <h2 className="text-3xl md:text-4xl font-black mb-3">
          Подключите свой каталог<br />
          к платформе RoomScan AI
        </h2>
        <p className="text-muted-foreground max-w-2xl mb-4">
          Ваша мебель появится в AR-просмотре, AI-подборках стилей и автокомпоновке у тысяч пользователей,
          планирующих ремонт и обустройство квартир.
        </p>
        {stats && (
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="bg-card border border-border rounded-lg px-4 py-2">
              <span className="text-primary font-black font-mono text-lg">{stats.active_partners}</span>
              <span className="text-muted-foreground ml-2">активных партнёров</span>
            </div>
            <div className="bg-card border border-border rounded-lg px-4 py-2">
              <span className="text-primary font-black font-mono text-lg">{stats.total}</span>
              <span className="text-muted-foreground ml-2">заявок всего</span>
            </div>
          </div>
        )}
      </div>

      {/* Преимущества */}
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Что получит ваш бизнес
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="bg-card border border-border rounded-lg p-4">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                <Icon name={b.icon} size={18} className="text-primary" />
              </div>
              <p className="font-bold text-foreground text-sm mb-1">{b.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Тарифы */}
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Выберите формат партнёрства
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {TIERS.map((t) => {
            const isActive = t.id === selectedTier;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTier(t.id)}
                className={`text-left bg-card border rounded-xl p-5 transition-all relative ${
                  isActive ? "border-primary/50 shadow-lg shadow-primary/5" : "border-border hover:border-primary/30"
                }`}
              >
                {t.badge && (
                  <span className="absolute -top-2 right-3 bg-primary text-primary-foreground text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md">
                    {t.badge}
                  </span>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                    isActive ? "bg-primary/15" : "bg-secondary"
                  }`}>
                    <Icon name={t.icon} size={22} className="text-primary" />
                  </div>
                  {isActive && <Icon name="CheckCircle2" size={18} className="text-primary" />}
                </div>
                <p className="font-bold text-foreground text-lg mb-1">{t.name}</p>
                <p className="text-xs text-muted-foreground mb-3">{t.tagline}</p>
                <p className="text-primary font-black font-mono mb-4">{t.price}</p>
                <ul className="space-y-1.5">
                  {t.features.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Icon name="Check" size={11} className="text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {t.features.length > 3 && (
                    <li className="text-[10px] font-mono text-muted-foreground/70 pl-4">
                      и ещё {t.features.length - 3}…
                    </li>
                  )}
                </ul>
              </button>
            );
          })}
        </div>
      </div>

      {/* Полная сравнительная карточка выбранного */}
      <div className="bg-card border border-primary/20 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Тариф
            </p>
            <h3 className="text-2xl font-bold flex items-center gap-2 mt-1">
              <Icon name={tier.icon} size={20} className="text-primary" />
              {tier.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{tier.tagline}</p>
          </div>
          <div className="text-right">
            <p className="text-primary font-black font-mono text-2xl">{tier.price}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          {tier.features.map((f) => (
            <div key={f} className="flex items-start gap-2 text-sm bg-secondary/40 rounded-md px-3 py-2">
              <Icon name="Check" size={13} className="text-primary mt-0.5 shrink-0" />
              <span className="text-foreground">{f}</span>
            </div>
          ))}
        </div>

        {/* Форма */}
        {submitted ? (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-5 text-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
              <Icon name="Check" size={22} className="text-primary-foreground" />
            </div>
            <p className="font-bold text-foreground mb-1">Заявка принята!</p>
            <p className="text-sm text-muted-foreground">
              Мы свяжемся с вами в течение 1 рабочего дня по указанному email.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 text-sm text-primary font-semibold hover:underline"
            >
              Отправить ещё одну заявку
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Контакты для связи
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Компания *"   value={companyName} onChange={setCompanyName} placeholder="ООО Мебельщик" />
              <Field label="Контактное лицо *" value={contactName} onChange={setContactName} placeholder="Иван Иванов" />
              <Field label="Email *"      value={email} onChange={setEmail} placeholder="ivan@company.ru" type="email" />
              <Field label="Телефон"      value={phone} onChange={setPhone} placeholder="+7 (___) ___-__-__" />
              <Field label="Сайт"         value={website} onChange={setWebsite} placeholder="https://..." />
              <Field
                label="Размер каталога (SKU)"
                value={catalogSize === "" ? "" : String(catalogSize)}
                onChange={(v) => setCatalogSize(v === "" ? "" : Math.max(0, parseInt(v) || 0))}
                placeholder="например, 250"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Комментарий</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Расскажите коротко о вашей продукции и интеграционных потребностях"
                className="w-full bg-secondary/40 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/40 resize-none"
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md px-3 py-2 flex items-center gap-2">
                <Icon name="AlertCircle" size={14} />
                {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Icon name="Loader2" size={16} className="animate-spin" />
                  Отправка…
                </>
              ) : (
                <>
                  <Icon name="Send" size={16} />
                  {tier.cta}
                </>
              )}
            </button>

            <p className="text-[10px] text-muted-foreground text-center">
              Нажимая кнопку, вы соглашаетесь с обработкой персональных данных в соответствии
              с{" "}
              <a href="/legal/privacy" target="_blank" rel="noopener" className="text-primary hover:underline">
                Политикой конфиденциальности
              </a>{" "}
              и{" "}
              <a href="/legal/terms" target="_blank" rel="noopener" className="text-primary hover:underline">
                Пользовательским соглашением
              </a>{" "}
              (152-ФЗ).
            </p>
          </div>
        )}
      </div>

      {/* FAQ */}
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Частые вопросы
        </p>
        <div className="space-y-2">
          {[
            { q: "Какие данные нужны от моей компании?",
              a: "Минимально: название, контакт, email. Для интеграции — каталог в формате CSV/JSON или доступ к вашему API. Мы поможем с маппингом полей." },
            { q: "Сколько времени занимает подключение?",
              a: "Тариф «Каталог» — 2-3 дня. «API-интеграция» — 5-10 рабочих дней с тестированием. «Брендированный раздел» — 2-3 недели с дизайнерской подготовкой." },
            { q: "Как пользователь покупает мою мебель?",
              a: "В карточке товара кнопка «Купить» ведёт на ваш сайт с UTM-метками. Опционально — встроенный чек-аут с передачей заказа в вашу CRM через API." },
            { q: "Можно ли разместить только часть каталога?",
              a: "Да. Вы сами выбираете, какие SKU показывать. Минимум — 5 товаров для запуска. Можно фильтровать по категориям, ценам, наличию." },
          ].map((f, i) => (
            <details key={i} className="bg-card border border-border rounded-lg group">
              <summary className="cursor-pointer px-4 py-3 flex items-center gap-2 text-sm font-semibold">
                <Icon name="HelpCircle" size={14} className="text-primary" />
                {f.q}
                <Icon name="ChevronDown" size={14} className="ml-auto text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed pl-10">
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

// Маленький инпут с лейблом
function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-secondary/40 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
      />
    </div>
  );
}