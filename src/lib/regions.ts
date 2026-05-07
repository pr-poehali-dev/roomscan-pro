/**
 * Региональные коэффициенты к рыночным ценам ремонта.
 * База — Москва (k = 1.00). Остальные регионы — относительно неё.
 *
 * Источники для калибровки 2025:
 *   - средние ставки строительных бригад (avito.ru, profi.ru)
 *   - индексы стоимости стройматериалов (Росстат, ФБУ ФЦЦС)
 *   - данные сервисов смет (homeapp, remontnik)
 *
 * Все значения — ориентировочные, обновляются вручную при пересмотре цен.
 */

export interface Region {
  id: string;
  /** Название региона / города */
  name: string;
  /** Коэффициент к работам (умножается на цену работ Москвы) */
  worksK: number;
  /** Коэффициент к материалам (логистика, наценка локальных поставщиков) */
  materialsK: number;
  /** Коротко — почему такой коэффициент */
  note?: string;
}

export const REGIONS: Region[] = [
  { id: "moscow",         name: "Москва",                  worksK: 1.00, materialsK: 1.00, note: "Базовый регион" },
  { id: "moscow_obl",     name: "Московская обл.",         worksK: 0.88, materialsK: 0.96 },
  { id: "spb",            name: "Санкт-Петербург",         worksK: 0.92, materialsK: 0.97 },
  { id: "lenobl",         name: "Ленинградская обл.",      worksK: 0.82, materialsK: 0.95 },
  { id: "kazan",          name: "Казань",                  worksK: 0.74, materialsK: 0.92 },
  { id: "ekaterinburg",   name: "Екатеринбург",            worksK: 0.78, materialsK: 0.93 },
  { id: "novosibirsk",    name: "Новосибирск",             worksK: 0.76, materialsK: 0.94 },
  { id: "krasnodar",      name: "Краснодар",               worksK: 0.80, materialsK: 0.95 },
  { id: "sochi",          name: "Сочи",                    worksK: 0.95, materialsK: 1.05, note: "Высокий спрос, курорт" },
  { id: "rostov",         name: "Ростов-на-Дону",          worksK: 0.72, materialsK: 0.91 },
  { id: "nizhniy",        name: "Нижний Новгород",         worksK: 0.74, materialsK: 0.92 },
  { id: "samara",         name: "Самара",                  worksK: 0.70, materialsK: 0.91 },
  { id: "voronezh",       name: "Воронеж",                 worksK: 0.68, materialsK: 0.90 },
  { id: "perm",           name: "Пермь",                   worksK: 0.70, materialsK: 0.92 },
  { id: "ufa",            name: "Уфа",                     worksK: 0.72, materialsK: 0.92 },
  { id: "krasnoyarsk",    name: "Красноярск",              worksK: 0.76, materialsK: 0.96 },
  { id: "chelyabinsk",    name: "Челябинск",               worksK: 0.70, materialsK: 0.91 },
  { id: "vladivostok",    name: "Владивосток",             worksK: 0.92, materialsK: 1.10, note: "Высокая логистика стройматериалов" },
  { id: "kaliningrad",    name: "Калининград",             worksK: 0.80, materialsK: 1.00 },
  { id: "regions_other",  name: "Регионы (среднее)",       worksK: 0.65, materialsK: 0.88, note: "Средняя оценка по малым городам" },
];

export function getRegion(id: string): Region {
  return REGIONS.find((r) => r.id === id) || REGIONS[0];
}

export const DEFAULT_REGION_ID = "moscow";
