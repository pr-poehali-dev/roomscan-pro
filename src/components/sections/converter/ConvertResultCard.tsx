import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ModelViewer from "@/components/3d/ModelViewer";
import Stat from "./Stat";
import { formatBytes, type ConvertResult } from "./types";

/**
 * Карточка с результатом конвертации: метрики, превью GLB/USDZ, кнопки скачать/сохранить.
 * Вся бизнес-логика (download/save) живёт в родителе, сюда приходит готовый объект result и колбэки.
 */
interface Props {
  result: ConvertResult;
  hasToken: boolean;
  savingToCloud: boolean;
  downloadGLB: () => void;
  downloadUSDZ: () => void;
  saveLocal: () => void;
  saveCloud: () => void;
  onReset: () => void;
}

export default function ConvertResultCard({
  result,
  hasToken,
  savingToCloud,
  downloadGLB,
  downloadUSDZ,
  saveLocal,
  saveCloud,
  onReset,
}: Props) {
  return (
    <Card className="p-5 border-primary/30">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Icon name="CheckCircle2" size={18} className="text-primary" />
            <p className="font-bold text-foreground">Готово</p>
          </div>
          <p className="text-xs text-muted-foreground font-mono break-all">{result.sourceName}</p>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          <Badge variant="outline" className="font-mono">.{result.sourceExt} → .glb</Badge>
          {result.usdzBlob && (
            <Badge className="font-mono bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">
              + .usdz (iOS AR)
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Было" value={formatBytes(result.sizeIn)} />
        <Stat label="GLB" value={formatBytes(result.sizeOut)} />
        <Stat
          label={result.usdzBlob ? "USDZ" : "Сжатие"}
          value={
            result.usdzBlob
              ? formatBytes(result.usdzSize)
              : `${Math.round((1 - result.sizeOut / result.sizeIn) * 100)}%`
          }
        />
        {result.triangles !== undefined && (
          <Stat label="Полигонов" value={result.triangles.toLocaleString("ru-RU")} />
        )}
      </div>

      <div className="bg-secondary/50 rounded-lg overflow-hidden border border-border mb-4 aspect-video">
        <ModelViewer
          src={result.url}
          iosSrc={result.usdzUrl || undefined}
          alt={result.sourceName}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={downloadGLB}>
          <Icon name="Download" size={14} className="mr-1.5" />
          Скачать GLB
        </Button>
        {result.usdzBlob && result.usdzUrl && (
          <Button variant="outline" onClick={downloadUSDZ}>
            <Icon name="Smartphone" size={14} className="mr-1.5" />
            Скачать USDZ (iOS AR)
          </Button>
        )}
        <Button variant="secondary" onClick={saveLocal}>
          <Icon name="Save" size={14} className="mr-1.5" />
          В мою библиотеку
        </Button>
        {hasToken && (
          <Button variant="secondary" onClick={saveCloud} disabled={savingToCloud}>
            <Icon
              name={savingToCloud ? "Loader2" : "CloudUpload"}
              size={14}
              className={`mr-1.5 ${savingToCloud ? "animate-spin" : ""}`}
            />
            {savingToCloud ? "Загружаем…" : "В облако"}
          </Button>
        )}
        <Button variant="ghost" onClick={onReset}>
          <Icon name="RotateCcw" size={14} className="mr-1.5" />
          Сконвертировать ещё
        </Button>
      </div>

      {result.usdzBlob && (
        <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-muted-foreground flex items-start gap-2">
          <Icon name="Sparkles" size={14} className="text-primary shrink-0 mt-0.5" />
          <p>
            Готовый USDZ-вариант подключён к превью. На iPhone в Safari нажмите кнопку AR в правом верхнем углу превью —
            модель появится в комнате через Quick Look. На Android запустится Scene Viewer с GLB.
          </p>
        </div>
      )}
    </Card>
  );
}
