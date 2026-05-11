import { useState, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { notify } from "@/lib/notify";
import { convertToGLB, type ConvertProgress } from "@/lib/modelConverter";
import { saveUserModel, listUserModels, removeUserModel, type UserModel } from "@/lib/userModelsStore";
import { apiFetch, getToken, USER_MODELS_URL } from "@/lib/api";
import {
  SUPPORTED_FORMATS,
  formatBytes,
  type ConvertStatus,
  type ConvertResult,
} from "./converter/types";
import ConvertDropzone from "./converter/ConvertDropzone";
import ConvertResultCard from "./converter/ConvertResultCard";
import ConverterLibraryTab from "./converter/ConverterLibraryTab";
import ConverterSourcesTab from "./converter/ConverterSourcesTab";

export default function ConverterSection() {
  const [status, setStatus] = useState<ConvertStatus>("idle");
  const [progress, setProgress] = useState<ConvertProgress>({ stage: "idle", percent: 0 });
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [error, setError] = useState<string>("");
  const [drag, setDrag] = useState(false);
  const [models, setModels] = useState<UserModel[]>(() => listUserModels());
  const [savingToCloud, setSavingToCloud] = useState(false);

  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url);
      if (result?.usdzUrl) URL.revokeObjectURL(result.usdzUrl);
    };
  }, [result]);

  const handleFile = useCallback(async (file: File) => {
    setError("");
    setResult(null);

    const ext = (file.name.split(".").pop() || "").toLowerCase();

    if (ext === "max") {
      setError(
        "Файлы .max (3ds Max) — закрытый формат Autodesk и не конвертируются в браузере. Откройте файл в 3ds Max → File → Export → выберите FBX или OBJ → загрузите получившийся файл сюда.",
      );
      setStatus("error");
      return;
    }

    if (!SUPPORTED_FORMATS.some((f) => f.ext === ext)) {
      setError(`Формат .${ext} не поддерживается. Используйте: ${SUPPORTED_FORMATS.map((f) => f.ext).join(", ")}.`);
      setStatus("error");
      return;
    }

    if (file.size > 200 * 1024 * 1024) {
      setError("Файл слишком большой. Максимум 200 МБ.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      const { blob, triangles, usdzBlob } = await convertToGLB(file, ext, (p) => {
        setProgress(p);
        if (p.stage === "loading") setStatus("loading");
        else if (p.stage === "exporting") setStatus("exporting");
        else if (p.stage === "usdz") setStatus("usdz");
        else setStatus("converting");
      });

      const url = URL.createObjectURL(blob);
      const usdzUrl = usdzBlob ? URL.createObjectURL(usdzBlob) : null;
      setResult({
        blob,
        url,
        sizeIn: file.size,
        sizeOut: blob.size,
        sourceName: file.name,
        sourceExt: ext,
        triangles,
        usdzBlob,
        usdzUrl,
        usdzSize: usdzBlob?.size || 0,
      });
      setStatus("done");
      notify.success(
        "Готово",
        usdzBlob
          ? `Сконвертировано в GLB (${formatBytes(blob.size)}) + USDZ для iOS (${formatBytes(usdzBlob.size)})`
          : `Файл сконвертирован в GLB (${formatBytes(blob.size)})`,
      );
    } catch (err) {
      console.error("Convert error:", err);
      const message = err instanceof Error ? err.message : "Не удалось сконвертировать файл. Проверьте, что он корректный.";
      setError(message);
      setStatus("error");
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const downloadGLB = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url;
    const base = result.sourceName.replace(/\.[^.]+$/, "");
    a.download = `${base}.glb`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadUSDZ = () => {
    if (!result?.usdzUrl) return;
    const a = document.createElement("a");
    a.href = result.usdzUrl;
    const base = result.sourceName.replace(/\.[^.]+$/, "");
    a.download = `${base}.usdz`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const blobToDataURL = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(new Error("Не удалось прочитать файл"));
      r.readAsDataURL(blob);
    });

  const saveLocal = async () => {
    if (!result) return;
    const dataUrl = await blobToDataURL(result.blob);
    const usdzDataUrl = result.usdzBlob ? await blobToDataURL(result.usdzBlob) : undefined;
    const base = result.sourceName.replace(/\.[^.]+$/, "");
    const model = saveUserModel({
      name: base,
      sourceExt: result.sourceExt,
      sizeOut: result.sizeOut,
      dataUrl,
      usdzDataUrl,
      triangles: result.triangles,
    });
    setModels(listUserModels());
    notify.success(
      "Сохранено в библиотеку",
      usdzDataUrl ? `«${model.name}» — GLB + USDZ для iOS AR` : `«${model.name}» добавлен в локальную коллекцию`,
    );
  };

  const removeLocal = (id: string) => {
    removeUserModel(id);
    setModels(listUserModels());
    notify.info("Модель удалена");
  };

  const saveCloud = async () => {
    if (!result) return;
    const token = getToken();
    if (!token) {
      notify.warn("Войдите в аккаунт", "Облачная библиотека доступна после авторизации");
      return;
    }
    setSavingToCloud(true);
    try {
      const blobToBase64 = (blob: Blob): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const idx = dataUrl.indexOf(",");
            resolve(idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl);
          };
          reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
          reader.readAsDataURL(blob);
        });

      const glbBase64 = await blobToBase64(result.blob);
      const usdzBase64 = result.usdzBlob ? await blobToBase64(result.usdzBlob) : null;

      const name = result.sourceName.replace(/\.[^.]+$/, "");
      const { status: code, data } = await apiFetch(USER_MODELS_URL, {
        method: "POST",
        body: JSON.stringify({
          name,
          sourceExt: result.sourceExt,
          triangles: result.triangles,
          glbBase64,
          usdzBase64,
        }),
      });

      if (code === 200) {
        notify.success("Сохранено в облако", "Модель доступна на всех ваших устройствах");
      } else {
        const errMsg = (typeof data === "object" && data && "error" in data) ? String((data as { error: string }).error) : "Ошибка сохранения";
        notify.error("Не удалось сохранить", errMsg);
      }
    } catch (err) {
      notify.error("Ошибка", err instanceof Error ? err.message : "Не удалось загрузить");
    } finally {
      setSavingToCloud(false);
    }
  };

  const isWorking = status === "loading" || status === "converting" || status === "exporting" || status === "usdz";
  const hasToken = !!getToken();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Конвертер 3D-моделей</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          Превращайте модели с 3ddd.ru, Sketchfab, Free3D и других источников в формат <strong>GLB</strong> для веба и AR.
          Поддерживаются FBX, OBJ, DAE, STL, PLY, 3DS, glTF. Вся конвертация идёт прямо в браузере — файл не покидает ваше устройство.
        </p>
      </header>

      <Tabs defaultValue="convert" className="w-full">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="convert">
            <Icon name="Sparkles" size={14} className="mr-1.5" />
            Конвертер
          </TabsTrigger>
          <TabsTrigger value="library">
            <Icon name="Library" size={14} className="mr-1.5" />
            Моя библиотека
            {models.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-xs">{models.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sources">
            <Icon name="Compass" size={14} className="mr-1.5" />
            Где брать модели
          </TabsTrigger>
        </TabsList>

        <TabsContent value="convert" className="space-y-5 mt-5">
          <Card className="p-6">
            <ConvertDropzone
              status={status}
              progress={progress}
              drag={drag}
              isWorking={isWorking}
              setDrag={setDrag}
              onDrop={onDrop}
              onSelect={onSelect}
            />
          </Card>

          {status === "error" && error && (
            <Card className="p-4 border-destructive/30 bg-destructive/5">
              <div className="flex items-start gap-3">
                <Icon name="AlertTriangle" size={20} className="text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Не получилось</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setStatus("idle"); setError(""); }}>
                  <Icon name="X" size={14} />
                </Button>
              </div>
            </Card>
          )}

          {status === "done" && result && (
            <ConvertResultCard
              result={result}
              hasToken={hasToken}
              savingToCloud={savingToCloud}
              downloadGLB={downloadGLB}
              downloadUSDZ={downloadUSDZ}
              saveLocal={saveLocal}
              saveCloud={saveCloud}
              onReset={() => { setStatus("idle"); setResult(null); }}
            />
          )}

          <Card className="p-5 bg-secondary/40 border-border/60">
            <div className="flex items-start gap-3">
              <Icon name="Info" size={18} className="text-primary shrink-0 mt-0.5" />
              <div className="text-sm space-y-2">
                <p className="font-semibold text-foreground">Про формат .max от 3ds Max</p>
                <p className="text-muted-foreground leading-relaxed">
                  Файлы <code className="font-mono text-foreground bg-background px-1.5 py-0.5 rounded text-xs">.max</code> —
                  это закрытый бинарный формат Autodesk, который читает только сам 3ds Max. Конвертировать его в браузере или
                  без лицензии нельзя. На странице модели в <a href="https://3ddd.ru/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">3ddd.ru</a>
                  {" "}обычно есть архив с экспортом в FBX или OBJ — он подходит для нашего конвертера.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="library" className="mt-5">
          <ConverterLibraryTab models={models} removeLocal={removeLocal} />
        </TabsContent>

        <TabsContent value="sources" className="mt-5">
          <ConverterSourcesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}