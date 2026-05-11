import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ModelViewer from "@/components/3d/ModelViewer";
import { type UserModel } from "@/lib/userModelsStore";
import { formatBytes } from "./types";

/**
 * Таб «Моя библиотека» — список сохранённых пользовательских моделей.
 * Удаление и скачивание идут через колбэк/инлайн-операцию с dataUrl, точно как было.
 */
interface Props {
  models: UserModel[];
  removeLocal: (id: string) => void;
}

export default function ConverterLibraryTab({ models, removeLocal }: Props) {
  if (models.length === 0) {
    return (
      <Card className="p-10 text-center">
        <Icon name="Library" size={40} className="mx-auto text-muted-foreground mb-3" />
        <p className="font-semibold text-foreground">В библиотеке пока пусто</p>
        <p className="text-sm text-muted-foreground mt-1">
          Сконвертируйте модель и нажмите «В мою библиотеку», чтобы она появилась здесь.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {models.map((m) => (
        <Card key={m.id} className="overflow-hidden">
          <div className="aspect-video bg-secondary/50 border-b border-border">
            <ModelViewer src={m.dataUrl} iosSrc={m.usdzDataUrl} alt={m.name} />
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-foreground truncate flex-1">{m.name}</p>
              {m.usdzDataUrl && (
                <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] px-1.5 py-0 shrink-0">
                  iOS AR
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              .{m.sourceExt} → .glb · {formatBytes(m.sizeOut)}
              {m.triangles !== undefined && ` · ${m.triangles.toLocaleString("ru-RU")} полигонов`}
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = m.dataUrl;
                  a.download = `${m.name}.glb`;
                  a.click();
                }}
              >
                <Icon name="Download" size={12} className="mr-1" />
                GLB
              </Button>
              {m.usdzDataUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = m.usdzDataUrl!;
                    a.download = `${m.name}.usdz`;
                    a.click();
                  }}
                >
                  <Icon name="Smartphone" size={12} className="mr-1" />
                  USDZ
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => removeLocal(m.id)}>
                <Icon name="Trash2" size={12} />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
