import Icon from "@/components/ui/icon";

/**
 * Подсказки для случаев, когда камера недоступна:
 * — DesktopIframeHelp: жёлтый блок «Камера не работает в окне предпросмотра»
 *   (десктоп в iframe), с кнопкой «Открыть в новой вкладке» и «Запустить демо».
 * — MobileIframeHelp: крупная карточка для мобильного в iframe.
 * — DemoFallbackButton: разделитель + кнопка «Демо-сканирование» под основным флоу.
 *
 * Логика и DOM 1:1 перенесены из PhotogrammetryScanner.tsx.
 */

interface DesktopProps {
  directUrl: string;
  onDemo: () => void;
}

export function DesktopIframeHelp({ directUrl, onDemo }: DesktopProps) {
  return (
    <div className="bg-yellow-500/10 border-2 border-yellow-500/40 rounded-xl p-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <Icon name="AlertTriangle" size={20} className="text-yellow-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm mb-1">
            Камера не работает в окне предпросмотра
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Браузер блокирует доступ к камере во встроенном iframe редактора.
            Откройте сайт в отдельной вкладке или запустите демо-режим — мы покажем готовый результат сканирования, чтобы вы могли проверить остальные функции.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-yellow-500 text-black font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              <Icon name="ExternalLink" size={13} />
              Открыть в новой вкладке
            </a>
            <button
              onClick={onDemo}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              <Icon name="Sparkles" size={13} />
              Запустить демо-сканирование
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MobileProps {
  directUrl: string;
  onDemo: () => void;
}

export function MobileIframeHelp({ directUrl, onDemo }: MobileProps) {
  return (
    <div className="bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/40 rounded-xl p-5 animate-fade-in">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="bg-primary/20 rounded-full p-3">
          <Icon name="Smartphone" size={28} className="text-primary" />
        </div>
        <div>
          <p className="font-bold text-foreground text-base mb-1">
            Камера недоступна в предпросмотре
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Браузер блокирует доступ к камере внутри окна редактора.
            Запустите демо-сканирование — увидите, как работает результат, или опубликуйте сайт и откройте его на телефоне.
          </p>
        </div>
        <button
          onClick={onDemo}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-3.5 rounded-xl hover:opacity-90 transition-opacity text-base shadow-lg shadow-primary/30"
        >
          <Icon name="Sparkles" size={18} />
          Запустить демо-сканирование
        </button>
        <a
          href={directUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          или попробовать открыть в новой вкладке
        </a>
      </div>
    </div>
  );
}

interface DemoFallbackProps {
  onDemo: () => void;
}

export function DemoFallbackButton({ onDemo }: DemoFallbackProps) {
  return (
    <>
      <div className="flex items-center gap-2 justify-center">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          или попробуйте без камеры
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        onClick={onDemo}
        className="w-full flex items-center justify-center gap-2 bg-card border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 text-foreground font-semibold px-4 py-3 rounded-xl transition-all"
      >
        <Icon name="Sparkles" size={16} className="text-primary" />
        Демо-сканирование
        <span className="text-xs font-mono text-muted-foreground">
          (готовый пример комнаты)
        </span>
      </button>
    </>
  );
}