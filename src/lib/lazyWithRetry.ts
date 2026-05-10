import { lazy, type ComponentType } from "react";

/**
 * Обёртка над React.lazy, устойчивая к ошибкам динамического импорта чанков
 * после деплоя новой версии.
 *
 * Что решает:
 *  - "Failed to fetch dynamically imported module"
 *  - "Importing a module script failed"
 *  - "error loading dynamically imported module"
 *
 * Логика:
 *  1) Делаем 1 ретрай через 350 мс (на случай флапа сети).
 *  2) Если ретрай не помог — один раз перезагружаем страницу
 *     (флаг хранится в sessionStorage, чтобы не уйти в цикл).
 */
const RELOAD_FLAG = "lazy-retry-reloaded";

function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Loading chunk \d+ failed/i.test(msg) ||
    /ChunkLoadError/i.test(msg)
  );
}

export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      // Успех — сбрасываем флаг, чтобы при следующем деплое снова можно было перезагрузиться
      try {
        sessionStorage.removeItem(RELOAD_FLAG);
      } catch {
        // ignore
      }
      return mod;
    } catch (err) {
      if (!isChunkLoadError(err)) throw err;

      // 1) Один ретрай
      try {
        await new Promise((r) => setTimeout(r, 350));
        return await factory();
      } catch (err2) {
        if (!isChunkLoadError(err2)) throw err2;

        // 2) Hard reload (один раз за сессию)
        let alreadyReloaded = false;
        try {
          alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG) === "1";
          if (!alreadyReloaded) sessionStorage.setItem(RELOAD_FLAG, "1");
        } catch {
          // sessionStorage недоступен — просто пропускаем
        }
        if (!alreadyReloaded && typeof window !== "undefined") {
          window.location.reload();
          // Возвращаем «вечный» промис, чтобы Suspense не успел обновить UI до перезагрузки
          return await new Promise<{ default: T }>(() => {});
        }
        throw err2;
      }
    }
  });
}

export default lazyWithRetry;
