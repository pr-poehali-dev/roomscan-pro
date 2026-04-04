import { useState } from "react";
import Icon from "@/components/ui/icon";
import { AUTH_URL, User, setToken, apiFetch } from "@/lib/api";

export default function AuthScreen({ onAuth }: { onAuth: (user: User) => void }) {
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
