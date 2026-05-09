import { useEffect, useState } from "react";

/**
 * Состояние поддержки AR на устройстве:
 *  - "checking"     — проверка ещё идёт
 *  - "supported"    — WebXR + immersive-ar доступны
 *  - "unsupported"  — нет поддержки (десктоп / iOS / старые Android)
 */
export type ARSupport = "checking" | "supported" | "unsupported";

// Кэш на уровне модуля — проверка делается один раз за жизнь страницы.
// Все экземпляры хука используют один и тот же результат.
let cachedResult: ARSupport = "checking";
let pendingPromise: Promise<ARSupport> | null = null;
const subscribers = new Set<(s: ARSupport) => void>();

const notify = (value: ARSupport) => {
  cachedResult = value;
  subscribers.forEach((cb) => cb(value));
};

const detectAR = async (): Promise<ARSupport> => {
  if (typeof navigator === "undefined") return "unsupported";

  // @ts-expect-error — webxr api ещё не в стандартных типах TS
  const xr = navigator.xr;
  if (!xr || typeof xr.isSessionSupported !== "function") {
    return "unsupported";
  }

  try {
    // Защита от подвисшего isSessionSupported (iOS Safari, экзотические браузеры):
    // если ответа нет за 3 секунды — считаем что AR недоступен.
    const supportPromise = xr.isSessionSupported("immersive-ar") as Promise<boolean>;
    const timeoutPromise = new Promise<boolean>((resolve) =>
      setTimeout(() => resolve(false), 3000),
    );
    const supported = await Promise.race([supportPromise, timeoutPromise]);
    return supported ? "supported" : "unsupported";
  } catch {
    return "unsupported";
  }
};

const ensureChecked = (): Promise<ARSupport> => {
  if (cachedResult !== "checking") return Promise.resolve(cachedResult);
  if (pendingPromise) return pendingPromise;
  pendingPromise = detectAR().then((res) => {
    notify(res);
    return res;
  });
  return pendingPromise;
};

/**
 * Хук для определения поддержки AR на устройстве.
 *
 * Проверка выполняется один раз за всё время сессии — результат кэшируется
 * в модульной переменной. Повторные вызовы хука сразу получают готовое значение.
 *
 * Используй для условного рендера AR-кнопок:
 *   const ar = useARSupport();
 *   if (ar !== "supported") return null;
 */
export function useARSupport(): ARSupport {
  const [state, setState] = useState<ARSupport>(cachedResult);

  useEffect(() => {
    if (cachedResult !== "checking") {
      if (state !== cachedResult) setState(cachedResult);
      return;
    }
    subscribers.add(setState);
    void ensureChecked();
    return () => {
      subscribers.delete(setState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
