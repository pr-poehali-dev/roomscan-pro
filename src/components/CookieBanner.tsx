import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const STORAGE_KEY = "roomscan:cookie-consent";

/**
 * Баннер согласия на cookie. Показывается один раз — пока пользователь не нажмёт «Принять».
 * Соответствует требованиям 152-ФЗ и Cookie Law.
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Небольшая задержка, чтобы не мешать первой анимации страницы
        const t = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(t);
      }
    } catch {
      /* localStorage недоступен — показываем баннер всё равно */
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ accepted: true, at: new Date().toISOString() }),
      );
    } catch {
      /* noop */
    }
    setVisible(false);
  };

  const decline = () => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ accepted: false, at: new Date().toISOString() }),
      );
    } catch {
      /* noop */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Согласие на использование cookie"
      className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-md z-[60] bg-card border border-border shadow-2xl rounded-xl p-4 animate-fade-in"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <Icon name="Cookie" size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm mb-1">Мы используем cookie</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Cookie нужны для работы сервиса (авторизация, сохранение проектов) и аналитики
            (Яндекс.Метрика). Подробнее — в{" "}
            <Link to="/legal/privacy" className="text-primary hover:underline">
              Политике конфиденциальности
            </Link>{" "}
            и{" "}
            <Link to="/legal/cookies" className="text-primary hover:underline">
              Политике cookie
            </Link>.
          </p>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button
              onClick={accept}
              className="bg-primary text-primary-foreground hover:opacity-90 font-bold text-xs px-4 py-2 rounded-lg transition-opacity"
            >
              Принять
            </button>
            <button
              onClick={decline}
              className="bg-secondary hover:bg-secondary/70 text-foreground font-bold text-xs px-3 py-2 rounded-lg transition-colors"
            >
              Только обязательные
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
