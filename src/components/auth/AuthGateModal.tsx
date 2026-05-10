import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { AUTH_URL, type User, setToken, apiFetch } from "@/lib/api";
import { notify } from "@/lib/notify";

interface Props {
  open: boolean;
  /** Начальный режим — обычно "register" для тарифов */
  initialMode?: "login" | "register";
  /** Заголовок модалки (контекстный) */
  title?: string;
  /** Подзаголовок (зачем нужна регистрация именно здесь) */
  subtitle?: string;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

/**
 * Модалка входа / регистрации, появляется ТОЛЬКО когда требуется аутентификация
 * (например, при выборе платного тарифа). Не блокирует свободное пользование сайтом.
 */
export default function AuthGateModal({
  open,
  initialMode = "register",
  title = "Войдите, чтобы продолжить",
  subtitle = "Аккаунт нужен только при оформлении тарифа — все остальные функции работают без регистрации",
  onClose,
  onSuccess,
}: Props) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError("");
    }
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register" && !consent) {
      setError("Для регистрации нужно согласие на обработку персональных данных");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const body: Record<string, string> = { email: email.trim(), password };
      if (mode === "register") body.name = name.trim();
      const { status, data } = await apiFetch(`${AUTH_URL}?action=${mode}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (status === 200 && data?.token) {
        setToken(data.token);
        notify.success(
          mode === "register" ? "Аккаунт создан" : "Вход выполнен",
          "Продолжаем оформление тарифа",
        );
        onSuccess(data.user as User);
      } else {
        setError(data?.error || "Ошибка. Проверьте данные и попробуйте снова");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.slice(0, 200));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="px-6 pt-6 pb-4 border-b border-border relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Закрыть"
          >
            <Icon name="X" size={16} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-center">
              <Icon name="UserPlus" size={18} className="text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground leading-tight">{title}</h3>
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground leading-relaxed">{subtitle}</p>
          )}
        </div>

        {/* Переключатель Вход / Регистрация */}
        <div className="p-5">
          <div className="flex gap-1 mb-4 bg-secondary rounded-lg p-1">
            {(["register", "login"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`flex-1 text-sm py-1.5 rounded-md transition-colors font-semibold ${
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "register" ? "Регистрация" : "Вход"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <div>
                <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Имя
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Александр Петров"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                  required
                  autoFocus
                />
              </div>
            )}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                required
                autoFocus={mode === "login"}
              />
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground block mb-1.5">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Минимум 6 символов" : "Ваш пароль"}
                minLength={6}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                required
              />
            </div>

            {mode === "register" && (
              <label className="flex items-start gap-2 cursor-pointer text-xs text-muted-foreground leading-relaxed">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <span>
                  Согласен на обработку персональных данных по{" "}
                  <a href="/legal/privacy" target="_blank" className="text-primary hover:underline">
                    политике
                  </a>{" "}
                  и принимаю{" "}
                  <a href="/legal/offer" target="_blank" className="text-primary hover:underline">
                    оферту
                  </a>
                </span>
              </label>
            )}

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2 flex items-start gap-2">
                <Icon name="AlertCircle" size={13} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-bold text-sm py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Icon name="Loader" size={15} className="animate-spin" />
                  Подождите…
                </>
              ) : (
                <>
                  <Icon name={mode === "register" ? "UserPlus" : "LogIn"} size={15} />
                  {mode === "register" ? "Создать аккаунт и продолжить" : "Войти и продолжить"}
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-muted-foreground pt-1">
              {mode === "register" ? (
                <>
                  Уже есть аккаунт?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-primary hover:underline font-medium"
                  >
                    Войти
                  </button>
                </>
              ) : (
                <>
                  Ещё нет аккаунта?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="text-primary hover:underline font-medium"
                  >
                    Зарегистрироваться
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
