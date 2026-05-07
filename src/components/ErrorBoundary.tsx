import { Component, type ReactNode } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  children: ReactNode;
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
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  reload = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

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
