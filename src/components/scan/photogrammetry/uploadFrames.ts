import { apiFetch } from "@/lib/api";
import { PHOTO_URL, toBase64 } from "./constants";

/**
 * Загружает кадры на сервер пачками по 5, конвертирует blob → base64,
 * отчитывается о прогрессе через onProgress(uploadedCount).
 * Возвращает количество неудачных загрузок.
 */
export async function uploadFrames(
  scanId: number | string,
  frames: Blob[],
  onProgress: (uploaded: number) => void,
): Promise<{ failed: number }> {
  let failed = 0;
  const BATCH = 5;
  for (let i = 0; i < frames.length; i += BATCH) {
    const batch = frames.slice(i, i + BATCH);
    const b64s = await Promise.all(batch.map((b) => toBase64(b)));
    for (let j = 0; j < b64s.length; j++) {
      try {
        const { status, data } = await apiFetch(`${PHOTO_URL}?action=frame`, {
          method: "POST",
          body: JSON.stringify({ scan_id: scanId, frame: b64s[j], frame_index: i + j }),
        });
        if (status >= 400) {
          failed += 1;
          console.warn("Frame upload failed:", status, data);
        }
      } catch (e) {
        failed += 1;
        console.warn("Frame upload exception:", e);
      }
      onProgress(i + j + 1);
    }
  }
  return { failed };
}
