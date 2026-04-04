import { useState } from "react";
import Icon from "@/components/ui/icon";
import { AUTH_URL, User, setToken, apiFetch } from "@/lib/api";

const AVANGARD_URL = "https://avangard-ai.ru";

export default function AuthScreen({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<"main" | "direct">("main");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const body: Record<string, string> = { email, password };
    if (authMode === "register") body.name = name;
    const { status, data } = await apiFetch(`${AUTH_URL}?action=${authMode}`, {
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
    <div
      className="min-h-screen flex items-center justify-center font-golos p-4"
      style={{
        background: "radial-gradient(ellipse at 60% 0%, hsl(142 70% 36% / 0.08) 0%, transparent 60%), hsl(var(--background))",
        backgroundImage: "radial-gradient(ellipse at 60% 0%, hsl(142 70% 36% / 0.08) 0%, transparent 60%), linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
        backgroundSize: "100% 100%, 60px 60px, 60px 60px",
      }}
    >
      <div className="w-full max-w-md animate-fade-in">

        {/* Логотип экосистемы */}
        <div className="text-center mb-8">
          <a href={AVANGARD_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 group mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center group-hover:opacity-90 transition-opacity">
              <Icon name="Zap" size={20} className="text-primary-foreground" />
            </div>
            <div className="text-left">
              <p className="font-black text-foreground text-sm tracking-widest uppercase">АВАНГАРД</p>
              <p className="text-xs text-muted-foreground">avangard-ai.ru</p>
            </div>
          </a>

          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary/10 border border-primary/30 rounded-md flex items-center justify-center">
              <Icon name="ScanLine" size={16} className="text-primary" />
            </div>
            <Icon name="ArrowRight" size={14} className="text-muted-foreground" />
            <h1 className="text-2xl font-black text-foreground tracking-tight">RoomScan AI</h1>
          </div>
          <p className="text-muted-foreground text-sm">Сканирование и планировка помещений</p>
        </div>

        {mode === "main" ? (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <p className="text-sm text-center text-muted-foreground mb-2">
              RoomScan AI — часть экосистемы <span className="text-primary font-semibold">АВАНГАРД</span>.
              Войдите через основной сайт или используйте отдельный аккаунт.
            </p>

            {/* Кнопка входа через Авангард */}
            <a
              href={`${AVANGARD_URL}?redirect=roomscan`}
              target="_self"
              className="w-full flex items-center justify-between bg-primary text-primary-foreground font-bold py-3.5 px-5 rounded-lg hover:opacity-90 transition-opacity group"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-white/15 rounded-md flex items-center justify-center">
                  <Icon name="Zap" size={15} className="text-primary-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Войти через АВАНГАРД</p>
                  <p className="text-xs text-primary-foreground/70 font-normal">Единый аккаунт для всех сервисов</p>
                </div>
              </div>
              <Icon name="ArrowRight" size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </a>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">или</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              onClick={() => setMode("direct")}
              className="w-full flex items-center justify-between bg-secondary text-secondary-foreground font-semibold py-3 px-5 rounded-lg hover:bg-border transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-border rounded-md flex items-center justify-center">
                  <Icon name="Mail" size={15} className="text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm">Войти по email</p>
                  <p className="text-xs text-muted-foreground font-normal">Аккаунт RoomScan AI</p>
                </div>
              </div>
              <Icon name="ChevronRight" size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            <p className="text-center text-xs text-muted-foreground pt-1">
              Нет аккаунта?{" "}
              <a href={`${AVANGARD_URL}/register`} target="_self" className="text-primary hover:underline font-medium">
                Зарегистрироваться на АВАНГАРД
              </a>
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-6">
            <button
              onClick={() => { setMode("main"); setError(""); }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5"
            >
              <Icon name="ChevronLeft" size={14} />
              Назад
            </button>

            <div className="flex gap-1 mb-5 bg-secondary rounded-lg p-1">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setAuthMode(m); setError(""); }}
                  className={`flex-1 text-sm py-1.5 rounded-md transition-colors font-semibold ${
                    authMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "login" ? "Вход" : "Регистрация"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-3">
              {authMode === "register" && (
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Имя</label>
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Александр Петров"
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">Пароль</label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  required minLength={6}
                />
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2 text-xs text-destructive flex items-center gap-2">
                  <Icon name="AlertCircle" size={14} />
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
              >
                {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="ArrowRight" size={16} />}
                {loading ? "Загрузка..." : authMode === "login" ? "Войти" : "Создать аккаунт"}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-5 font-mono">
          RoomScan AI · Экосистема{" "}
          <a href={AVANGARD_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            АВАНГАРД
          </a>
        </p>
      </div>
    </div>
  );
}
