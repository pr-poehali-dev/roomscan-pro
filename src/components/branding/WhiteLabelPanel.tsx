import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import {
  getBranding,
  saveBranding,
  resetBranding,
  type PartnerBranding,
} from "@/lib/brandingStore";

const PRESET_COLORS = [
  "#22c55e", // зелёный (default)
  "#0ea5e9", // голубой
  "#6366f1", // индиго
  "#ec4899", // розовый
  "#f97316", // оранжевый
  "#eab308", // жёлтый
  "#14b8a6", // бирюзовый
  "#1f2937", // антрацит
];

/**
 * Панель настройки white-label-брендирования.
 * Загружает логотип (PNG / SVG до 500КБ → data URL), цвет акцента, контакты.
 * Все экспорты PDF / Excel / шеры подхватывают брендинг автоматически.
 */
export default function WhiteLabelPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [branding, setBranding] = useState<PartnerBranding>(() => getBranding());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setBranding(getBranding());
    window.addEventListener("roomscan:branding:changed", sync);
    return () => window.removeEventListener("roomscan:branding:changed", sync);
  }, []);

  function update<K extends keyof PartnerBranding>(key: K, value: PartnerBranding[K]) {
    setBranding((prev) => ({ ...prev, [key]: value }));
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      toast.error("Логотип слишком большой", {
        description: "Максимум 500 КБ. Сожмите изображение.",
      });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Это не изображение");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      update("logoDataUrl", ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (branding.enabled && !branding.studioName.trim()) {
      toast.error("Укажите название студии", {
        description: "Это обязательное поле для активации брендирования.",
      });
      return;
    }
    saveBranding(branding);
    setSaved(true);
    toast.success("Брендирование сохранено", {
      description: branding.enabled
        ? "Все экспорты теперь идут с вашим логотипом и контактами."
        : "Настройки сохранены. Включите тумблер чтобы активировать.",
    });
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    if (!confirm("Сбросить все настройки брендирования?")) return;
    resetBranding();
    setBranding(getBranding());
    toast.info("Настройки сброшены");
  }

  return (
    <div className="card-base p-5 lg:p-6 space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="t-meta text-primary mb-1">White-label · Brand Kit</p>
          <h3 className="h-block text-foreground">Брендирование экспортов</h3>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
            Загрузите логотип студии — он появится в шапке PDF, Excel-спецификаций и на
            ссылках, которыми вы делитесь с клиентом. Идеально для дизайн-студий и архитекторов.
          </p>
        </div>

        {/* Тумблер активации */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={branding.enabled}
            onChange={(e) => update("enabled", e.target.checked)}
            className="sr-only peer"
          />
          <span className="relative w-11 h-6 bg-secondary rounded-full peer-checked:bg-primary transition-colors">
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                branding.enabled ? "translate-x-5" : ""
              }`}
            />
          </span>
          <span className="text-sm font-bold text-foreground">
            {branding.enabled ? "Включено" : "Выключено"}
          </span>
        </label>
      </div>

      {/* Превью брендирования */}
      <div
        className="rounded-xl p-4 border-2 transition-colors"
        style={{
          borderColor: branding.enabled ? branding.accentColor : "hsl(var(--border))",
          backgroundColor: branding.enabled
            ? `${branding.accentColor}10`
            : "hsl(var(--secondary) / 0.4)",
        }}
      >
        <div className="flex items-center gap-3">
          {branding.logoDataUrl ? (
            <img
              src={branding.logoDataUrl}
              alt="Логотип студии"
              className="h-10 w-10 object-contain rounded-lg bg-white p-1 shadow"
            />
          ) : (
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-black"
              style={{ backgroundColor: branding.accentColor }}
            >
              {branding.studioName?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground truncate">
              {branding.studioName || "Название вашей студии"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {branding.tagline || "Слоган · сайт · телефон"}
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Превью
          </span>
        </div>
      </div>

      {/* Поля */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="t-meta block mb-1.5">Название студии *</label>
          <input
            type="text"
            value={branding.studioName}
            onChange={(e) => update("studioName", e.target.value)}
            placeholder="Студия дизайна Atelier"
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="t-meta block mb-1.5">Слоган</label>
          <input
            type="text"
            value={branding.tagline ?? ""}
            onChange={(e) => update("tagline", e.target.value)}
            placeholder="Авторский дизайн с 2015 года"
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="t-meta block mb-1.5">Сайт</label>
          <input
            type="text"
            value={branding.contactSite ?? ""}
            onChange={(e) => update("contactSite", e.target.value)}
            placeholder="atelier.ru"
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="t-meta block mb-1.5">Телефон</label>
          <input
            type="text"
            value={branding.contactPhone ?? ""}
            onChange={(e) => update("contactPhone", e.target.value)}
            placeholder="+7 (495) 123-45-67"
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="t-meta block mb-1.5">Email</label>
          <input
            type="email"
            value={branding.contactEmail ?? ""}
            onChange={(e) => update("contactEmail", e.target.value)}
            placeholder="hello@atelier.ru"
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="t-meta block mb-1.5">ИНН</label>
          <input
            type="text"
            value={branding.inn ?? ""}
            onChange={(e) => update("inn", e.target.value)}
            placeholder="7700000000"
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Логотип */}
      <div>
        <p className="t-meta mb-2">Логотип</p>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-lg bg-secondary text-foreground font-bold text-sm flex items-center gap-2 hover:bg-secondary/70 transition-colors"
          >
            <Icon name="Upload" size={14} />
            {branding.logoDataUrl ? "Заменить логотип" : "Загрузить логотип"}
          </button>
          {branding.logoDataUrl && (
            <button
              onClick={() => update("logoDataUrl", undefined)}
              className="px-3 py-2 rounded-lg text-destructive border border-destructive/30 hover:bg-destructive/10 text-sm font-bold flex items-center gap-1.5"
            >
              <Icon name="X" size={13} />
              Удалить
            </button>
          )}
          <span className="text-[11px] text-muted-foreground">
            PNG / SVG / JPG · до 500 КБ
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="hidden"
        />
      </div>

      {/* Цвет */}
      <div>
        <p className="t-meta mb-2">Акцентный цвет</p>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => update("accentColor", c)}
              aria-label={`Цвет ${c}`}
              className={`w-9 h-9 rounded-lg transition-all ${
                branding.accentColor === c
                  ? "ring-2 ring-foreground ring-offset-2 scale-110"
                  : "hover:scale-105"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={branding.accentColor}
            onChange={(e) => update("accentColor", e.target.value)}
            className="w-9 h-9 rounded-lg cursor-pointer border-2 border-border bg-transparent"
            title="Свой цвет"
          />
          <span className="ml-1 text-xs font-mono text-muted-foreground">
            {branding.accentColor.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Кнопки */}
      <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border">
        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Icon name={saved ? "Check" : "Save"} size={14} />
          {saved ? "Сохранено" : "Сохранить настройки"}
        </button>
        <button
          onClick={handleReset}
          className="px-3 py-2.5 rounded-lg text-muted-foreground hover:text-destructive text-sm font-bold flex items-center gap-1.5"
        >
          <Icon name="RotateCcw" size={13} />
          Сбросить
        </button>
        <span className="ml-auto text-[11px] text-muted-foreground flex items-center gap-1.5">
          <Icon name="Info" size={11} />
          Доступно в тарифе BUSINESS
        </span>
      </div>
    </div>
  );
}
