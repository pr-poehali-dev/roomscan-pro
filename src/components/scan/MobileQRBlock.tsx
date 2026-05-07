import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";

/**
 * Блок «Открыть на телефоне».
 * Показывает прямую ссылку без preview-- префикса и QR-код для мобильного.
 * Используется в разделе сканирования — камера всё равно работает только в отдельной вкладке по HTTPS.
 */
export default function MobileQRBlock() {
  const [copied, setCopied] = useState(false);

  const directUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.href.replace(/^(https?:\/\/)preview--/, "$1");
  }, []);

  const inIframe = typeof window !== "undefined" && window.self !== window.top;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=4&data=${encodeURIComponent(directUrl)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(directUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="shrink-0 bg-white p-2 rounded-lg border border-border">
          <img
            src={qrSrc}
            alt="QR-код для открытия на телефоне"
            width={120}
            height={120}
            className="block"
            loading="lazy"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="Smartphone" size={15} className="text-primary" />
            <p className="font-bold text-foreground text-sm">Открыть на телефоне</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Отсканируйте QR-код камерой телефона, чтобы открыть сайт в отдельной вкладке —
            тогда заработает доступ к камере и сканирование комнаты.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 bg-secondary hover:bg-border transition-colors text-foreground text-xs font-semibold px-3 py-1.5 rounded-md"
            >
              <Icon name={copied ? "Check" : "Copy"} size={12} />
              {copied ? "Скопировано" : "Скопировать ссылку"}
            </button>
            {inIframe && (
              <a
                href={directUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
              >
                <Icon name="ExternalLink" size={12} />
                Открыть в новой вкладке
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
