/**
 * Константы и утилиты для PhotogrammetryScanner.
 * Извлечены без изменения логики из исходного PhotogrammetryScanner.tsx.
 */

export const PHOTO_URL = "https://functions.poehali.dev/aa224ee6-cbee-45f1-bcf6-92dbb5ecd974";

export const TIPS = [
  "Медленно обводите все стены",
  "Снимайте углы помещения",
  "Держите телефон вертикально",
  "Пройдитесь по периметру комнаты",
  "Наклоните телефон к полу и потолку",
];

export function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
