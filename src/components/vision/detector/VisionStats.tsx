import { ROOM_TYPE_LABELS, STYLE_LABELS, type DetectionResponse } from "./constants";

/**
 * Сетка из 4 информационных плиток (количество, тип комнаты, стиль, время).
 */
interface Props {
  result: DetectionResponse;
  excludedCount: number;
}

function InfoStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card-base p-2.5">
      <p className="t-meta">{label}</p>
      <p className="text-sm font-black text-foreground mt-0.5 truncate">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

export default function VisionStats({ result, excludedCount }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <InfoStat
        label="Объектов"
        value={String(result.objects.length - excludedCount)}
        hint={excludedCount > 0 ? `(${excludedCount} исключено)` : ""}
      />
      <InfoStat
        label="Тип комнаты"
        value={ROOM_TYPE_LABELS[result.room_type] ?? result.room_type}
      />
      <InfoStat
        label="Стиль"
        value={STYLE_LABELS[result.dominant_style] ?? result.dominant_style}
      />
      <InfoStat
        label="Время"
        value={result.latency_ms ? `${(result.latency_ms / 1000).toFixed(1)} с` : "—"}
      />
    </div>
  );
}
