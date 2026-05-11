/**
 * Pre-flight проверки перед запросом камеры: iframe/permission policy,
 * HTTPS, поддержка getUserMedia, статус разрешения.
 *
 * Возвращает { ok: true } или { ok: false, error: "сообщение" } —
 * вызывающий код сам решает, как показать ошибку.
 */
export type GuardResult = { ok: true } | { ok: false, error: string };

export async function runCameraGuards(): Promise<GuardResult> {
  // 0: iframe + Permissions Policy
  const inIframe = typeof window !== "undefined" && window.self !== window.top;
  let permissionPolicyBlocked = false;
  try {
    if (inIframe && document.featurePolicy?.allowsFeature) {
      permissionPolicyBlocked = !document.featurePolicy.allowsFeature("camera");
    }
  } catch {
    /* featurePolicy не поддерживается — игнорируем */
  }

  if (permissionPolicyBlocked) {
    const directUrl = window.location.href.replace(/^https?:\/\/preview--/, "https://");
    return {
      ok: false,
      error:
        `Камера заблокирована политикой разрешений iframe предпросмотра. ` +
        `Откройте сайт напрямую (не в редакторе): ${directUrl}`,
    };
  }

  // 1: HTTPS обязателен для getUserMedia
  if (
    typeof window !== "undefined" &&
    window.location.protocol !== "https:" &&
    window.location.hostname !== "localhost"
  ) {
    return {
      ok: false,
      error: "Камера работает только по HTTPS. Откройте сайт по защищённому соединению.",
    };
  }

  // 2: поддержка API
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      ok: false,
      error: "Браузер не поддерживает доступ к камере. Используйте Chrome 90+ или Safari 14+.",
    };
  }

  // 3: статус разрешения
  try {
    if (navigator.permissions?.query) {
      const status = await navigator.permissions.query({ name: "camera" as PermissionName });
      if (status.state === "denied") {
        return {
          ok: false,
          error:
            "Камера заблокирована для этого сайта. " +
            "Нажмите на иконку замка слева от адреса → Разрешения сайта → Камера → Разрешить, " +
            "затем перезагрузите страницу.",
        };
      }
    }
  } catch {
    /* permissions API не поддерживается — пропускаем */
  }

  return { ok: true };
}
