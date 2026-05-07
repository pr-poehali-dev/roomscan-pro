import Icon from "@/components/ui/icon";

const PARTNERS = [
  { name: "IKEA", icon: "Sofa" },
  { name: "Hoff", icon: "Armchair" },
  { name: "Леруа Мерлен", icon: "Hammer" },
  { name: "OBI", icon: "Wrench" },
  { name: "Castorama", icon: "PaintBucket" },
  { name: "Askona", icon: "Bed" },
  { name: "Lazurit", icon: "Sofa" },
  { name: "Много Мебели", icon: "Package" },
  { name: "Divan.ru", icon: "Armchair" },
  { name: "Mr.Doors", icon: "DoorOpen" },
  { name: "Kerama Marazzi", icon: "Grid3x3" },
  { name: "Estima", icon: "Layers" },
  { name: "Maxidom", icon: "Home" },
  { name: "Petrovich", icon: "Construction" },
];

const ITEMS = [...PARTNERS, ...PARTNERS]; // дублируем для бесшовной анимации

export default function PartnersMarquee() {
  return (
    <section className="px-6 lg:px-12 max-w-6xl mx-auto w-full">
      <div className="text-center mb-6">
        <p className="text-primary text-xs font-mono uppercase tracking-widest mb-2">
          С нами работают
        </p>
        <h2 className="text-2xl lg:text-3xl font-black text-foreground">
          50+ брендов мебели и&nbsp;стройматериалов
        </h2>
      </div>

      <div className="relative overflow-hidden bg-card border border-border rounded-2xl py-6">
        {/* Градиенты по краям */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none" />

        {/* Бегущая лента */}
        <div className="flex gap-8 animate-marquee whitespace-nowrap">
          {ITEMS.map((p, i) => (
            <div
              key={`${p.name}-${i}`}
              className="flex items-center gap-3 shrink-0 px-5 py-3 bg-background/50 border border-border rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name={p.icon} size={16} className="text-primary" />
              </div>
              <span className="text-sm font-bold text-foreground tracking-tight">
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-4">
        Хотите видеть свой бренд здесь? Заполните{" "}
        <span className="text-primary font-semibold">форму партнёра</span> ниже
      </p>
    </section>
  );
}
