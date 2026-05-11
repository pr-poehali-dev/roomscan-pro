/**
 * Запрашивает камеру и возвращает MediaStream, либо строку с понятной ошибкой.
 * Делает фолбек на «любую» камеру при OverconstrainedError.
 */
export async function requestCameraStream(
  inIframe: boolean,
): Promise<{ stream: MediaStream } | { error: string }> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    return { stream };
  } catch (e: unknown) {
    const err = e as { name?: string; message?: string };

    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      return {
        error: inIframe
          ? "Доступ к камере запрещён внутри окна предпросмотра. " +
            "Откройте сайт в отдельной вкладке (кнопка «Открыть» вверху редактора или прямая ссылка вашего проекта), " +
            "и тогда браузер спросит разрешение на камеру."
          : "Доступ к камере запрещён. " +
            "Нажмите на иконку замка/камеры в адресной строке → разрешите камеру → перезагрузите страницу.",
      };
    }

    if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      return { error: "Камера не найдена. Проверьте, что устройство имеет камеру." };
    }

    if (err.name === "NotReadableError") {
      return {
        error:
          "Камера занята другим приложением. Закройте Skype/Zoom/другие камеры и попробуйте снова.",
      };
    }

    if (err.name === "OverconstrainedError") {
      // фолбек на любую камеру
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        return { stream };
      } catch {
        return { error: "Не удалось настроить камеру с нужным разрешением." };
      }
    }

    return { error: `Ошибка камеры: ${err.message || err.name || "неизвестная"}` };
  }
}
