import { useState } from "react";
import Icon from "@/components/ui/icon";
import { adminAuthApi } from "@/lib/adminApi";
import { notify } from "@/lib/notify";

interface Props {
  onSuccess: () => void;
}

/**
 * Форма входа в админ-кабинет. Логин/пароль — через бэкенд admin-auth.
 * При успехе токен сохраняется в localStorage и вызывается onSuccess.
 */
export default function AdminLogin({ onSuccess }: Props) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showReset, setShowReset] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const r = await adminAuthApi.login(login.trim(), password);
    setBusy(false);
    if (r.ok) {
      notify.success("Вход выполнен", "Добро пожаловать в админ-кабинет");
      onSuccess();
    } else {
      setError(r.error || "Ошибка входа");
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-3">
            <Icon name="ShieldCheck" size={26} className="text-primary" />
          </div>
          <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">Админ-кабинет</p>
          <h2 className="text-2xl font-black text-foreground">Вход для администратора</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Введите логин и пароль, заданные в секретах проекта
          </p>
        </div>

        <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1 block">Логин</label>
            <div className="relative">
              <Icon name="User" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="admin@matlabs.ru"
                autoComplete="username"
                required
                className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1 block">Пароль</label>
            <div className="relative">
              <Icon name="Lock" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full bg-secondary border border-border rounded-lg pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={show ? "Скрыть" : "Показать"}
              >
                <Icon name={show ? "EyeOff" : "Eye"} size={14} />
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2 text-xs text-destructive flex items-center gap-2">
              <Icon name="AlertCircle" size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !login || !password}
            className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold py-2.5 rounded-lg transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            <Icon name={busy ? "Loader2" : "ArrowRight"} size={15} className={busy ? "animate-spin" : ""} />
            {busy ? "Проверка…" : "Войти"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowReset((v) => !v)}
            className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
          >
            <Icon name="KeyRound" size={12} />
            Забыли пароль?
          </button>
        </div>

        {showReset && (
          <div className="mt-3 bg-card border border-border rounded-2xl p-4 text-sm space-y-3">
            <div className="flex items-start gap-2">
              <Icon name="ShieldAlert" size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-muted-foreground leading-relaxed">
                Пароль администратора хранится в секретах проекта на сервере, поэтому
                посмотреть старый нельзя — но можно задать новый за минуту.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <Step n={1} title="Откройте секреты проекта">
                В кабинете poehali.dev: <b>Ядро → Секреты</b>. Найдите запись <code className="px-1 py-0.5 rounded bg-secondary font-mono">ADMIN_PASSWORD</code>.
              </Step>
              <Step n={2} title="Установите новое значение">
                Нажмите «Изменить» и введите новый пароль (минимум 12 символов, рекомендуется случайная строка). Сохраните.
              </Step>
              <Step n={3} title="Перезапустите функцию">
                Откройте <b>Ядро → Функции → admin-auth</b> и нажмите «Перезапустить» — чтобы функция подтянула новое значение секрета.
              </Step>
              <Step n={4} title="Войдите с новым паролем">
                Логин остался прежним (секрет <code className="px-1 py-0.5 rounded bg-secondary font-mono">ADMIN_LOGIN</code>). Введите его и новый пароль в форму выше.
              </Step>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <Icon name="Info" size={12} className="shrink-0 mt-0.5" />
              <span>
                Если потерян и логин (<code>ADMIN_LOGIN</code>) — точно так же измените его значение в секретах. Все активные сессии автоматически разлогинятся.
              </span>
            </div>
          </div>
        )}

        <p className="mt-4 text-[11px] text-muted-foreground text-center font-mono">
          Сессия действует 12 часов. Доступ защищён HMAC-токеном.
        </p>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-foreground text-[12px] leading-tight">{title}</div>
        <div className="text-muted-foreground text-[11px] leading-relaxed mt-0.5">{children}</div>
      </div>
    </div>
  );
}