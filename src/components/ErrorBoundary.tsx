import { Component, type ReactNode } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  children: ReactNode;
  /** Если true — рендерится компактная inline-плашка вместо полноэкранной */
  inline?: boolean;
  /** Доп. обработчик при сбросе ошибки (например, восстановить body.overflow) */
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    if (typeof window !== "undefined") {
      const w = window as unknown as { __lastError?: string };
      w.__lastError = `${error.name}: ${error.message}`;
      // Разблокируем скролл — иначе при крэше модалки страница «зависает»
      try {
        document.body.style.overflow = "";
      } catch {
        /* noop */
      }
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  reload = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    /* Inline-режим: компактная плашка для модалок и встроенных блоков.
       Не занимает весь экран и не блокирует пользователя. */
    if (this.props.inline) {
      return (
        <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-red-500/30 rounded-2xl shadow-xl max-w-sm w-full p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <Icon name="AlertCircle" size={20} className="text-red-500" />
              </div>
              <div>
                <p className="font-bold text-foreground">Не удалось показать</p>
                <p className="text-xs text-muted-foreground">Попробуйте ещё раз</p>
              </div>
            </div>
            {this.state.error?.message && (
              <p className="text-[11px] font-mono text-muted-foreground bg-secondary/60 rounded-lg px-3 py-2 mb-4 break-words line-clamp-3">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.reset}
              className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <Icon name="X" size={14} />
              Закрыть
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border-2 border-red-500/30 mb-6">
            <Icon name="AlertOctagon" size={40} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-black mb-2 text-foreground">
            Что-то пошло не так
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Приложение столкнулось с ошибкой. Попробуйте перезагрузить страницу.
          </p>
          {this.state.error && (
            <div className="bg-muted rounded-xl p-3 mb-6 text-left">
              <p className="text-xs font-mono text-muted-foreground break-words">
                {this.state.error.message}
              </p>
            </div>
          )}
          <div className="flex gap-2 justify-center">
            <button
              onClick={this.reset}
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground font-bold px-5 py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              <Icon name="RotateCcw" size={16} />
              Попробовать снова
            </button>
            <button
              onClick={this.reload}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              <Icon name="RefreshCw" size={16} />
              Перезагрузить
            </button>
          </div>
        </div>
      </div>
    );
  }
}