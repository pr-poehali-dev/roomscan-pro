import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { getLastScan, getCart, saveCart, type CartItemRef, type LastScan } from "@/lib/scanStore";

interface Style {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  palette: string[];      // hex цвета для превью
  brandTags: string[];    // какие бренды соответствуют (берём из каталога)
  recommended: number[];  // id товаров из каталога
  description: string;
}

// id товаров берутся из furnitureItems в CatalogSection
const STYLES: Style[] = [
  {
    id: "scandi",
    name: "Сканди",
    tagline: "Минимализм, светлые тона, дерево",
    icon: "TreeDeciduous",
    palette: ["#F5F5F2", "#E8DDC9", "#A8B5A0", "#3C4A3E"],
    brandTags: ["Nord"],
    recommended: [2, 5, 7],  // стол Solid, кровать Frame, стеллаж Open
    description: "Простые формы, натуральные материалы, обилие света. Идеально для маленьких квартир.",
  },
  {
    id: "loft",
    name: "Лофт",
    tagline: "Кирпич, металл, индустриальный дух",
    icon: "Factory",
    palette: ["#3D3D3D", "#8B5A2B", "#C0392B", "#FFFFFF"],
    brandTags: ["Arredo"],
    recommended: [1, 3, 6],  // диван Loft, кресло Arc, тумба TV
    description: "Открытые потолки, металлическая фурнитура. Подходит для просторных помещений с высокими потолками.",
  },
  {
    id: "classic",
    name: "Классика",
    tagline: "Роскошь, симметрия, тёплые тона",
    icon: "Crown",
    palette: ["#F4E4BC", "#8B7355", "#704214", "#2F1B0C"],
    brandTags: ["Space"],
    recommended: [4, 6, 9],  // шкаф Forma, тумба, столик Neo
    description: "Деревянные элементы, симметричная расстановка, тёплая палитра.",
  },
];

export default function StylesSection() {
  const [selected, setSelected] = useState<string>("scandi");
  const [scan, setScan] = useState<LastScan | null>(null);
  const [cart, setCart] = useState<CartItemRef[]>([]);
  const [applied, setApplied] = useState(false);

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

  const style = STYLES.find((s) => s.id === selected) ?? STYLES[0];

  // Эвристика автораскладки в текстовом виде (без перерисовки плана —
  // просто рекомендации, основанные на размерах из скана)
  const layoutTips = (() => {
    if (!scan) return [];
    const tips: string[] = [];
    if (scan.width > scan.length) {
      tips.push("Длинный диван — вдоль стены шириной " + scan.width + " м");
    } else {
      tips.push("Длинный диван — вдоль стены глубиной " + scan.length + " м");
    }
    tips.push("ТВ-зона — напротив дивана");
    if (scan.area > 20) tips.push("Журнальный столик — в центре зоны отдыха");
    if (scan.area > 15) tips.push("Кресло — в углу у окна для чтения");
    if (scan.height >= 2.7) tips.push("Высокие потолки → подвесной светильник в центре");
    return tips;
  })();

  const applyStyle = () => {
    // Импортируем furnitureItems прямо здесь без cyclic deps
    // — берём recommended IDs и добавляем в корзину
    const FURNITURE: CartItemRef[] = [
      { id: 1, name: "Диван угловой Loft",     icon: "Sofa",     w: 280, d: 170, priceNum: 89400, category: "Диваны" },
      { id: 2, name: "Обеденный стол Solid",   icon: "Table2",   w: 160, d: 80,  priceNum: 34200, category: "Столы" },
      { id: 3, name: "Кресло Arc",             icon: "Armchair", w: 85,  d: 90,  priceNum: 22800, category: "Кресла" },
      { id: 4, name: "Шкаф-купе Forma",        icon: "Package",  w: 240, d: 60,  priceNum: 67600, category: "Шкафы" },
      { id: 5, name: "Кровать Frame",          icon: "BedDouble",w: 200, d: 160, priceNum: 58000, category: "Кровати" },
      { id: 6, name: "Тумба TV Unit",          icon: "Tv",       w: 180, d: 40,  priceNum: 18500, category: "ТВ-зоны" },
      { id: 7, name: "Стеллаж Open",           icon: "BookOpen", w: 120, d: 30,  priceNum: 12900, category: "Шкафы" },
      { id: 8, name: "Пуф Round",              icon: "Circle",   w: 60,  d: 60,  priceNum: 8400,  category: "Кресла" },
      { id: 9, name: "Журнальный столик Neo",  icon: "Table",    w: 100, d: 50,  priceNum: 14200, category: "Столы" },
    ];

    const additions = style.recommended
      .map((id) => FURNITURE.find((f) => f.id === id))
      .filter((f): f is CartItemRef => Boolean(f));

    const merged = [...cart];
    additions.forEach((a) => {
      if (!merged.find((m) => m.id === a.id)) merged.push(a);
    });
    saveCart(merged);
    setCart(merged);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  const totalPrice = cart.reduce((s, c) => s + c.priceNum, 0);
  const styleTotalPrice = style.recommended.reduce((s, id) => {
    const FURNITURE: Record<number, number> = { 1: 89400, 2: 34200, 3: 22800, 4: 67600, 5: 58000, 6: 18500, 7: 12900, 8: 8400, 9: 14200 };
    return s + (FURNITURE[id] || 0);
  }, 0);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">
          AI-генерация · 3 стиля
        </p>
        <h2 className="text-3xl font-bold mb-2">Стили интерьера</h2>
        <p className="text-muted-foreground max-w-2xl">
          Выберите стиль — мы подберём подходящую мебель из каталога и предложим
          расстановку с учётом размеров вашей комнаты.
        </p>
      </div>

      {/* Карточки стилей */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STYLES.map((s) => {
          const isActive = s.id === selected;
          return (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={`text-left bg-card border rounded-xl p-5 transition-all ${
                isActive ? "border-primary/50 shadow-lg shadow-primary/5" : "border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                  isActive ? "bg-primary/15" : "bg-secondary"
                }`}>
                  <Icon name={s.icon} size={22} className="text-primary" />
                </div>
                {isActive && (
                  <Icon name="CheckCircle2" size={18} className="text-primary" />
                )}
              </div>
              <p className="font-bold text-foreground text-lg mb-1">{s.name}</p>
              <p className="text-xs text-muted-foreground mb-3">{s.tagline}</p>
              <div className="flex gap-1 mb-3">
                {s.palette.map((c, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded border border-border"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {s.recommended.length} предметов · бренд: {s.brandTags.join(", ")}
              </p>
            </button>
          );
        })}
      </div>

      {/* Детали выбранного стиля */}
      <div className="bg-card border border-primary/20 rounded-lg p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
              Выбранный стиль
            </p>
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Icon name={style.icon} size={20} className="text-primary" />
              {style.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{style.description}</p>
          </div>
          <button
            onClick={applyStyle}
            className={`text-sm font-bold px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 ${
              applied
                ? "bg-primary text-primary-foreground scale-95"
                : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
          >
            <Icon name={applied ? "Check" : "Wand2"} size={15} />
            {applied ? "Добавлено в корзину!" : "Применить стиль"}
          </button>
        </div>

        {/* Эвристики раскладки */}
        {scan ? (
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Авто-раскладка для вашей комнаты ({scan.width}×{scan.length} м)
            </p>
            <div className="space-y-1.5">
              {layoutTips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-sm bg-secondary/40 rounded-md px-3 py-2">
                  <Icon name="ArrowRight" size={13} className="text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-secondary/40 rounded-lg p-3 flex items-start gap-2">
            <Icon name="Info" size={14} className="text-muted-foreground mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Сначала отсканируйте помещение — мы предложим раскладку под ваши размеры.
            </p>
          </div>
        )}

        {/* Превью предметов стиля */}
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Подобрано к стилю — {styleTotalPrice.toLocaleString("ru-RU")} ₽
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {style.recommended.map((id) => {
              const FURNITURE: Record<number, { name: string; icon: string; price: number }> = {
                1: { name: "Диван Loft", icon: "Sofa", price: 89400 },
                2: { name: "Стол Solid", icon: "Table2", price: 34200 },
                3: { name: "Кресло Arc", icon: "Armchair", price: 22800 },
                4: { name: "Шкаф Forma", icon: "Package", price: 67600 },
                5: { name: "Кровать Frame", icon: "BedDouble", price: 58000 },
                6: { name: "Тумба TV Unit", icon: "Tv", price: 18500 },
                7: { name: "Стеллаж Open", icon: "BookOpen", price: 12900 },
                8: { name: "Пуф Round", icon: "Circle", price: 8400 },
                9: { name: "Столик Neo", icon: "Table", price: 14200 },
              };
              const it = FURNITURE[id];
              if (!it) return null;
              return (
                <div key={id} className="bg-secondary/40 rounded-md px-3 py-2 flex items-center gap-2">
                  <Icon name={it.icon} size={16} className="text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{it.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      {it.price.toLocaleString("ru-RU")} ₽
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Текущая корзина */}
      {cart.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              В корзине
            </p>
            <span className="text-sm font-bold text-primary">
              {cart.length} поз. · {totalPrice.toLocaleString("ru-RU")} ₽
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {cart.map((c) => (
              <div key={c.id} className="bg-secondary rounded-md px-2 py-1 text-xs flex items-center gap-1.5">
                <Icon name={c.icon} size={11} className="text-primary" />
                {c.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
