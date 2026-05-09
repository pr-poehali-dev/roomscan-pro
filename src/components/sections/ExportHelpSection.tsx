import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { getLastScan, getCart, type LastScan, type CartItemRef } from "@/lib/scanStore";
import { exportPlanToPDF, exportPlanToPNG } from "@/lib/planExporter";
import {
  downloadProcurementCsv,
  countProcurementItems,
} from "@/lib/procurementExport";

// ─── ExportSection ────────────────────────────────────────────────────────────
export function ExportSection() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [scan, setScan] = useState<LastScan | null>(null);
  const [cart, setCart] = useState<CartItemRef[]>([]);

  useEffect(() => {
    const sync = () => {
      setScan(getLastScan());
      setCart(getCart());
    };
    sync();
    window.addEventListener("roomscan:lastScan:changed", sync);
    window.addEventListener("roomscan:cart:changed", sync);
    return () => {
      window.removeEventListener("roomscan:lastScan:changed", sync);
      window.removeEventListener("roomscan:cart:changed", sync);
    };
  }, []);

  // Если есть реальный скан — используем его, иначе демо
  const demoData = scan
    ? {
        project: "Моё помещение",
        rooms: [{
          name: "Комната",
          area: scan.area,
          width: scan.width,
          length: scan.length,
          height: scan.height,
        }],
        doors: scan.doors ?? 0,
        windows: scan.windows ?? 0,
        openings: scan.openings ?? [],
        total_area: scan.area,
        cart: cart.map((c) => ({ name: c.name, size: `${c.w}×${c.d} см`, price: c.priceNum })),
        cart_total: cart.reduce((s, c) => s + c.priceNum, 0),
        generated: new Date().toISOString(),
      }
    : {
        project: "Квартира · демо-план",
        rooms: [
          { name: "Гостиная", area: 28.4, width: 16, length: 12, height: 2.8 },
          { name: "Спальня", area: 18.2, width: 10, length: 10, height: 2.8 },
          { name: "Кухня", area: 12.1, width: 8, length: 8, height: 2.8 },
          { name: "Ванная", area: 7.8, width: 8, length: 6, height: 2.5 },
          { name: "Коридор", area: 8.6, width: 6, length: 10, height: 2.8 },
        ],
        total_area: 75.1,
        generated: new Date().toISOString(),
      };

  const handleDownload = (label: string, action: () => void) => {
    setDownloading(label);
    setTimeout(() => {
      action();
      setDownloading(null);
      setDone((prev) => [...prev, label]);
    }, 900);
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(demoData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "roomscan-plan.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const rows = [
      ["Комната", "Площадь, м²", "Ширина, м", "Длина, м", "Высота, м"],
      ...demoData.rooms.map((r) => [r.name, r.area, r.width, r.length, r.height]),
      ["ИТОГО", demoData.total_area, "", "", ""],
    ];
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "roomscan-plan.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTXT = () => {
    const lines = [
      `RoomScan AI — Отчёт по помещению`,
      `Дата: ${new Date().toLocaleDateString("ru-RU")}`,
      `Проект: ${demoData.project}`,
      ``,
      `КОМНАТЫ:`,
      ...demoData.rooms.map((r) => `  ${r.name}: ${r.area} м² (${r.width}×${r.length} м, h=${r.height} м)`),
      ``,
      `Общая площадь: ${demoData.total_area} м²`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "roomscan-report.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPNG = () => {
    exportPlanToPNG({ scan, cart }, `roomscan-plan-${Date.now()}.png`);
  };

  const downloadPDF = () => {
    exportPlanToPDF({ scan, cart }, `roomscan-plan-${Date.now()}.pdf`);
  };

  const downloadProcurement = () => {
    downloadProcurementCsv({
      section: "all",
      tileAreaM2: scan?.area ?? 20,
      tileWastePercent: 10,
      marginPercent: 0,
      projectName: demoData.project,
    });
  };

  const procurementCount = countProcurementItems();

  const formats = [
    {
      icon: "FileJson", label: "JSON", desc: "Структурированные данные для разработчиков и интеграций",
      badge: "Реально", action: downloadJSON,
    },
    {
      icon: "Table2", label: "CSV / Excel-смета", desc: "Таблица помещений с размерами для Excel и Google Sheets",
      badge: "Реально", action: downloadCSV,
    },
    {
      icon: "FileText", label: "Текстовый отчёт", desc: "Читаемый отчёт с размерами всех помещений",
      badge: "Реально", action: downloadTXT,
    },
    {
      icon: "FileImage", label: "PNG", desc: "Изображение плана с проёмами и мебелью в высоком разрешении",
      badge: "Реально", action: downloadPNG,
    },
    {
      icon: "File", label: "PDF", desc: "A4 landscape · план комнаты + спецификация мебели",
      badge: "Реально", action: downloadPDF,
    },
    {
      icon: "ClipboardList",
      label: "Спецификация под закупку",
      desc: `CSV для Excel: артикулы, бренды, размеры, цены, итог. ${procurementCount.total > 0 ? `Готово ${procurementCount.total} позиций.` : "Сначала добавьте товары в корзину или избранное."}`,
      badge: "Pro",
      action: procurementCount.total > 0 ? downloadProcurement : null,
    },
    {
      icon: "Box", label: "DWG / DXF", desc: "Файл AutoCAD для подрядчиков и проектировщиков",
      badge: "Про", action: null,
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">Форматы</p>
        <h2 className="text-3xl font-bold">Экспорт</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {formats.map((f) => {
          const isDownloading = downloading === f.label;
          const isDone = done.includes(f.label);
          const isActive = !!f.action;

          return (
            <div key={f.label}
              className={`bg-card border rounded-lg p-5 transition-all group ${
                isActive ? "border-border hover:border-primary/40 cursor-pointer" : "border-border opacity-60"
              }`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                  isDone ? "bg-primary/20" : "bg-secondary group-hover:bg-primary/10"
                }`}>
                  <Icon name={isDone ? "CheckCircle2" : f.icon} size={22}
                    className={isDone ? "text-primary" : "text-primary"} />
                </div>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${
                  f.badge === "Про" ? "bg-border text-muted-foreground"
                  : f.badge === "Реально" ? "bg-primary/10 text-primary"
                  : "bg-yellow-500/10 text-yellow-500"
                }`}>
                  {f.badge}
                </span>
              </div>
              <p className="font-bold text-foreground mb-1">{f.label}</p>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{f.desc}</p>
              <button
                disabled={!isActive || isDownloading}
                onClick={() => isActive && f.action && handleDownload(f.label, f.action)}
                className={`w-full text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all ${
                  !isActive
                    ? "bg-secondary/50 text-muted-foreground/50 cursor-not-allowed"
                    : isDone
                    ? "bg-primary/10 text-primary"
                    : isDownloading
                    ? "bg-primary text-primary-foreground opacity-80"
                    : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
                }`}>
                <Icon name={isDownloading ? "Loader2" : isDone ? "Check" : "Download"} size={14}
                  className={isDownloading ? "animate-spin" : ""} />
                {isDownloading ? "Подготовка..." : isDone ? "Скачано" : isActive ? "Скачать" : "Скоро"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-card border border-border rounded-lg p-5">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Предпросмотр данных</p>
        <div className="bg-secondary rounded-lg overflow-hidden">
          <div className="px-4 py-2 border-b border-border flex items-center gap-2">
            <Icon name="FileJson" size={13} className="text-primary" />
            <span className="text-xs font-mono text-muted-foreground">roomscan-plan.json</span>
          </div>
          <pre className="p-4 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed">
{JSON.stringify(demoData, null, 2).split("\n").slice(0, 18).join("\n")}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ─── HelpSection ──────────────────────────────────────────────────────────────
export function HelpSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: "Как запустить сканирование?", a: "Перейдите в раздел «Сканирование» и выберите метод: WebXR (для Android с ToF-сенсором) или Фотограмметрия (работает на любом смартфоне). Медленно обводите камерой все стены." },
    { q: "Какая точность измерений?", a: "WebXR Depth API даёт точность ±3–8 см при наличии ToF/LiDAR сенсора. Фотограмметрия (SfM) — ±5–15 см в зависимости от количества и качества кадров." },
    { q: "Можно ли экспортировать план?", a: "Да, в разделе «Экспорт» доступны форматы JSON, CSV (для Excel) и текстовый отчёт. Форматы PDF, PNG и DWG/DXF в разработке." },
    { q: "Как добавить мебель из каталога?", a: "В разделе «Каталог мебели» нажмите «В план» — предмет добавится в список. Итоговая стоимость считается автоматически." },
    { q: "Как работает калькулятор материалов?", a: "В разделе «Расчёты» введите параметры помещения (площадь, периметр, высота, число проёмов) и цены материалов — смета пересчитывается в реальном времени." },
    { q: "На каких устройствах работает WebXR?", a: "Google Pixel 4+, Samsung Galaxy S21 Ultra и другие Android-смартфоны с ToF-сенсором. Браузер: только Chrome 90+. iOS и iPhone не поддерживаются." },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">Документация</p>
        <h2 className="text-3xl font-bold">Помощь</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Частые вопросы</p>
          {faqs.map((faq, i) => (
            <div key={i} className="bg-card border border-border rounded-lg overflow-hidden transition-all">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-secondary/40 transition-colors">
                <Icon name="HelpCircle" size={16} className="text-primary shrink-0" />
                <span className="font-semibold text-foreground text-sm flex-1">{faq.q}</span>
                <Icon name={openFaq === i ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground shrink-0 transition-transform" />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 pl-[calc(1.25rem+16px+0.75rem)]">
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Связаться с нами</p>
          {[
            { icon: "MessageCircle", label: "Чат поддержки", desc: "Ответ в течение 5 минут", action: "Открыть чат", href: "https://poehali.dev/help" },
            { icon: "Mail", label: "Email", desc: "support@roomscan-ai.ru", action: "Написать", href: "mailto:support@roomscan-ai.ru" },
            { icon: "BookOpen", label: "База знаний", desc: "Видеоинструкции и статьи", action: "Перейти", href: "#" },
          ].map((c) => (
            <div key={c.label} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon name={c.icon} size={16} className="text-primary" />
                </div>
                <p className="font-semibold text-foreground text-sm">{c.label}</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{c.desc}</p>
              <a href={c.href} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                {c.action} <Icon name="ArrowRight" size={12} />
              </a>
            </div>
          ))}

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Zap" size={14} className="text-primary" />
              <p className="text-sm font-semibold text-foreground">RoomScan AI v1.0</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Сканирование через WebXR Depth API и фотограмметрию (Structure from Motion).
              Часть экосистемы <a href="https://avangard-ai.ru" target="_blank" rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline">АВАНГАРД</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}