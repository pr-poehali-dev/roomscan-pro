/**
 * Снимает один JPEG-кадр из <video> в Blob 640×480.
 * Возвращает null, если видео ещё не готово (readyState < 2) или нет 2D-контекста.
 */
export function captureFrameBlob(video: HTMLVideoElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (video.readyState < 2 || video.videoWidth === 0) {
      resolve(null);
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve(null);
      return;
    }
    ctx.drawImage(video, 0, 0, 640, 480);
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.75);
  });
}
