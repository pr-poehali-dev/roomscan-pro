import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { notify } from "@/lib/notify";
import { BRAND_REQUESTS_URL } from "@/lib/api";
import ModelViewer from "@/components/3d/ModelViewer";

interface Brand {
  id: string;
  name: string;
  category: "furniture" | "lighting" | "decor";
  city: string;
  desc: string;
  website: string;
  thumbnailUrl: string;
  /** Демо-модели (GLB). Если нет — заглушка-фото. */
  models: {
    name: string;
    /** URL к GLB. Может быть пусто — тогда показываем только превью-фото. */
    glbUrl?: string;
    iosSrc?: string;
    poster: string;
    price?: string;
    tags?: string[];
  }[];
  /** TRUE — реальные модели уже залиты, FALSE — модели «по запросу к бренду». */
  modelsReady: boolean;
}

const BRANDS: Brand[] = [
  {
    id: "likelodka",
    name: "Like Lodka",
    category: "furniture",
    city: "Москва",
    desc: "Дизайнерская мебель из корабельной древесины тика. Стеллажи и комоды из старых балийских лодок.",
    website: "https://www.likelodka.com/",
    thumbnailUrl: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/4f351d2e-b7ae-4b9c-a841-57135fc1f1c7.jpg",
    modelsReady: false,
    models: [
      {
        name: "Комод из тика",
        poster: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/4f351d2e-b7ae-4b9c-a841-57135fc1f1c7.jpg",
        price: "от 89 000 ₽",
        tags: ["тик", "винтаж"],
      },
    ],
  },
  {
    id: "sarosco",
    name: "Sarosco",
    category: "lighting",
    city: "Санкт-Петербург",
    desc: "Российский производитель светотехники: архитектурное, уличное и интерьерное освещение для проектов любого масштаба.",
    website: "https://sarosco.com/",
    thumbnailUrl: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/4a546c4d-42f0-486b-82ef-bc24a3407a16.jpg",
    modelsReady: false,
    models: [
      {
        name: "Болларды и архитектурный свет",
        poster: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/4a546c4d-42f0-486b-82ef-bc24a3407a16.jpg",
        price: "по запросу",
        tags: ["LED", "B2B"],
      },
    ],
  },
  {
    id: "svetholl",
    name: "Svetholl",
    category: "lighting",
    city: "Россия",
    desc: "Полный цикл производства светотехники и малых архитектурных форм: подвесные, накладные и фасадные светильники.",
    website: "https://svetholl.ru/",
    thumbnailUrl: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/1412356c-5f15-4b35-a236-b022d3b58258.jpg",
    modelsReady: false,
    models: [
      {
        name: "Подвесные и интерьерные светильники",
        poster: "https://cdn.poehali.dev/projects/ff1052f5-e1cc-4580-9acd-52ad0a25f2e7/files/1412356c-5f15-4b35-a236-b022d3b58258.jpg",
        price: "по запросу",
        tags: ["декор", "B2B"],
      },
    ],
  },
];

const CATEGORIES = [
  { id: "all", label: "Все", icon: "Grid3x3" },
  { id: "furniture", label: "Мебель", icon: "Sofa" },
  { id: "lighting", label: "Свет", icon: "Lightbulb" },
  { id: "decor", label: "Декор", icon: "Sparkles" },
];

export default function BrandsSection() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({
    brandName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    category: "furniture",
    modelsCount: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const filtered = activeCategory === "all" ? BRANDS : BRANDS.filter((b) => b.category === activeCategory);

  const submitRequest = async () => {
    if (!formData.brandName.trim()) {
      notify.warn("Укажите название бренда");
      return;
    }
    if (!formData.contactEmail.trim() && !formData.contactPhone.trim()) {
      notify.warn("Оставьте email или телефон для связи");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(BRAND_REQUESTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        notify.success("Заявка принята", "Мы свяжемся с вами в течение 24 часов");
        setShowRequestForm(false);
        setFormData({
          brandName: "",
          contactName: "",
          contactEmail: "",
          contactPhone: "",
          website: "",
          category: "furniture",
          modelsCount: "",
          message: "",
        });
      } else {
        notify.error("Не удалось отправить", data.error || "Попробуйте позже");
      }
    } catch (err) {
      notify.error("Ошибка сети", err instanceof Error ? err.message : "Попробуйте позже");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Российские бренды</h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Мебель и свет от российских производителей — с 3D-моделями для AR-примерки в вашей комнате.
            Открытый каталог: бренды размещают свои модели бесплатно, вы примеряете их через AR на iPhone или Android.
          </p>
        </div>
        <Button onClick={() => setShowRequestForm(true)} className="shrink-0">
          <Icon name="Plus" size={14} className="mr-1.5" />
          Я бренд, хочу попасть в каталог
        </Button>
      </header>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid grid-cols-4 max-w-lg">
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.id} value={c.id}>
              <Icon name={c.icon} size={14} className="mr-1.5" />
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-5">
          {filtered.length === 0 ? (
            <Card className="p-10 text-center">
              <Icon name="SearchX" size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold text-foreground">В этой категории пока нет брендов</p>
              <p className="text-sm text-muted-foreground mt-1">Скоро добавим — следите за обновлениями.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((brand) => (
                <Card
                  key={brand.id}
                  className="overflow-hidden hover:border-primary transition-colors cursor-pointer group"
                  onClick={() => setSelectedBrand(brand)}
                >
                  <div className="aspect-video overflow-hidden bg-secondary/50 relative">
                    <img
                      src={brand.thumbnailUrl}
                      alt={brand.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                    {brand.modelsReady ? (
                      <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                        <Icon name="Box" size={12} className="mr-1" />
                        3D готово
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="absolute top-3 right-3">
                        <Icon name="Clock" size={12} className="mr-1" />
                        Модели по запросу
                      </Badge>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                        {brand.name}
                      </h3>
                      <Badge variant="outline" className="font-mono text-xs shrink-0">
                        {brand.city}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{brand.desc}</p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">
                        {brand.models.length}{" "}
                        {brand.models.length === 1 ? "коллекция" : "коллекций"}
                      </span>
                      <Icon name="ArrowRight" size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/0 border-primary/20">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <Icon name="Handshake" size={24} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground">Производите мебель или свет?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Размещение бесплатное. Мы помогаем подготовить 3D-модели из ваших каталогов и даём AR-витрину для миллионов посетителей.
            </p>
          </div>
          <Button onClick={() => setShowRequestForm(true)} className="shrink-0">
            <Icon name="Send" size={14} className="mr-1.5" />
            Оставить заявку
          </Button>
        </div>
      </Card>

      {/* Модалка с деталями бренда */}
      <Dialog open={!!selectedBrand} onOpenChange={(open) => !open && setSelectedBrand(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedBrand && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedBrand.name}</DialogTitle>
                <DialogDescription>{selectedBrand.desc}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{selectedBrand.city}</Badge>
                  <Badge variant="secondary">
                    {selectedBrand.category === "furniture" && "Мебель"}
                    {selectedBrand.category === "lighting" && "Свет"}
                    {selectedBrand.category === "decor" && "Декор"}
                  </Badge>
                  {selectedBrand.modelsReady ? (
                    <Badge className="bg-primary text-primary-foreground">3D-модели в каталоге</Badge>
                  ) : (
                    <Badge variant="secondary">Модели по запросу</Badge>
                  )}
                </div>

                {selectedBrand.models.map((m, idx) => (
                  <Card key={idx} className="overflow-hidden">
                    <div className="aspect-video bg-secondary/50">
                      {m.glbUrl ? (
                        <ModelViewer src={m.glbUrl} iosSrc={m.iosSrc} alt={m.name} poster={m.poster} />
                      ) : (
                        <img src={m.poster} alt={m.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-foreground">{m.name}</p>
                        {m.price && <Badge variant="outline">{m.price}</Badge>}
                      </div>
                      {m.tags && m.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {m.tags.map((t) => (
                            <span key={t} className="text-xs bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                {!selectedBrand.modelsReady && (
                  <Card className="p-4 bg-secondary/40">
                    <div className="flex items-start gap-3">
                      <Icon name="Info" size={18} className="text-primary shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-foreground mb-1">3D-модели по запросу</p>
                        <p className="text-muted-foreground leading-relaxed">
                          Этот бренд не выкладывает 3D-модели публично. Если вы дизайнер или архитектор — напишите в почту менеджеру,
                          обычно модели в FBX выдают по запросу. Получив FBX, конвертируйте его в GLB в нашем{" "}
                          <a href="#converter" className="text-primary hover:underline">Конвертере 3D</a>.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                <a
                  href={selectedBrand.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-mono"
                >
                  <Icon name="ExternalLink" size={14} />
                  {selectedBrand.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Форма заявки бренда */}
      <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Заявка на размещение бренда</DialogTitle>
            <DialogDescription>
              Заполните форму — мы свяжемся в течение 24 часов, поможем подготовить 3D-модели и опубликуем каталог.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">
                  Название бренда <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  placeholder="Like Lodka"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Сайт</label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://likelodka.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Имя контакта</label>
                <Input
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="Иван Петров"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Категория</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="furniture">Мебель</option>
                  <option value="lighting">Свет</option>
                  <option value="decor">Декор</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Email</label>
                <Input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="info@brand.ru"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Телефон</label>
                <Input
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+7 999 123-45-67"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">
                Сколько примерно моделей готовы предоставить?
              </label>
              <Input
                type="number"
                value={formData.modelsCount}
                onChange={(e) => setFormData({ ...formData, modelsCount: e.target.value })}
                placeholder="50"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Комментарий</label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Какая помощь нужна по подготовке 3D? Есть ли уже модели в FBX/3DS/MAX?"
                rows={4}
              />
            </div>

            <div className="bg-secondary/40 rounded-lg p-3 text-xs text-muted-foreground">
              Размещение полностью бесплатное. Мы конвертируем ваши FBX/MAX-файлы в GLB и USDZ, готовим AR-витрину
              и подключаем счётчик переходов на ваш сайт.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowRequestForm(false)}>
                Отмена
              </Button>
              <Button onClick={submitRequest} disabled={submitting}>
                {submitting ? (
                  <>
                    <Icon name="Loader2" size={14} className="mr-1.5 animate-spin" />
                    Отправляем…
                  </>
                ) : (
                  <>
                    <Icon name="Send" size={14} className="mr-1.5" />
                    Отправить заявку
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
