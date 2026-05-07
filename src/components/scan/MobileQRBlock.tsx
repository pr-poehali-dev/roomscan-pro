import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import Icon from "@/components/ui/icon";

/**
 * Блок «Открыть на телефоне».
 * Генерирует QR-код локально (без сетевых запросов) и показывает прямую ссылку
 * без preview-- префикса, чтобы на телефоне камера работала по HTTPS.
 */
export default function MobileQRBlock() {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrError, setQrError] = useState<string>("");

  const directUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.href.replace(/^(https?:\/\/)preview--/, "$1");
  }, []);

  const inIframe = typeof window !== "undefined" && window.self !== window.top;

  useEffect(() => {
    if (!directUrl) return;
    let cancelled = false;
    QRCode.toDataURL(directUrl, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0a0a0a", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch((err) => {
        if (!cancelled) setQrError(String(err?.message || err));
      });
    return () => {
      cancelled = true;
    };
  }, [directUrl]);

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
        <div className="shrink-0 bg-white p-2 rounded-lg border border-border w-[136px] h-[136px] flex items-center justify-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR-код для открытия на телефоне"
              width={120}
              height={120}
              className="block"
            />
          ) : qrError ? (
            <span className="text-[10px] text-red-500 text-center px-1">QR ошибка</span>
          ) : (
            <Icon name="Loader2" size={28} className="text-muted-foreground animate-spin" />
          )}
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
