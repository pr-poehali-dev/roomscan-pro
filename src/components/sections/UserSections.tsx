import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { PROJECTS_URL, User, Project, apiFetch } from "@/lib/api";

export function ProjectsSection({ token: _token }: { token: string }) {
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

export function ProfileSection({ user, onLogout }: { user: User; onLogout: () => void }) {
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
