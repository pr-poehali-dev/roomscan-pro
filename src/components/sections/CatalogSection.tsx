import { useState, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { saveCart, getCart, type CartItemRef } from "@/lib/scanStore";
import ARFurnitureView, { type ARFurniture } from "@/components/ar/ARFurnitureView";

const furnitureItems = [
  { id: 1, name: "Диван угловой Loft", brand: "Arredo", size: "280×170 см", price: "89 400 ₽", priceNum: 89400, category: "Диваны", icon: "Sofa", w: 280, d: 170 },
  { id: 2, name: "Обеденный стол Solid", brand: "Nord", size: "160×80 см", price: "34 200 ₽", priceNum: 34200, category: "Столы", icon: "Table2", w: 160, d: 80 },
  { id: 3, name: "Кресло Arc", brand: "Arredo", size: "85×90 см", price: "22 800 ₽", priceNum: 22800, category: "Кресла", icon: "Armchair", w: 85, d: 90 },
  { id: 4, name: "Шкаф-купе Forma", brand: "Space", size: "240×60 см", price: "67 600 ₽", priceNum: 67600, category: "Шкафы", icon: "Package", w: 240, d: 60 },
  { id: 5, name: "Кровать Frame", brand: "Nord", size: "200×160 см", price: "58 000 ₽", priceNum: 58000, category: "Кровати", icon: "BedDouble", w: 200, d: 160 },
  { id: 6, name: "Тумба TV Unit", brand: "Space", size: "180×40 см", price: "18 500 ₽", priceNum: 18500, category: "ТВ-зоны", icon: "Tv", w: 180, d: 40 },
  { id: 7, name: "Стеллаж Open", brand: "Nord", size: "120×30 см", price: "12 900 ₽", priceNum: 12900, category: "Шкафы", icon: "BookOpen", w: 120, d: 30 },
  { id: 8, name: "Пуф Round", brand: "Arredo", size: "60×60 см", price: "8 400 ₽", priceNum: 8400, category: "Кресла", icon: "Circle", w: 60, d: 60 },
  { id: 9, name: "Журнальный столик Neo", brand: "Space", size: "100×50 см", price: "14 200 ₽", priceNum: 14200, category: "Столы", icon: "Table", w: 100, d: 50 },
];

// Приблизительные высоты мебели по категориям (метры) — для AR-bbox
const HEIGHT_BY_CATEGORY: Record<string, number> = {
  "Диваны":    0.85,
  "Столы":     0.75,
  "Кресла":    0.95,
  "Шкафы":     2.10,
  "Кровати":   0.55,
  "ТВ-зоны":   0.50,
};

export default function CatalogSection() {
  const [filter, setFilter] = useState("Все");
  const [cart, setCart] = useState<number[]>([]);
  const [added, setAdded] = useState<number | null>(null);
  const [arItem, setArItem] = useState<ARFurniture | null>(null);
  const categories = ["Все", "Диваны", "Столы", "Кресла", "Шкафы", "Кровати", "ТВ-зоны"];
  const filtered = filter === "Все" ? furnitureItems : furnitureItems.filter((f) => f.category === filter);

  // Восстановление корзины из store при монтировании
  useEffect(() => {
    const stored = getCart();
    if (stored.length > 0) setCart(stored.map((c) => c.id));
  }, []);

  // Синхронизация корзины со store при изменениях
  useEffect(() => {
    const items: CartItemRef[] = cart
      .map((id) => furnitureItems.find((f) => f.id === id))
      .filter((f): f is typeof furnitureItems[number] => Boolean(f))
      .map((f) => ({
        id: f.id, name: f.name, icon: f.icon, w: f.w, d: f.d,
        priceNum: f.priceNum, category: f.category,
      }));
    saveCart(items);
  }, [cart]);

  const addToCart = useCallback((id: number) => {
    setCart((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    setAdded(id);
    setTimeout(() => setAdded(null), 1200);
  }, []);

  const totalPrice = cart.reduce((sum, id) => {
    const item = furnitureItems.find((f) => f.id === id);
    return sum + (item?.priceNum ?? 0);
  }, 0);

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">3D-библиотека</p>
          <h2 className="text-3xl font-bold">Каталог мебели</h2>
        </div>
        {cart.length > 0 && (
          <div className="flex items-center gap-3 bg-card border border-primary/20 rounded-lg px-4 py-2">
            <Icon name="ShoppingCart" size={16} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">{cart.length} поз.</span>
            <span className="text-sm font-black text-primary font-mono">
              {totalPrice.toLocaleString("ru-RU")} ₽
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {categories.map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors ${
              filter === c ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
            }`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const inCart = cart.includes(item.id);
          const justAdded = added === item.id;
          return (
            <div key={item.id}
              className={`bg-card border rounded-lg overflow-hidden transition-all cursor-pointer group ${
                inCart ? "border-primary/40" : "border-border hover:border-primary/30"
              }`}>
              <div className={`aspect-video flex items-center justify-center transition-colors ${
                inCart ? "bg-primary/10" : "bg-secondary group-hover:bg-primary/5"
              }`}>
                <Icon name={item.icon} size={40} className={`transition-colors ${
                  inCart ? "text-primary" : "text-border group-hover:text-primary/40"
                }`} />
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground font-mono mb-1">{item.brand} · {item.category}</p>
                <p className="font-semibold text-foreground mb-1">{item.name}</p>
                <p className="text-xs text-muted-foreground mb-3">{item.size}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-primary font-bold">{item.price}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setArItem({
                        id: item.id,
                        name: item.name,
                        width: item.w / 100,
                        depth: item.d / 100,
                        height: HEIGHT_BY_CATEGORY[item.category] ?? 0.8,
                      })}
                      title="Посмотреть в AR (Android Chrome)"
                      className="text-xs px-2 py-1.5 rounded-lg flex items-center gap-1 font-semibold border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                    >
                      <Icon name="View" size={12} />
                      AR
                    </button>
                    <button
                      onClick={() => addToCart(item.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all ${
                        justAdded
                          ? "bg-primary text-primary-foreground scale-95"
                          : inCart
                          ? "bg-primary/10 text-primary border border-primary/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                          : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
                      }`}>
                      <Icon name={inCart ? "Check" : "Plus"} size={12} />
                      {justAdded ? "Добавлено!" : inCart ? "В плане" : "В план"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {cart.length > 0 && (
        <div className="mt-6 bg-card border border-border rounded-lg p-5 animate-fade-in">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Выбранная мебель</p>
          <div className="space-y-2 mb-4">
            {cart.map((id) => {
              const item = furnitureItems.find((f) => f.id === id)!;
              return (
                <div key={id} className="flex items-center gap-3 text-sm">
                  <Icon name={item.icon} size={15} className="text-primary shrink-0" />
                  <span className="flex-1 text-foreground">{item.name}</span>
                  <span className="font-mono text-muted-foreground">{item.size}</span>
                  <span className="font-bold text-primary font-mono">{item.price}</span>
                  <button onClick={() => setCart((p) => p.filter((x) => x !== id))}
                    className="text-muted-foreground hover:text-destructive transition-colors">
                    <Icon name="X" size={14} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-sm text-muted-foreground">Итого: {cart.length} позиций</span>
            <span className="text-xl font-black text-primary font-mono">{totalPrice.toLocaleString("ru-RU")} ₽</span>
          </div>
        </div>
      )}

      {arItem && (
        <ARFurnitureView item={arItem} onClose={() => setArItem(null)} />
      )}
    </div>
  );
}