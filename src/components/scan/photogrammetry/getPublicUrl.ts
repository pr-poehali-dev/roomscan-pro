/**
 * Возвращает «публичный» URL текущего проекта — тот, по которому
 * сайт открывается в обычном браузере (с рабочей камерой), а не
 * в iframe-окне предпросмотра редактора.
 *
 * Алгоритм:
 *  1) Если в текущем `window.location.href` есть префикс `preview--` —
 *     убираем его (это типовой адрес poehali-предпросмотра).
 *  2) Если страница встроена в iframe и `document.referrer` указывает
 *     на превью или на хост проекта — берём его (без preview-- префикса).
 *  3) Если ничего из этого не подошло — возвращаем текущий URL.
 *
 * К URL добавляется хэш `#scan`, чтобы пользователь сразу попал в раздел
 * сканирования. При повторном вызове хэш не дублируется.
 */
export function getPublicUrl(): string {
  if (typeof window === "undefined") return "";

  const stripPreview = (u: string) => u.replace(/^(https?:\/\/)preview--/, "$1");
  const ensureHash = (u: string) => (u.includes("#") ? u : u + "#scan");

  const here = window.location.href;
  const stripped = stripPreview(here);

  // Если текущий URL уже корректный (не preview-- и не локальный) — используем его.
  if (stripped !== here) {
    return ensureHash(stripped);
  }

  // Пробуем взять из referrer — родитель iframe (если доступен).
  try {
    const ref = document.referrer;
    if (ref && /preview--/.test(ref)) {
      const refStripped = stripPreview(ref);
      // referrer указывает только на корень — добавим путь текущей страницы
      const url = new URL(refStripped);
      url.pathname = window.location.pathname;
      url.search = window.location.search;
      return ensureHash(url.toString());
    }
  } catch {
    // ignore
  }

  return ensureHash(here);
}
