import { useState, useRef, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { notify } from "@/lib/notify";
import { convertToGLB, type ConvertProgress } from "@/lib/modelConverter";
import { saveUserModel, listUserModels, removeUserModel, type UserModel } from "@/lib/userModelsStore";
import ModelViewer from "@/components/3d/ModelViewer";
import { apiFetch, getToken, USER_MODELS_URL } from "@/lib/api";

type ConvertStatus = "idle" | "loading" | "converting" | "exporting" | "done" | "error";

interface ConvertResult {
  blob: Blob;
  url: string;
  sizeIn: number;
  sizeOut: number;
  sourceName: string;
  sourceExt: string;
  triangles?: number;
}

const SUPPORTED_FORMATS = [
  { ext: "fbx", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  { ext: "obj", color: "bg-green-500/10 text-green-600 border-green-500/30" },
  { ext: "dae", color: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
  { ext: "stl", color: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
  { ext: "ply", color: "bg-pink-500/10 text-pink-600 border-pink-500/30" },
  { ext: "3ds", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
  { ext: "gltf", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  { ext: "glb", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
];

const SOURCES = [
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(2)} МБ`;
}

export default function ConverterSection() {
  const [status, setStatus] = useState<ConvertStatus>("idle");
  const [progress, setProgress] = useState<ConvertProgress>({ stage: "idle", percent: 0 });
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [error, setError] = useState<string>("");
  const [drag, setDrag] = useState(false);
  const [models, setModels] = useState<UserModel[]>(() => listUserModels());
  const [savingToCloud, setSavingToCloud] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url);
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
      const { blob, triangles } = await convertToGLB(file, ext, (p) => {
        setProgress(p);
        if (p.stage === "loading") setStatus("loading");
        else if (p.stage === "exporting") setStatus("exporting");
        else setStatus("converting");
      });

      const url = URL.createObjectURL(blob);
      setResult({
        blob,
        url,
        sizeIn: file.size,
        sizeOut: blob.size,
        sourceName: file.name,
        sourceExt: ext,
        triangles,
      });
      setStatus("done");
      notify.success("Готово", `Файл сконвертирован в GLB (${formatBytes(blob.size)})`);
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

  const saveLocal = () => {
    if (!result) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base = result.sourceName.replace(/\.[^.]+$/, "");
      const model = saveUserModel({
        name: base,
        sourceExt: result.sourceExt,
        sizeOut: result.sizeOut,
        dataUrl,
        triangles: result.triangles,
      });
      setModels(listUserModels());
      notify.success("Сохранено в библиотеку", `«${model.name}» добавлен в локальную коллекцию`);
    };
    reader.readAsDataURL(result.blob);
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
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const idx = dataUrl.indexOf(",");
          resolve(idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl);
        };
        reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
        reader.readAsDataURL(result.blob);
      });

      const name = result.sourceName.replace(/\.[^.]+$/, "");
      const { status: code, data } = await apiFetch(USER_MODELS_URL, {
        method: "POST",
        body: JSON.stringify({
          name,
          sourceExt: result.sourceExt,
          triangles: result.triangles,
          glbBase64: base64,
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

  const isWorking = status === "loading" || status === "converting" || status === "exporting";
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
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              onClick={() => !isWorking && inputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
                drag
                  ? "border-primary bg-primary/5"
                  : isWorking
                  ? "border-border bg-secondary/30 cursor-wait"
                  : "border-border hover:border-primary hover:bg-primary/[0.02]"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".fbx,.obj,.dae,.stl,.ply,.3ds,.gltf,.glb,.max"
                onChange={onSelect}
                className="hidden"
                disabled={isWorking}
              />

              {isWorking ? (
                <div className="space-y-4">
                  <Icon name="Loader2" size={48} className="mx-auto text-primary animate-spin" />
                  <div>
                    <p className="font-semibold text-foreground">
                      {status === "loading" && "Загружаем файл…"}
                      {status === "converting" && "Конвертируем геометрию…"}
                      {status === "exporting" && "Упаковываем в GLB…"}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">{progress.percent}%</p>
                  </div>
                  <div className="max-w-md mx-auto h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Icon name="UploadCloud" size={32} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-lg">Перетащите 3D-файл сюда</p>
                    <p className="text-sm text-muted-foreground mt-1">или нажмите, чтобы выбрать</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-center pt-2">
                    {SUPPORTED_FORMATS.map((f) => (
                      <span
                        key={f.ext}
                        className={`text-xs font-mono px-2 py-0.5 rounded border ${f.color}`}
                      >
                        .{f.ext}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">До 200 МБ • Конвертация в браузере • Файл не уходит на сервер</p>
                </div>
              )}
            </div>
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
            <Card className="p-5 border-primary/30">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="CheckCircle2" size={18} className="text-primary" />
                    <p className="font-bold text-foreground">Готово</p>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono break-all">{result.sourceName}</p>
                </div>
                <Badge variant="outline" className="font-mono">.{result.sourceExt} → .glb</Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <Stat label="Было" value={formatBytes(result.sizeIn)} />
                <Stat label="Стало" value={formatBytes(result.sizeOut)} />
                <Stat
                  label="Сжатие"
                  value={`${Math.round((1 - result.sizeOut / result.sizeIn) * 100)}%`}
                />
                {result.triangles !== undefined && (
                  <Stat label="Полигонов" value={result.triangles.toLocaleString("ru-RU")} />
                )}
              </div>

              <div className="bg-secondary/50 rounded-lg overflow-hidden border border-border mb-4 aspect-video">
                <ModelViewer src={result.url} alt={result.sourceName} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={downloadGLB}>
                  <Icon name="Download" size={14} className="mr-1.5" />
                  Скачать GLB
                </Button>
                <Button variant="secondary" onClick={saveLocal}>
                  <Icon name="Save" size={14} className="mr-1.5" />
                  В мою библиотеку
                </Button>
                {hasToken && (
                  <Button variant="secondary" onClick={saveCloud} disabled={savingToCloud}>
                    <Icon name={savingToCloud ? "Loader2" : "CloudUpload"} size={14} className={`mr-1.5 ${savingToCloud ? "animate-spin" : ""}`} />
                    {savingToCloud ? "Загружаем…" : "В облако"}
                  </Button>
                )}
                <Button variant="ghost" onClick={() => { setStatus("idle"); setResult(null); }}>
                  <Icon name="RotateCcw" size={14} className="mr-1.5" />
                  Сконвертировать ещё
                </Button>
              </div>
            </Card>
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
          {models.length === 0 ? (
            <Card className="p-10 text-center">
              <Icon name="Library" size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold text-foreground">В библиотеке пока пусто</p>
              <p className="text-sm text-muted-foreground mt-1">
                Сконвертируйте модель и нажмите «В мою библиотеку», чтобы она появилась здесь.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {models.map((m) => (
                <Card key={m.id} className="overflow-hidden">
                  <div className="aspect-video bg-secondary/50 border-b border-border">
                    <ModelViewer src={m.dataUrl} alt={m.name} />
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-foreground truncate">{m.name}</p>
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
                        Скачать
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removeLocal(m.id)}>
                        <Icon name="Trash2" size={12} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sources" className="mt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SOURCES.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <Card className="p-5 h-full hover:border-primary transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Icon name={s.icon} size={20} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                          {s.name}
                        </p>
                        <Icon name="ExternalLink" size={12} className="text-muted-foreground opacity-50" />
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                      <Badge variant="secondary" className="mt-2 text-xs">Бесплатно: {s.free}</Badge>
                    </div>
                  </div>
                </Card>
              </a>
            ))}
          </div>

          <Card className="p-5 mt-4 bg-secondary/40">
            <div className="flex items-start gap-3">
              <Icon name="Lightbulb" size={18} className="text-yellow-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground mb-1">Совет</p>
                <p className="text-muted-foreground leading-relaxed">
                  Если бренд (например, <a href="https://www.likelodka.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Like Lodka</a>,
                  {" "}<a href="https://sarosco.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Sarosco</a>
                  {" "}или <a href="https://svetholl.ru/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Svetholl</a>) не выкладывает 3D-модели
                  публично — напишите им в почту менеджеру: для архитекторов и дизайнеров большинство производителей даёт модели в FBX по запросу.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/50 rounded-lg px-3 py-2 border border-border/50">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="text-sm font-mono font-bold text-foreground mt-0.5">{value}</p>
    </div>
  );
}