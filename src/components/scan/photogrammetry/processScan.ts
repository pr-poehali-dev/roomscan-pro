import { apiFetch } from "@/lib/api";
import { PHOTO_URL } from "./constants";
import type { Point3D } from "../PointCloud3D";
import type { ScanResult } from "./types";

/**
 * Запускает серверную обработку и возвращает либо result, либо текст ошибки.
 */
export async function processScan(
  scanId: number | string,
): Promise<{ result: ScanResult } | { error: string }> {
  try {
    const r = await apiFetch(`${PHOTO_URL}?action=process`, {
      method: "POST",
      body: JSON.stringify({ scan_id: scanId }),
    });
    const data: { result?: ScanResult; error?: string } = r.data;
    if (r.status >= 400) {
      return { error: data.error || `Сервер вернул статус ${r.status}` };
    }
    if (data.result) {
      return { result: data.result };
    }
    return { error: data.error || "Ошибка обработки" };
  } catch (e) {
    return { error: "Сервер обработки не ответил. " + (e instanceof Error ? e.message : "") };
  }
}

/**
 * Тянет облако точек из БД и возвращает первые 3000 точек как Point3D[].
 */
export async function fetchPointCloud(
  scanId: number | string,
  roomHeight: number,
): Promise<Point3D[]> {
  const statusRes = await apiFetch(`${PHOTO_URL}?action=status&scan_id=${scanId}`);
  const cloudRaw: number[][] = statusRes.data?.scan?.point_cloud?.points ?? [];
  if (cloudRaw.length === 0) return [];
  return cloudRaw.slice(0, 3000).map(([x, y, z]) => ({
    x,
    y,
    z,
    intensity: y / (roomHeight || 2.7),
  }));
}
