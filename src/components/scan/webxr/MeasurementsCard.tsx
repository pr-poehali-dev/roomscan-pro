import type { RoomMeasurement } from "./types";

/**
 * Карточка результата WebXR Depth: 4 значения (ширина/глубина/высота/площадь)
 * и количество собранных точек глубины.
 */
interface Props {
  measurement: RoomMeasurement;
  depthPointsCollected: number;
}

export default function MeasurementsCard({ measurement, depthPointsCollected }: Props) {
  const items = [
    { label: "Ширина", value: `${measurement.width} м` },
    { label: "Глубина", value: `${measurement.depth} м` },
    { label: "Высота", value: `${measurement.height} м` },
    { label: "Площадь", value: `${measurement.area} м²` },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-fade-in">
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
        Результаты WebXR Depth
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((m) => (
          <div key={m.label} className="bg-secondary rounded-lg p-3 text-center">
            <p className="text-xl font-black text-primary font-mono">{m.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3 font-mono">
        Точек глубины собрано: {depthPointsCollected.toLocaleString()}
      </p>
    </div>
  );
}
