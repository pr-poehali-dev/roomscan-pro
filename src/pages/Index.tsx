import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/6ba50afb-d26a-4f86-ac87-cacbfb57c359";
const PROJECTS_URL = "https://functions.poehali.dev/648d87c2-171e-4729-b3e2-2cafa6015a40";

interface User { id: number; name: string; email: string; role: string; }
interface Project { id: number; name: string; rooms: number; area: string; status: string; updated: string; }

function getToken() { return localStorage.getItem("planscan_token") || ""; }
function setToken(t: string) { localStorage.setItem("planscan_token", t); }
function clearToken() { localStorage.removeItem("planscan_token"); }

async function apiFetch(url: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", "X-Auth-Token": token, ...(options.headers || {}) },
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

function AuthScreen({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const action = mode;
    const body: Record<string, string> = { email, password };
    if (action === "register") body.name = name;
    const { status, data } = await apiFetch(`${AUTH_URL}?action=${action}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (status === 200 && data.token) {
      setToken(data.token);
      onAuth(data.user);
    } else {
      setError(data.error || "Ошибка. Попробуйте снова");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center font-golos p-4"
      style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      }}
    >
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-sm flex items-center justify-center mx-auto mb-4">
            <Icon name="ScanLine" size={24} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">PlanScan</h1>
          <p className="text-muted-foreground text-sm font-mono mt-1">Профессиональная планировка</p>
        </div>

        <div className="bg-card border border-border rounded-sm p-6">
          <div className="flex gap-1 mb-6 bg-secondary rounded-sm p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 text-sm py-1.5 rounded-sm transition-colors font-semibold ${
                  mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "login" ? "Вход" : "Регистрация"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Имя</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Александр Петров"
                  className="w-full bg-secondary border border-border rounded-sm px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
            )}
            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-secondary border border-border rounded-sm px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Пароль</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                className="w-full bg-secondary border border-border rounded-sm px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                required minLength={6}
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-sm px-3 py-2 text-xs text-destructive flex items-center gap-2">
                <Icon name="AlertCircle" size={14} />
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="ArrowRight" size={16} />}
              {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Создать аккаунт"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4 font-mono">
          PlanScan v3.1 · LiDAR Platform
        </p>
      </div>
    </div>
  );
}

type Section =
  | "scan"
  | "projects"
  | "planner"
  | "catalog"
  | "calc"
  | "export"
  | "profile"
  | "help";

const navItems: { id: Section; label: string; icon: string }[] = [
  { id: "scan", label: "Сканирование", icon: "ScanLine" },
  { id: "projects", label: "Мои проекты", icon: "FolderOpen" },
  { id: "planner", label: "Планировщик", icon: "LayoutGrid" },
  { id: "catalog", label: "Каталог мебели", icon: "Sofa" },
  { id: "calc", label: "Расчёты", icon: "Calculator" },
  { id: "export", label: "Экспорт", icon: "Share2" },
  { id: "profile", label: "Профиль", icon: "User" },
  { id: "help", label: "Помощь", icon: "LifeBuoy" },
];

const projects = [
  { id: 1, name: "Квартира на Ленина, 12", rooms: 4, area: "87 м²", updated: "2 апр 2026", status: "active" },
  { id: 2, name: "Офис ТЦ Галактика", rooms: 8, area: "240 м²", updated: "1 апр 2026", status: "done" },
  { id: 3, name: "Загородный дом Кузнецовых", rooms: 12, area: "310 м²", updated: "28 мар 2026", status: "active" },
];

const furnitureItems = [
  { id: 1, name: "Диван угловой Loft", brand: "Arredo", size: "280×170 см", price: "89 400 ₽", category: "Диваны" },
  { id: 2, name: "Обеденный стол Solid", brand: "Nord", size: "160×80 см", price: "34 200 ₽", category: "Столы" },
  { id: 3, name: "Кресло Arc", brand: "Arredo", size: "85×90 см", price: "22 800 ₽", category: "Кресла" },
  { id: 4, name: "Шкаф-купе Forma", brand: "Space", size: "240×60 см", price: "67 600 ₽", category: "Шкафы" },
  { id: 5, name: "Кровать Frame", brand: "Nord", size: "200×160 см", price: "58 000 ₽", category: "Кровати" },
  { id: 6, name: "Тумба TV Unit", brand: "Space", size: "180×40 см", price: "18 500 ₽", category: "ТВ-зоны" },
];

const calcItems = [
  { label: "Площадь помещений", value: "87.4 м²" },
  { label: "Периметр стен", value: "47.6 м" },
  { label: "Площадь пола (с учётом порогов)", value: "85.1 м²" },
  { label: "Площадь потолка", value: "87.4 м²" },
  { label: "Площадь стен (под отделку)", value: "168.3 м²" },
  { label: "Количество дверных проёмов", value: "6 шт." },
  { label: "Количество оконных проёмов", value: "8 шт." },
  { label: "Объём помещений (высота 2.8 м)", value: "244.7 м³" },
];

function ScanSection() {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const startScan = () => {
    setScanning(true);
    setDone(false);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setScanning(false);
          setDone(true);
          return 100;
        }
        return p + 2;
      });
    }, 60);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">LiDAR + Camera</p>
        <h2 className="text-3xl font-bold text-foreground">Сканирование помещения</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-sm overflow-hidden relative">
          <div className="aspect-video bg-[#060a0f] relative flex items-center justify-center"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }}
          >
            {scanning && (
              <div
                className="scan-line absolute left-0 right-0 h-0.5 bg-primary opacity-80"
                style={{ boxShadow: "0 0 12px 2px hsl(var(--primary))" }}
              />
            )}
            {done ? (
              <div className="text-center animate-fade-in">
                <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center mx-auto mb-3">
                  <Icon name="Check" size={28} className="text-primary" />
                </div>
                <p className="text-primary font-mono text-sm">Сканирование завершено</p>
              </div>
            ) : scanning ? (
              <div className="text-center">
                <p className="text-muted-foreground font-mono text-xs mb-2">SCANNING...</p>
                <div className="w-48 h-1 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-primary font-mono text-xs mt-2">{progress}%</p>
              </div>
            ) : (
              <div className="text-center">
                <Icon name="ScanLine" size={48} className="text-border mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Направьте камеру на помещение</p>
              </div>
            )}

            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className="pulse-dot w-2 h-2 rounded-full bg-primary block" />
              <span className="text-primary font-mono text-xs">LIDAR READY</span>
            </div>
          </div>

          <div className="p-4 flex gap-3 border-t border-border">
            <button
              onClick={startScan}
              disabled={scanning}
              className="flex-1 bg-primary text-primary-foreground font-semibold text-sm py-2.5 px-4 rounded-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Icon name="ScanLine" size={16} />
              {scanning ? "Идёт сканирование..." : "Начать сканирование"}
            </button>
            <button className="bg-secondary text-secondary-foreground text-sm py-2.5 px-4 rounded-sm hover:bg-border transition-colors">
              <Icon name="Settings2" size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { icon: "Ruler", label: "Точность измерений", value: "± 2 мм" },
            { icon: "Layers", label: "Метод", value: "LiDAR + Photogrammetry" },
            { icon: "Cpu", label: "Обработка", value: "Нейросеть v3.1" },
            { icon: "Eye", label: "Определение проёмов", value: "Автоматически" },
          ].map((item) => (
            <div key={item.label} className="bg-card border border-border rounded-sm p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-secondary flex items-center justify-center shrink-0">
                <Icon name={item.icon} size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold text-foreground">{item.value}</p>
              </div>
              <Icon name="CheckCircle2" size={16} className="text-primary shrink-0" />
            </div>
          ))}

          <div className="bg-card border border-border rounded-sm p-4">
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-widest font-mono">Результаты последнего сканирования</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { v: "4", l: "комнаты" },
                { v: "87 м²", l: "площадь" },
                { v: "14", l: "проёмов" },
              ].map((s) => (
                <div key={s.l} className="text-center">
                  <p className="text-2xl font-black text-primary font-mono">{s.v}</p>
                  <p className="text-xs text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectsSection({ token: _token }: { token: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await apiFetch(PROJECTS_URL);
    if (data.projects) setProjects(data.projects);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    const { data } = await apiFetch(PROJECTS_URL, {
      method: "POST",
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (data.project) {
      setProjects((prev) => [data.project, ...prev]);
      setNewName(""); setShowForm(false);
    }
    setCreating(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">Workspace</p>
          <h2 className="text-3xl font-bold">Мои проекты</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-primary-foreground font-semibold text-sm py-2.5 px-5 rounded-sm hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Icon name="Plus" size={16} />
          Новый проект
        </button>
      </div>

      {showForm && (
        <form onSubmit={createProject} className="mb-5 bg-card border border-primary/30 rounded-sm p-4 flex gap-3 animate-fade-in">
          <input
            autoFocus
            value={newName} onChange={(e) => setNewName(e.target.value)}
            placeholder="Название проекта..."
            className="flex-1 bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          <button type="submit" disabled={creating}
            className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            {creating ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Check" size={14} />}
            Создать
          </button>
          <button type="button" onClick={() => setShowForm(false)}
            className="bg-secondary text-muted-foreground text-sm px-3 py-2 rounded-sm hover:bg-border transition-colors"
          >
            <Icon name="X" size={14} />
          </button>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-sm p-5 h-20 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="border border-dashed border-border rounded-sm p-12 text-center">
          <Icon name="FolderOpen" size={32} className="text-border mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Нет проектов. Создайте первый!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-card border border-border rounded-sm p-5 flex items-center gap-5 hover:border-primary/40 transition-colors cursor-pointer group"
            >
              <div className="w-12 h-12 bg-secondary rounded-sm flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <Icon name="Home" size={22} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {p.rooms > 0 ? `${p.rooms} комнат · ` : ""}{p.area !== "0 м2" ? `${p.area} · ` : ""}обновлён {p.updated}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-mono px-2.5 py-1 rounded-sm ${
                  p.status === "active" ? "bg-primary/10 text-primary" : "bg-border text-muted-foreground"
                }`}>
                  {p.status === "active" ? "В работе" : "Завершён"}
                </span>
                <Icon name="ChevronRight" size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlannerSection() {
  const [activeTool, setActiveTool] = useState("select");
  const tools = [
    { id: "select", icon: "MousePointer2", label: "Выбор" },
    { id: "wall", icon: "Minus", label: "Стена" },
    { id: "door", icon: "DoorOpen", label: "Дверь" },
    { id: "window", icon: "Square", label: "Окно" },
    { id: "measure", icon: "Ruler", label: "Измерить" },
    { id: "text", icon: "Type", label: "Текст" },
  ];

  const rooms = [
    { x: 10, y: 10, w: 160, h: 120, label: "Гостиная", area: "28.4 м²" },
    { x: 10, y: 140, w: 100, h: 100, label: "Спальня", area: "18.2 м²" },
    { x: 180, y: 10, w: 80, h: 80, label: "Кухня", area: "12.1 м²" },
    { x: 180, y: 100, w: 80, h: 60, label: "Ванная", area: "7.8 м²" },
    { x: 120, y: 140, w: 60, h: 100, label: "Коридор", area: "8.6 м²" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">2D/3D</p>
          <h2 className="text-3xl font-bold">Планировщик</h2>
        </div>
        <div className="flex gap-2">
          {["2D", "3D"].map((v) => (
            <button
              key={v}
              className={`text-sm font-mono px-4 py-2 rounded-sm border transition-colors ${
                v === "2D"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-1 bg-card border border-border rounded-sm p-2">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              title={t.label}
              className={`w-10 h-10 rounded-sm flex items-center justify-center transition-colors ${
                activeTool === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon name={t.icon} size={18} />
            </button>
          ))}
        </div>

        <div className="flex-1 bg-card border border-border rounded-sm overflow-hidden">
          <div className="bg-secondary/30 border-b border-border px-4 py-2 flex items-center gap-4">
            <p className="text-xs font-mono text-muted-foreground">Квартира на Ленина, 12</p>
            <span className="text-xs font-mono text-border">|</span>
            <p className="text-xs font-mono text-muted-foreground">Масштаб: 1:50</p>
            <span className="ml-auto text-xs font-mono text-primary">87.1 м²</span>
          </div>

          <div className="relative overflow-hidden" style={{ height: 360 }}>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
                backgroundSize: "40px 40px"
              }}
            />
            <svg width="100%" height="100%" viewBox="0 0 280 250" className="absolute inset-0">
              {rooms.map((r) => (
                <g key={r.label}>
                  <rect
                    x={r.x} y={r.y} width={r.w} height={r.h}
                    fill="rgba(255,255,255,0.03)"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="1.5"
                    style={{ cursor: "pointer" }}
                  />
                  <text x={r.x + r.w / 2} y={r.y + r.h / 2 - 6} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="8" fontFamily="IBM Plex Mono">
                    {r.label}
                  </text>
                  <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 8} textAnchor="middle" fill="hsl(35,90%,55%)" fontSize="7" fontFamily="IBM Plex Mono">
                    {r.area}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function CatalogSection() {
  const [filter, setFilter] = useState("Все");
  const categories = ["Все", "Диваны", "Столы", "Кресла", "Шкафы", "Кровати", "ТВ-зоны"];
  const filtered = filter === "Все" ? furnitureItems : furnitureItems.filter((f) => f.category === filter);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">3D-библиотека</p>
        <h2 className="text-3xl font-bold">Каталог мебели</h2>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`text-xs font-mono px-3 py-1.5 rounded-sm border transition-colors ${
              filter === c
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-card border border-border rounded-sm overflow-hidden hover:border-primary/40 transition-colors cursor-pointer group"
          >
            <div className="aspect-video bg-secondary flex items-center justify-center">
              <Icon name="Sofa" size={40} className="text-border group-hover:text-primary/40 transition-colors" />
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground font-mono mb-1">{item.brand} · {item.category}</p>
              <p className="font-semibold text-foreground mb-1">{item.name}</p>
              <p className="text-xs text-muted-foreground mb-3">{item.size}</p>
              <div className="flex items-center justify-between">
                <span className="text-primary font-bold">{item.price}</span>
                <button className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-sm hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1">
                  <Icon name="Plus" size={12} />
                  В план
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalcSection() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">Автоматически</p>
        <h2 className="text-3xl font-bold">Расчёты</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Основные параметры</p>
          <div className="space-y-2">
            {calcItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between bg-card border border-border rounded-sm px-4 py-3"
              >
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="font-mono font-semibold text-primary text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Смета материалов</p>

          {[
            { mat: "Напольное покрытие (ламинат)", qty: "85.1 м²", price: "220 ₽/м²", total: "18 722 ₽" },
            { mat: "Обои (флизелин)", qty: "168.3 м²", price: "480 ₽/м²", total: "80 784 ₽" },
            { mat: "Краска потолочная", qty: "87.4 м²", price: "95 ₽/м²", total: "8 303 ₽" },
            { mat: "Плинтус (пол)", qty: "47.6 м", price: "120 ₽/м", total: "5 712 ₽" },
          ].map((r) => (
            <div key={r.mat} className="bg-card border border-border rounded-sm p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-semibold text-foreground">{r.mat}</p>
                <p className="text-primary font-bold font-mono text-sm">{r.total}</p>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground font-mono">
                <span>{r.qty}</span>
                <span>×</span>
                <span>{r.price}</span>
              </div>
            </div>
          ))}

          <div className="bg-primary/10 border border-primary/30 rounded-sm p-4 flex justify-between items-center">
            <span className="font-semibold text-foreground">Итого материалы:</span>
            <span className="text-primary font-black text-xl font-mono">113 521 ₽</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportSection() {
  const formats = [
    { icon: "FileImage", label: "PNG / JPEG", desc: "Изображение плана в высоком разрешении", badge: "Популярное" },
    { icon: "File", label: "PDF", desc: "Документ с планом и спецификацией", badge: "" },
    { icon: "Box", label: "DWG / DXF", desc: "Файл AutoCAD для подрядчиков", badge: "Про" },
    { icon: "Layers", label: "IFC", desc: "BIM-модель для строительства", badge: "Про" },
    { icon: "Globe", label: "3D-тур", desc: "Интерактивная ссылка для клиента", badge: "Новое" },
    { icon: "Table2", label: "Excel-смета", desc: "Таблица материалов и стоимостей", badge: "" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">Форматы</p>
        <h2 className="text-3xl font-bold">Экспорт</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {formats.map((f) => (
          <div
            key={f.label}
            className="bg-card border border-border rounded-sm p-5 hover:border-primary/40 transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-secondary rounded-sm flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Icon name={f.icon} size={22} className="text-primary" />
              </div>
              {f.badge && (
                <span className={`text-xs font-mono px-2 py-0.5 rounded-sm ${
                  f.badge === "Про" ? "bg-border text-muted-foreground" : "bg-primary/10 text-primary"
                }`}>
                  {f.badge}
                </span>
              )}
            </div>
            <p className="font-bold text-foreground mb-1">{f.label}</p>
            <p className="text-sm text-muted-foreground mb-4">{f.desc}</p>
            <button className="w-full text-sm bg-secondary text-secondary-foreground py-2 rounded-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex items-center justify-center gap-2">
              <Icon name="Download" size={14} />
              Скачать
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileSection({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">Аккаунт</p>
        <h2 className="text-3xl font-bold">Профиль</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-sm p-6 text-center">
          <div className="w-20 h-20 rounded-sm bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-4">
            <Icon name="User" size={36} className="text-primary" />
          </div>
          <p className="font-bold text-foreground text-lg">{user.name}</p>
          <p className="text-muted-foreground text-sm mt-1">{user.role === "designer" ? "Дизайнер" : user.role}</p>
          <p className="text-xs font-mono text-muted-foreground mt-1">{user.email}</p>
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-2xl font-black text-primary font-mono">12</p>
              <p className="text-xs text-muted-foreground">проектов</p>
            </div>
            <div>
              <p className="text-2xl font-black text-primary font-mono">847</p>
              <p className="text-xs text-muted-foreground">м² отсканировано</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-sm p-5">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Тарифный план</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground text-lg">PRO</p>
                <p className="text-sm text-muted-foreground">Безлимит на проекты и сканирования</p>
              </div>
              <span className="text-primary font-bold font-mono">2 900 ₽/мес</span>
            </div>
            <div className="mt-4 bg-secondary rounded-sm p-3">
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-muted-foreground">Использовано хранилище</span>
                <span className="text-primary">4.2 / 50 ГБ</span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "8.4%" }} />
              </div>
            </div>
          </div>

          {[
            { label: "Уведомления о проектах", val: true },
            { label: "Автосохранение каждые 5 мин", val: true },
            { label: "Показывать размеры на плане", val: true },
            { label: "Единицы измерения: метры", val: false },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-sm px-5 py-3.5 flex items-center justify-between">
              <span className="text-sm text-foreground">{s.label}</span>
              <div className={`w-10 h-5 rounded-full p-0.5 flex items-center transition-colors cursor-pointer ${s.val ? "bg-primary" : "bg-border"}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${s.val ? "translate-x-5" : "translate-x-0"}`} />
              </div>
            </div>
          ))}

          <button
            onClick={onLogout}
            className="w-full bg-destructive/10 border border-destructive/30 text-destructive text-sm py-3 rounded-sm hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2 font-semibold"
          >
            <Icon name="LogOut" size={16} />
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  );
}

function HelpSection() {
  const faqs = [
    { q: "Как запустить сканирование?", a: "Перейдите в раздел «Сканирование» и нажмите «Начать сканирование». Направьте камеру на стены помещения, медленно обводя пространство." },
    { q: "Какая точность измерений?", a: "LiDAR обеспечивает точность ±2 мм. Для лучших результатов используйте устройство с аппаратным LiDAR-сенсором." },
    { q: "Можно ли экспортировать план в AutoCAD?", a: "Да, в разделе «Экспорт» доступен формат DWG/DXF, совместимый с AutoCAD и другими САПР." },
    { q: "Как добавить мебель из каталога?", a: "Откройте «Каталог мебели», выберите нужный предмет и нажмите «В план». Мебель автоматически появится в планировщике." },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest mb-1">Документация</p>
        <h2 className="text-3xl font-bold">Помощь</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Частые вопросы</p>
          {faqs.map((faq, i) => (
            <div key={i} className="bg-card border border-border rounded-sm p-5">
              <p className="font-semibold text-foreground mb-2 flex items-start gap-2">
                <Icon name="HelpCircle" size={16} className="text-primary shrink-0 mt-0.5" />
                {faq.q}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed pl-6">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Связаться с нами</p>
          {[
            { icon: "MessageCircle", label: "Чат поддержки", desc: "Ответ в течение 5 минут", action: "Открыть чат" },
            { icon: "Mail", label: "Email", desc: "support@planscan.ru", action: "Написать" },
            { icon: "BookOpen", label: "База знаний", desc: "Видеоинструкции и статьи", action: "Перейти" },
          ].map((c) => (
            <div key={c.label} className="bg-card border border-border rounded-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <Icon name={c.icon} size={18} className="text-primary" />
                <p className="font-semibold text-foreground text-sm">{c.label}</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{c.desc}</p>
              <button className="text-xs text-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                {c.action} <Icon name="ArrowRight" size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [active, setActive] = useState<Section>("scan");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { setAuthChecked(true); return; }
    apiFetch(`${AUTH_URL}?action=verify`).then(({ status, data }) => {
      if (status === 200 && data.user) setUser(data.user);
      else clearToken();
      setAuthChecked(true);
    });
  }, []);

  const logout = () => { clearToken(); setUser(null); setActive("scan"); };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icon name="Loader2" size={28} className="text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={setUser} />;

  const renderSection = () => {
    switch (active) {
      case "projects": return <ProjectsSection token={getToken()} />;
      case "scan": return <ScanSection />;
      case "planner": return <PlannerSection />;
      case "catalog": return <CatalogSection />;
      case "calc": return <CalcSection />;
      case "export": return <ExportSection />;
      case "profile": return <ProfileSection user={user} onLogout={logout} />;
      case "help": return <HelpSection />;
      default: return <ScanSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex font-golos">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
              <Icon name="ScanLine" size={18} className="text-primary-foreground" />
            </div>
            <div>
              <p className="font-black text-foreground text-base tracking-tight">PlanScan</p>
              <p className="text-xs text-muted-foreground font-mono">v3.1 Pro</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActive(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-all ${
                active === item.id
                  ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon name={item.icon} size={17} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-secondary rounded-sm flex items-center justify-center shrink-0">
              <Icon name="User" size={15} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{user.email}</p>
            </div>
            <button onClick={logout} title="Выйти" className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
              <Icon name="LogOut" size={15} />
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border px-6 py-4 flex items-center justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon name="Menu" size={22} />
          </button>
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span>PlanScan</span>
            <span className="text-border">/</span>
            <span className="text-foreground">{navItems.find((n) => n.id === active)?.label}</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="Bell" size={20} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
            </button>
            <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors" title="Выйти">
              <Icon name="LogOut" size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}