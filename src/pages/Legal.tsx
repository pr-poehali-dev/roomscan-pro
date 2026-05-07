import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import {
  COOKIE_POLICY,
  LEGAL_COMPANY,
  LEGAL_UPDATED,
  PD_CONSENT,
  PRIVACY_POLICY,
  TERMS_OF_USE,
} from "@/lib/legalContent";

type DocId = "privacy" | "terms" | "cookies" | "consent";

const DOCS: { id: DocId; title: string; icon: string; content: string; meta: string }[] = [
  { id: "privacy", title: "Политика конфиденциальности", icon: "Shield",      content: PRIVACY_POLICY, meta: "Обработка персональных данных по 152-ФЗ" },
  { id: "terms",   title: "Пользовательское соглашение", icon: "FileText",    content: TERMS_OF_USE,   meta: "Публичная оферта об использовании сервиса" },
  { id: "cookies", title: "Политика cookie",             icon: "Cookie",      content: COOKIE_POLICY,  meta: "Использование cookie-файлов" },
  { id: "consent", title: "Согласие на обработку ПД",    icon: "CheckCircle2",content: PD_CONSENT,     meta: "Текст согласия по 152-ФЗ" },
];

/**
 * Юридические страницы сайта: Политика конфиденциальности, Пользовательское соглашение,
 * Политика cookie, Согласие на обработку ПД. Соответствуют требованиям 152-ФЗ, 149-ФЗ, 38-ФЗ.
 */
export default function Legal() {
  const { doc } = useParams<{ doc?: string }>();
  const navigate = useNavigate();
  const initial = (DOCS.find((d) => d.id === doc)?.id || "privacy") as DocId;
  const [active, setActive] = useState<DocId>(initial);

  useEffect(() => {
    if (doc && DOCS.some((d) => d.id === doc)) setActive(doc as DocId);
  }, [doc]);

  useEffect(() => {
    document.title = `${current.title} · RoomScan AI`;
  });

  const current = DOCS.find((d) => d.id === active)!;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Icon name="ArrowLeft" size={16} />
            На главную
          </button>
          <div className="ml-auto text-[11px] font-mono text-muted-foreground">
            Актуально на {LEGAL_UPDATED}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-10">
        <div className="mb-6">
          <p className="text-[11px] font-mono uppercase tracking-widest text-primary mb-2">
            Юридические документы
          </p>
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Правовая информация</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Все документы соответствуют требованиям законодательства Российской Федерации:
            152-ФЗ «О персональных данных», 149-ФЗ «Об информации», 38-ФЗ «О рекламе»,
            ст. 437 ГК РФ.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 lg:gap-6">
          {/* Левая навигация */}
          <nav className="space-y-1.5 lg:sticky lg:top-24 self-start">
            {DOCS.map((d) => (
              <Link
                key={d.id}
                to={`/legal/${d.id}`}
                onClick={() => setActive(d.id)}
                className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg transition-colors ${
                  active === d.id
                    ? "bg-primary/10 border border-primary/30 text-foreground"
                    : "border border-transparent hover:bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon name={d.icon} size={16} className={active === d.id ? "text-primary mt-0.5" : "mt-0.5"} />
                <div className="min-w-0">
                  <p className="font-bold text-sm leading-tight">{d.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{d.meta}</p>
                </div>
              </Link>
            ))}
          </nav>

          {/* Контент документа */}
          <article className="bg-card border border-border rounded-xl p-5 sm:p-7">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
              <Icon name={current.icon} size={20} className="text-primary" />
              <h2 className="text-xl sm:text-2xl font-black">{current.title}</h2>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
              {current.content.trim()}
            </pre>
          </article>
        </div>

        <div className="mt-8 p-4 rounded-xl border border-border bg-card/50 text-xs text-muted-foreground">
          <p className="font-bold text-foreground mb-1">Реквизиты Оператора:</p>
          <p>
            {LEGAL_COMPANY.name}, ИНН {LEGAL_COMPANY.inn}, ОГРН {LEGAL_COMPANY.ogrn}.
            Сайт: <a href={`https://${LEGAL_COMPANY.domain}`} className="text-primary hover:underline">{LEGAL_COMPANY.domain}</a>
          </p>
        </div>
      </main>
    </div>
  );
}
