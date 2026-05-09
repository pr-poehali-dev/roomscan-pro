/**
 * White-label брендирование для студий и партнёров.
 * Студия загружает свой логотип, цвет акцента и подпись — все экспорты
 * (PDF, Excel, ссылки на проекты) выходят с её брендингом.
 *
 * Хранится в localStorage. На уровне проекта работает без бэкенда —
 * после оплаты тарифа BUSINESS можно синхронизировать с PostgreSQL.
 */

export interface PartnerBranding {
  /** Название студии / компании */
  studioName: string;
  /** Слоган или короткое описание */
  tagline?: string;
  /** Логотип в формате data URL (PNG/SVG). Опционально. */
  logoDataUrl?: string;
  /** Акцентный цвет HEX, например "#22c55e" */
  accentColor: string;
  /** Контактные данные для футера PDF */
  contactEmail?: string;
  contactPhone?: string;
  contactSite?: string;
  /** Включён ли white-label-режим (все экспорты идут с брендингом) */
  enabled: boolean;
  /** ИНН для договора (опционально) */
  inn?: string;
}

const KEY = "roomscan:branding:v1";

const DEFAULT: PartnerBranding = {
  studioName: "",
  tagline: "",
  logoDataUrl: undefined,
  accentColor: "#22c55e",
  contactEmail: "",
  contactPhone: "",
  contactSite: "",
  enabled: false,
};

export function getBranding(): PartnerBranding {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<PartnerBranding>) };
  } catch {
    return DEFAULT;
  }
}

export function saveBranding(b: PartnerBranding) {
  try {
    localStorage.setItem(KEY, JSON.stringify(b));
    window.dispatchEvent(new Event("roomscan:branding:changed"));
  } catch {
    /* noop */
  }
}

export function resetBranding() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("roomscan:branding:changed"));
  } catch {
    /* noop */
  }
}

/** Возвращает строку для штампа PDF / шапки Excel */
export function getBrandingStamp(): string {
  const b = getBranding();
  if (!b.enabled || !b.studioName) return "";
  const parts = [b.studioName.toUpperCase()];
  if (b.contactSite) parts.push(b.contactSite);
  if (b.contactPhone) parts.push(b.contactPhone);
  return parts.join(" · ");
}
