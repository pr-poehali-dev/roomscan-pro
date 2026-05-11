import { Suspense } from "react";
import Icon from "@/components/ui/icon";
import PartnersMarquee from "./PartnersMarquee";
import ContinueWorkBlock from "@/components/home/ContinueWorkBlock";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

// Тяжёлая Three.js-демка ленится: уменьшает размер первого бандла,
// показываем placeholder того же размера до подгрузки сцены.
// lazyWithRetry — устойчивость к устаревшим чанкам после деплоя.
const HeroDemo3D = lazyWithRetry(() => import("./HeroDemo3D"));

function HeroDemo3DSkeleton() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0a1410] to-[#050807]"
      aria-hidden="true"
    >
      <Icon name="Loader2" size={28} className="text-primary/60 animate-spin" />
    </div>
  );
}

interface Props {
  onNavigate: (section: string) => void;
  userName?: string;
}

const FEATURES = [
  {
    id: "learn",
    icon: "GraduationCap",
    title: "Учебный модуль",
    desc: "5 интерактивных курсов с бейджами: для новичков, риелторов, дизайнеров. Освойте сервис за 30 минут",
    badge: "СТАРТ ЗДЕСЬ",
  },
  {
    id: "scan",
    icon: "ScanLine",
    title: "3D-сканирование",
    desc: "Снимите комнату с телефона — получите точное 3D-облако и размеры за 30 секунд",
    badge: "AI",
  },
  {
    id: "planner",
    icon: "LayoutGrid",
    title: "Планировщик 2D/3D",
    desc: "Расставьте мебель, измените стены, экспортируйте в PDF",
    badge: null,
  },
  {
    id: "styles",
    icon: "Wand2",
    title: "AI-стили интерьера",
    desc: "Сгенерируйте лофт, скандинавский, минимализм по одной фотографии",
    badge: "NEW",
  },
  {
    id: "calc",
    icon: "Calculator",
    title: "Смета ремонта",
    desc: "Полный расчёт по 3 тарифам: Эконом, Стандарт, Премиум — с работами и материалами",
    badge: "ОБНОВЛЕНО",
  },
  {
    id: "staging",
    icon: "TrendingUp",
    title: "Хоумстейджинг",
    desc: "Подготовка квартиры к продаже: бюджет, чек-лист и прогноз роста цены",
    badge: "NEW",
  },
  {
    id: "openings",
    icon: "DoorOpen",
    title: "Окна и двери",
    desc: "Точный расчёт окон ПВХ/алюминий и межкомнатных/входных дверей с установкой",
    badge: "NEW",
  },
  {
    id: "catalog",
    icon: "Sofa",
    title: "Каталог мебели",
    desc: "Модели от партнёров — с быстрой AR-примеркой в вашей комнате",
    badge: null,
  },
  {
    id: "converter",
    icon: "FileBox",
    title: "Конвертер 3D-моделей",
    desc: "FBX, OBJ, 3DS, DAE с 3ddd.ru и Sketchfab → GLB + USDZ для веба и AR на iOS/Android",
    badge: "NEW",
  },
  {
    id: "brands",
    icon: "Store",
    title: "Российские бренды",
    desc: "Like Lodka, Sarosco, Svetholl и другие — AR-примерка мебели и света в комнате",
    badge: "NEW",
  },
  {
    id: "export",
    icon: "Share2",
    title: "Экспорт в 6 форматах",
    desc: "PDF, OBJ, GLB, USDZ, FBX, изображения для презентаций",
    badge: null,
  },
];

const STEPS = [
  { num: "01", title: "Отсканируйте комнату", desc: "Камерой телефона по периметру помещения" },
  { num: "02", title: "Расставьте мебель", desc: "Выберите из каталога или загрузите свою" },
  { num: "03", title: "Получите смету", desc: "AI рассчитает материалы и работы" },
  { num: "04", title: "Поделитесь проектом", desc: "Отправьте дизайнеру или мастеру" },
];

const STATS = [
  { value: "~30 сек", label: "сканирование*" },
  { value: "до ±2 см", label: "точность*" },
  { value: "50+", label: "партнёров каталога" },
  { value: "6", label: "форматов экспорта" },
];

export default function HomeSection({ onNavigate, userName }: Props) {
  return (
    <div className="space-y-12 -m-6 lg:-m-8">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f1419] via-[#0a0f0c] to-[#0f1419] text-white px-6 lg:px-12 pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Декоративная сетка */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(34,197,94,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Зелёное свечение */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-12">
            {/* ЛЕВАЯ КОЛОНКА — текст */}
            <div className="lg:col-span-7">
              {/* Бейдж АВАНГАРД */}
              <a
                href="https://avangard-ai.ru"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-primary/30 rounded-full px-3 py-1.5 mb-6 backdrop-blur-sm transition-colors group"
              >
                <Icon name="Zap" size={12} className="text-primary" />
                <span className="text-xs font-mono uppercase tracking-widest text-white/80">
                  Часть экосистемы
                </span>
                <span className="text-xs font-bold text-primary">АВАНГАРД</span>
                <Icon
                  name="ArrowUpRight"
                  size={11}
                  className="text-white/40 group-hover:text-primary transition-colors"
                />
              </a>

              {/* Главный заголовок */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.02] tracking-tight mb-6">
                Превратите{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 text-primary">любую комнату</span>
                  <span className="absolute inset-x-0 bottom-1 h-3 bg-primary/20 -z-0" />
                </span>
                <br />
                в 3D-проект с AI
              </h1>

              <p className="text-base lg:text-lg text-white/70 mb-8 leading-relaxed max-w-xl">
                {userName && userName !== "Гость" ? `${userName}, отсканируйте` : "Отсканируйте"} помещение за&nbsp;30&nbsp;секунд,
                расставьте мебель, получите смету и&nbsp;поделитесь готовым проектом — всё&nbsp;в&nbsp;одном&nbsp;окне.
              </p>

              {/* CTA-кнопки */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onNavigate("scan")}
                  className="group inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-4 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1419]"
                >
                  <Icon name="ScanLine" size={20} />
                  Начать сканирование
                  <Icon
                    name="ArrowRight"
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
                <button
                  onClick={() => onNavigate("usecases")}
                  className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold px-6 py-4 rounded-xl transition-all backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1419]"
                >
                  <Icon name="Play" size={18} className="text-primary" />
                  Сценарии использования
                </button>
              </div>
            </div>

            {/* ПРАВАЯ КОЛОНКА — 3D-демо */}
            <div className="lg:col-span-5">
              <div className="relative aspect-square max-w-[500px] mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-[#0a1410] to-[#050807] border border-primary/20 shadow-2xl shadow-primary/10">
                {/* Внутреннее свечение */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none z-10" />
                <Suspense fallback={<HeroDemo3DSkeleton />}>
                  <HeroDemo3D />
                </Suspense>
              </div>
              <p className="text-center text-[10px] font-mono uppercase tracking-[0.18em] text-white/40 mt-4">
                Так выглядит ваша комната после сканирования
              </p>
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 pt-8 border-t border-white/10">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-2xl lg:text-4xl font-black text-white mb-1.5 t-num leading-none">
                  {s.value}
                </p>
                <p className="text-[10px] lg:text-xs text-white/50 uppercase tracking-[0.18em] font-mono">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[10px] text-white/40 leading-relaxed max-w-3xl">
            * Ориентировочные значения при оптимальных условиях съёмки (стабильное освещение,
            свободные стены, ровное движение камеры). Реальная скорость и точность зависят
            от устройства и условий помещения.
          </p>
        </div>
      </section>

      {/* ПРОДОЛЖИТЬ РАБОТУ — показывается если есть сохранённые проекты */}
      <ContinueWorkBlock onNavigate={onNavigate} />

      {/* ВОЗМОЖНОСТИ */}
      <section className="px-6 lg:px-12 max-w-6xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
          <div>
            <p className="t-meta text-primary mb-2">Возможности</p>
            <h2 className="h-block text-foreground">Всё для дизайна интерьера</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Восемь инструментов, которые заменят дизайнера, замерщика, риелтора и&nbsp;сметчика
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <button
              key={f.id}
              onClick={() => onNavigate(f.id)}
              className="group relative text-left card-base card-hover p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {f.badge && (
                <span className="absolute top-4 right-4 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded">
                  {f.badge}
                </span>
              )}
              <div className="w-12 h-12 bg-primary/10 group-hover:bg-primary group-hover:scale-110 rounded-xl flex items-center justify-center mb-4 transition-all">
                <Icon
                  name={f.icon}
                  size={22}
                  className="text-primary group-hover:text-primary-foreground transition-colors"
                />
              </div>
              <h3 className="h-card text-foreground mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{f.desc}</p>
              <div className="flex items-center gap-1.5 text-primary text-[11px] font-bold uppercase tracking-[0.18em]">
                Открыть
                <Icon
                  name="ArrowRight"
                  size={12}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ЛЕНТА ПАРТНЁРОВ */}
      <PartnersMarquee />

      {/* КАК ЭТО РАБОТАЕТ */}
      <section className="px-6 lg:px-12 max-w-6xl mx-auto w-full">
        <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-3xl p-8 lg:p-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-10">
            <div>
              <p className="t-meta text-primary mb-2">Процесс</p>
              <h2 className="h-block text-foreground">Как это работает</h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              От пустой комнаты до готового проекта — четыре шага
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-[60%] w-full h-px border-t-2 border-dashed border-primary/20" />
                )}
                <div className="relative">
                  <div className="w-12 h-12 bg-card border-2 border-primary/30 rounded-xl flex items-center justify-center mb-4 relative z-10">
                    <span className="text-sm t-num font-bold text-primary">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="font-bold text-foreground mb-1.5">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA-БЛОК */}
      <section className="px-6 lg:px-12 max-w-6xl mx-auto w-full pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Партнёрам */}
          <div className="bg-card border border-border rounded-2xl p-8 hover:border-primary/40 transition-colors">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Icon name="Handshake" size={22} className="text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-1">
                  Магазинам и&nbsp;дизайнерам
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Подключите свой каталог, получайте заявки от&nbsp;тысяч пользователей
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate("partners")}
              className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:gap-3 transition-all"
            >
              Стать партнёром
              <Icon name="ArrowRight" size={16} />
            </button>
          </div>

          {/* Помощь */}
          <div className="bg-card border border-border rounded-2xl p-8 hover:border-primary/40 transition-colors">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Icon name="LifeBuoy" size={22} className="text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-1">
                  Нужна помощь?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  FAQ, видеоинструкции и&nbsp;поддержка 24/7 — найдём ответ
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate("help")}
              className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:gap-3 transition-all"
            >
              Открыть центр помощи
              <Icon name="ArrowRight" size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}