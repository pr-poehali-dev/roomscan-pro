/**
 * Маленькая карточка-метрика (Было / GLB / USDZ / Полигонов).
 * Используется внутри ConvertResultCard.
 */
export default function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/50 rounded-lg px-3 py-2 border border-border/50">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="text-sm font-mono font-bold text-foreground mt-0.5">{value}</p>
    </div>
  );
}
