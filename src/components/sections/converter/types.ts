/**
 * Общие типы, константы и утилиты для секции конвертера 3D-моделей.
 * Используются внутри подкомпонентов ConverterSection.
 */

export type ConvertStatus = "idle" | "loading" | "converting" | "exporting" | "usdz" | "done" | "error";

export interface ConvertResult {
  blob: Blob;
  url: string;
  sizeIn: number;
  sizeOut: number;
  sourceName: string;
  sourceExt: string;
  triangles?: number;
  usdzBlob: Blob | null;
  usdzUrl: string | null;
  usdzSize: number;
}

export const SUPPORTED_FORMATS = [
  { ext: "fbx", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  { ext: "obj", color: "bg-green-500/10 text-green-600 border-green-500/30" },
  { ext: "dae", color: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
  { ext: "stl", color: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
  { ext: "ply", color: "bg-pink-500/10 text-pink-600 border-pink-500/30" },
  { ext: "3ds", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
  { ext: "gltf", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  { ext: "glb", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
];

export const SOURCES = [
  {
    name: "3ddd.ru",
    desc: "Миллион 3D-моделей: мебель, свет, декор. Формат 3ds Max + экспорт FBX/OBJ.",
    url: "https://3ddd.ru/",
    icon: "Database",
    free: "частично",
  },
  {
    name: "Sketchfab",
    desc: "Бесплатные и платные модели в GLB/GLTF — конвертация не нужна.",
    url: "https://sketchfab.com/",
    icon: "Box",
    free: "много",
  },
  {
    name: "Free3D",
    desc: "Бесплатные FBX/OBJ-модели мебели и декора.",
    url: "https://free3d.com/",
    icon: "Gift",
    free: "много",
  },
  {
    name: "Polycam",
    desc: "Готовые 3D-сканы реальных объектов в формате GLB.",
    url: "https://poly.cam/",
    icon: "ScanLine",
    free: "много",
  },
  {
    name: "Poly Haven",
    desc: "CC0 модели и HDRI для архвиза. Полностью бесплатные.",
    url: "https://polyhaven.com/",
    icon: "Mountain",
    free: "всё",
  },
];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(2)} МБ`;
}
