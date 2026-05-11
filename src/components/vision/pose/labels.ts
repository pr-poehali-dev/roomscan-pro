/** Подписи для сторон комнаты и типов помещений на русском. */

export function sideRu(side: "north" | "east" | "south" | "west"): string {
  return side === "north"
    ? "северной"
    : side === "east"
      ? "восточной"
      : side === "south"
        ? "южной"
        : "западной";
}

export function labelRoomType(t: string): string {
  const map: Record<string, string> = {
    living: "гостиная",
    bedroom: "спальня",
    kitchen: "кухня",
    bathroom: "санузел",
    hall: "прихожая",
    office: "кабинет",
    child: "детская",
  };
  return map[t] ?? t;
}
