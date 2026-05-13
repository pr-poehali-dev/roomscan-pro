import { Card, CardContent } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

/**
 * Карточка-инфоблок «Расчёт по вашей комнате».
 * Если есть последний скан — показываем периметр / площадь стен / без проёмов.
 * Если скана нет — призываем отсканировать.
 */
interface Props {
  geometry: { perimeter: number; wallsArea: number; wallsAreaNet: number } | null;
  onScan: () => void;
}

export default function WallsCalcCard({ geometry, onScan }: Props) {
  if (!geometry) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/15 text-primary">
              <Icon name="ScanLine" size={20} />
            </div>
            <div>
              <p className="font-bold text-foreground">Отсканируйте комнату для точного расчёта</p>
              <p className="text-sm text-muted-foreground">
                Мы автоматически рассчитаем м² стен и сколько рулонов или банок краски потребуется.
              </p>
            </div>
          </div>
          <Button onClick={onScan} className="shrink-0">
            <Icon name="ScanLine" size={16} className="mr-2" />
            Сканировать комнату
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/15 text-primary">
            <Icon name="Ruler" size={20} />
          </div>
          <div>
            <p className="font-bold text-foreground">Расчёт по вашей комнате</p>
            <p className="text-sm text-muted-foreground">
              Стоимость и расход материалов рассчитаны автоматически из последнего скана.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Metric label="Периметр"      value={`${geometry.perimeter} м`} />
          <Metric label="Стены"         value={`${geometry.wallsArea} м²`} />
          <Metric label="Без проёмов"   value={`${geometry.wallsAreaNet} м²`} />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card border p-3">
      <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-1">
        {label}
      </div>
      <div className="text-lg font-black text-foreground">{value}</div>
    </div>
  );
}
