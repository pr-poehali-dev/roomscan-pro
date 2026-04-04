import { useState } from "react";
import Icon from "@/components/ui/icon";

const furnitureItems = [
  { id: 1, name: "Диван угловой Loft", brand: "Arredo", size: "280×170 см", price: "89 400 ₽", category: "Диваны" },
  { id: 2, name: "Обеденный стол Solid", brand: "Nord", size: "160×80 см", price: "34 200 ₽", category: "Столы" },
  { id: 3, name: "Кресло Arc", brand: "Arredo", size: "85×90 см", price: "22 800 ₽", category: "Кресла" },
  { id: 4, name: "Шкаф-купе Forma", brand: "Space", size: "240×60 см", price: "67 600 ₽", category: "Шкафы" },
  { id: 5, name: "Кровать Frame", brand: "Nord", size: "200×160 см", price: "58 000 ₽", category: "Кровати" },
  { id: 6, name: "Тумба TV Unit", brand: "Space", size: "180×40 см", price: "18 500 ₽", category: "ТВ-зоны" },
];

const calcItems = [
  { label: "Площадь помещений", value: "87.4 м²" },
  { label: "Периметр стен", value: "47.6 м" },
  { label: "Площадь пола (с учётом порогов)", value: "85.1 м²" },
  { label: "Площадь потолка", value: "87.4 м²" },
  { label: "Площадь стен (под отделку)", value: "168.3 м²" },
  { label: "Количество дверных проёмов", value: "6 шт." },
  { label: "Количество оконных проёмов", value: "8 шт." },
  { label: "Объём помещений (высота 2.8 м)", value: "244.7 м³" },
];

export function ScanSection() {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const startScan = () => {
    setScanning(true);
    setDone(false);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setScanning(false);
          setDone(true);
          return 100;
        }
        return p + 2;
      });
    }, 60);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">LiDAR + Camera</p>
        <h2 className="text-3xl font-bold text-foreground">Сканирование помещения</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-sm overflow-hidden relative">
          <div className="aspect-video bg-[#060a0f] relative flex items-center justify-center"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }}
          >
            {scanning && (
              <div
                className="scan-line absolute left-0 right-0 h-0.5 bg-primary opacity-80"
                style={{ boxShadow: "0 0 12px 2px hsl(var(--primary))" }}
              />
            )}
            {done ? (
              <div className="text-center animate-fade-in">
                <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center mx-auto mb-3">
                  <Icon name="Check" size={28} className="text-primary" />
                </div>
                <p className="text-primary font-mono text-sm">Сканирование завершено</p>
              </div>
            ) : scanning ? (
              <div className="text-center">
                <p className="text-muted-foreground font-mono text-xs mb-2">SCANNING...</p>
                <div className="w-48 h-1 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-primary font-mono text-xs mt-2">{progress}%</p>
              </div>
            ) : (
              <div className="text-center">
                <Icon name="ScanLine" size={48} className="text-border mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Направьте камеру на помещение</p>
              </div>
            )}

            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className="pulse-dot w-2 h-2 rounded-full bg-primary block" />
              <span className="text-primary font-mono text-xs">LIDAR READY</span>
            </div>
          </div>

          <div className="p-4 flex gap-3 border-t border-border">
            <button
              onClick={startScan}
              disabled={scanning}
              className="flex-1 bg-primary text-primary-foreground font-semibold text-sm py-2.5 px-4 rounded-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Icon name="ScanLine" size={16} />
              {scanning ? "Идёт сканирование..." : "Начать сканирование"}
            </button>
            <button className="bg-secondary text-secondary-foreground text-sm py-2.5 px-4 rounded-sm hover:bg-border transition-colors">
              <Icon name="Settings2" size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { icon: "Ruler", label: "Точность измерений", value: "± 2 мм" },
            { icon: "Layers", label: "Метод", value: "LiDAR + Photogrammetry" },
            { icon: "Cpu", label: "Обработка", value: "Нейросеть v3.1" },
            { icon: "Eye", label: "Определение проёмов", value: "Автоматически" },
          ].map((item) => (
            <div key={item.label} className="bg-card border border-border rounded-sm p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-secondary flex items-center justify-center shrink-0">
                <Icon name={item.icon} size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold text-foreground">{item.value}</p>
              </div>
              <Icon name="CheckCircle2" size={16} className="text-primary shrink-0" />
            </div>
          ))}

          <div className="bg-card border border-border rounded-sm p-4">
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-widest font-mono">Результаты последнего сканирования</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { v: "4", l: "комнаты" },
                { v: "87 м²", l: "площадь" },
                { v: "14", l: "проёмов" },
              ].map((s) => (
                <div key={s.l} className="text-center">
                  <p className="text-2xl font-black text-primary font-mono">{s.v}</p>
                  <p className="text-xs text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlannerSection() {
  const [activeTool, setActiveTool] = useState("select");
  const tools = [
    { id: "select", icon: "MousePointer2", label: "Выбор" },
    { id: "wall", icon: "Minus", label: "Стена" },
    { id: "door", icon: "DoorOpen", label: "Дверь" },
    { id: "window", icon: "Square", label: "Окно" },
    { id: "measure", icon: "Ruler", label: "Измерить" },
    { id: "text", icon: "Type", label: "Текст" },
  ];

  const rooms = [
    { x: 10, y: 10, w: 160, h: 120, label: "Гостиная", area: "28.4 м²" },
    { x: 10, y: 140, w: 100, h: 100, label: "Спальня", area: "18.2 м²" },
    { x: 180, y: 10, w: 80, h: 80, label: "Кухня", area: "12.1 м²" },
    { x: 180, y: 100, w: 80, h: 60, label: "Ванная", area: "7.8 м²" },
    { x: 120, y: 140, w: 60, h: 100, label: "Коридор", area: "8.6 м²" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">2D/3D</p>
          <h2 className="text-3xl font-bold">Планировщик</h2>
        </div>
        <div className="flex gap-2">
          {["2D", "3D"].map((v) => (
            <button
              key={v}
              className={`text-sm font-mono px-4 py-2 rounded-sm border transition-colors ${
                v === "2D"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-1 bg-card border border-border rounded-sm p-2">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              title={t.label}
              className={`w-10 h-10 rounded-sm flex items-center justify-center transition-colors ${
                activeTool === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon name={t.icon} size={18} />
            </button>
          ))}
        </div>

        <div className="flex-1 bg-card border border-border rounded-sm overflow-hidden">
          <div className="bg-secondary/30 border-b border-border px-4 py-2 flex items-center gap-4">
            <p className="text-xs font-mono text-muted-foreground">Квартира на Ленина, 12</p>
            <span className="text-xs font-mono text-border">|</span>
            <p className="text-xs font-mono text-muted-foreground">Масштаб: 1:50</p>
            <span className="ml-auto text-xs font-mono text-primary">87.1 м²</span>
          </div>

          <div className="relative overflow-hidden" style={{ height: 360 }}>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
                backgroundSize: "40px 40px"
              }}
            />
            <svg width="100%" height="100%" viewBox="0 0 280 250" className="absolute inset-0">
              {rooms.map((r) => (
                <g key={r.label}>
                  <rect
                    x={r.x} y={r.y} width={r.w} height={r.h}
                    fill="rgba(255,255,255,0.03)"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1.5"
                    style={{ cursor: "pointer" }}
                  />
                  <text x={r.x + r.w / 2} y={r.y + r.h / 2 - 6} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="8" fontFamily="IBM Plex Mono">
                    {r.label}
                  </text>
                  <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 8} textAnchor="middle" fill="hsl(35,90%,55%)" fontSize="7" fontFamily="IBM Plex Mono">
                    {r.area}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CatalogSection() {
  const [filter, setFilter] = useState("Все");
  const categories = ["Все", "Диваны", "Столы", "Кресла", "Шкафы", "Кровати", "ТВ-зоны"];
  const filtered = filter === "Все" ? furnitureItems : furnitureItems.filter((f) => f.category === filter);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">3D-библиотека</p>
        <h2 className="text-3xl font-bold">Каталог мебели</h2>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`text-xs font-mono px-3 py-1.5 rounded-sm border transition-colors ${
              filter === c
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-card border border-border rounded-sm overflow-hidden hover:border-primary/40 transition-colors cursor-pointer group"
          >
            <div className="aspect-video bg-secondary flex items-center justify-center">
              <Icon name="Sofa" size={40} className="text-border group-hover:text-primary/40 transition-colors" />
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground font-mono mb-1">{item.brand} · {item.category}</p>
              <p className="font-semibold text-foreground mb-1">{item.name}</p>
              <p className="text-xs text-muted-foreground mb-3">{item.size}</p>
              <div className="flex items-center justify-between">
                <span className="text-primary font-bold">{item.price}</span>
                <button className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-sm hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1">
                  <Icon name="Plus" size={12} />
                  В план
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalcSection() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">Автоматически</p>
        <h2 className="text-3xl font-bold">Расчёты</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Основные параметры</p>
          <div className="space-y-2">
            {calcItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between bg-card border border-border rounded-sm px-4 py-3"
              >
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="font-mono font-semibold text-primary text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Смета материалов</p>

          {[
            { mat: "Напольное покрытие (ламинат)", qty: "85.1 м²", price: "220 ₽/м²", total: "18 722 ₽" },
            { mat: "Обои (флизелин)", qty: "168.3 м²", price: "480 ₽/м²", total: "80 784 ₽" },
            { mat: "Краска потолочная", qty: "87.4 м²", price: "95 ₽/м²", total: "8 303 ₽" },
            { mat: "Плинтус (пол)", qty: "47.6 м", price: "120 ₽/м", total: "5 712 ₽" },
          ].map((r) => (
            <div key={r.mat} className="bg-card border border-border rounded-sm p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-semibold text-foreground">{r.mat}</p>
                <p className="text-primary font-bold font-mono text-sm">{r.total}</p>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground font-mono">
                <span>{r.qty}</span>
                <span>×</span>
                <span>{r.price}</span>
              </div>
            </div>
          ))}

          <div className="bg-primary/10 border border-primary/30 rounded-sm p-4 flex justify-between items-center">
            <span className="font-semibold text-foreground">Итого материалы:</span>
            <span className="text-primary font-black text-xl font-mono">113 521 ₽</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExportSection() {
  const formats = [
    { icon: "FileImage", label: "PNG / JPEG", desc: "Изображение плана в высоком разрешении", badge: "Популярное" },
    { icon: "File", label: "PDF", desc: "Документ с планом и спецификацией", badge: "" },
    { icon: "Box", label: "DWG / DXF", desc: "Файл AutoCAD для подрядчиков", badge: "Про" },
    { icon: "Layers", label: "IFC", desc: "BIM-модель для строительства", badge: "Про" },
    { icon: "Globe", label: "3D-тур", desc: "Интерактивная ссылка для клиента", badge: "Новое" },
    { icon: "Table2", label: "Excel-смета", desc: "Таблица материалов и стоимостей", badge: "" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">Форматы</p>
        <h2 className="text-3xl font-bold">Экспорт</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {formats.map((f) => (
          <div
            key={f.label}
            className="bg-card border border-border rounded-sm p-5 hover:border-primary/40 transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-secondary rounded-sm flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Icon name={f.icon} size={22} className="text-primary" />
              </div>
              {f.badge && (
                <span className={`text-xs font-mono px-2 py-0.5 rounded-sm ${
                  f.badge === "Про" ? "bg-border text-muted-foreground" : "bg-primary/10 text-primary"
                }`}>
                  {f.badge}
                </span>
              )}
            </div>
            <p className="font-bold text-foreground mb-1">{f.label}</p>
            <p className="text-sm text-muted-foreground mb-4">{f.desc}</p>
            <button className="w-full text-sm bg-secondary text-secondary-foreground py-2 rounded-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex items-center justify-center gap-2">
              <Icon name="Download" size={14} />
              Скачать
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HelpSection() {
  const faqs = [
    { q: "Как запустить сканирование?", a: "Перейдите в раздел «Сканирование» и нажмите «Начать сканирование». Направьте камеру на стены помещения, медленно обводя пространство." },
    { q: "Какая точность измерений?", a: "LiDAR обеспечивает точность ±2 мм. Для лучших результатов используйте устройство с аппаратным LiDAR-сенсором." },
    { q: "Можно ли экспортировать план в AutoCAD?", a: "Да, в разделе «Экспорт» доступен формат DWG/DXF, совместимый с AutoCAD и другими САПР." },
    { q: "Как добавить мебель из каталога?", a: "Откройте «Каталог мебели», выберите нужный предмет и нажмите «В план». Мебель автоматически появится в планировщике." },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">Документация</p>
        <h2 className="text-3xl font-bold">Помощь</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Частые вопросы</p>
          {faqs.map((faq, i) => (
            <div key={i} className="bg-card border border-border rounded-sm p-5">
              <p className="font-semibold text-foreground mb-2 flex items-start gap-2">
                <Icon name="HelpCircle" size={16} className="text-primary shrink-0 mt-0.5" />
                {faq.q}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed pl-6">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Связаться с нами</p>
          {[
            { icon: "MessageCircle", label: "Чат поддержки", desc: "Ответ в течение 5 минут", action: "Открыть чат" },
            { icon: "Mail", label: "Email", desc: "support@planscan.ru", action: "Написать" },
            { icon: "BookOpen", label: "База знаний", desc: "Видеоинструкции и статьи", action: "Перейти" },
          ].map((c) => (
            <div key={c.label} className="bg-card border border-border rounded-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <Icon name={c.icon} size={18} className="text-primary" />
                <p className="font-semibold text-foreground text-sm">{c.label}</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{c.desc}</p>
              <button className="text-xs text-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                {c.action} <Icon name="ArrowRight" size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
