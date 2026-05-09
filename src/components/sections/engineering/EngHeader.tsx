import Icon from "@/components/ui/icon";
import { NODE_TEMPLATES } from "@/lib/engineering";

interface Props {
  tplIndex: number;
  onSelectTpl: (i: number) => void;
}

/**
 * Шапка раздела «Инженерные узлы»: заголовок-партнёр SUPER ГАЗ +
 * брендовый баннер + сетка готовых решений (4 шаблона котельных).
 * Логика 1:1 перенесена из EngineeringSection.tsx без изменений.
 */
export default function EngHeader({ tplIndex, onSelectTpl }: Props) {
  return (
    <>
      <div className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-1">
          Модуль · Инженерные системы · партнёр <span className="text-orange-500 font-bold">SUPER ГАЗ</span>
        </p>
        <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2 flex items-center gap-3 flex-wrap">
          <span className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center">
            <Icon name="Flame" size={22} className="text-primary" />
          </span>
          Газовые котельные и автономная газификация
        </h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Готовые решения от сети специализированных магазинов <strong>SUPER ГАЗ</strong>: газгольдеры,
          баллонные установки, котлы, автоматика. Сертифицированное оборудование, проектирование,
          монтаж под ключ с гарантией.
        </p>
      </div>

      <SuperGasBanner />

      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
        Готовые решения · выбери тип котельной
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {NODE_TEMPLATES.map((tpl, i) => (
          <button
            key={tpl.id}
            onClick={() => onSelectTpl(i)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              i === tplIndex
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-muted-foreground"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  i === tplIndex ? "bg-primary text-primary-foreground" : "bg-secondary"
                }`}
              >
                <Icon name={tpl.icon} size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  {tpl.power}
                </p>
                <p className="font-bold text-foreground">{tpl.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{tpl.purpose}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

/**
 * Брендовый баннер партнёра «SUPER ГАЗ»: контакты, ключевые услуги, преимущества.
 * Данные с supergas.ru — официальный сайт, сеть специализированных магазинов.
 * Логика 1:1 перенесена из EngineeringSection.tsx без изменений.
 */
function SuperGasBanner() {
  const services = [
    { icon: "FileSearch", title: "Проектирование", desc: "ТУ, рабочий проект, согласование с Газпром Газораспределение" },
    { icon: "Truck",      title: "Поставка СУГ",   desc: "Заправка газгольдера пропан-бутаном, выезд в день заявки" },
    { icon: "Wrench",     title: "Монтаж под ключ",desc: "Земляные работы, обвязка, опрессовка, ввод в эксплуатацию" },
    { icon: "Shield",     title: "Сервис и ВДГО",  desc: "Регламентное ТО, аварийная служба, продление гарантии" },
  ];

  const advantages = [
    "Сертифицированная продукция, международные стандарты",
    "Прямые поставки от мировых производителей",
    "Сеть специализированных магазинов",
    "Команда инженеров и монтажников",
  ];

  return (
    <div className="bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-orange-500/10 border-2 border-orange-500/30 rounded-2xl p-5 mb-6 overflow-hidden relative">
      {/* Шапка партнёра */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shrink-0">
            <Icon name="Flame" size={28} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-orange-600 dark:text-orange-400">
              Технологический партнёр
            </p>
            <p className="text-2xl font-black text-foreground">
              SUPER <span className="text-orange-500">ГАЗ</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Сеть специализированных магазинов · газовое оборудование
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <a
            href="tel:88001003123"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-4 py-2 rounded-lg flex items-center gap-2 shadow-md"
          >
            <Icon name="Phone" size={14} />
            8 800 100 31 23
          </a>
          <a
            href="https://supergas.ru/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1.5 justify-end"
          >
            <Icon name="ExternalLink" size={11} />
            supergas.ru
          </a>
        </div>
      </div>

      {/* Услуги */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {services.map((s) => (
          <div key={s.title} className="bg-card/80 backdrop-blur border border-border rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon name={s.icon} size={13} className="text-orange-500" />
              <p className="text-xs font-bold text-foreground">{s.title}</p>
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Преимущества */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {advantages.map((a) => (
          <div key={a} className="flex items-center gap-1.5 text-[11px] text-foreground">
            <Icon name="CheckCircle2" size={11} className="text-orange-500 shrink-0" />
            <span>{a}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
