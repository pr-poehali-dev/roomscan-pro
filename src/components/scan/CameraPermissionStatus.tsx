import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

type Status = "checking" | "granted" | "prompt" | "denied" | "unsupported" | "insecure";

interface Props {
  onReady?: (granted: boolean) => void;
}

export default function CameraPermissionStatus({ onReady }: Props) {
  const [status, setStatus] = useState<Status>("checking");
  const [detail, setDetail] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      // 1. HTTPS / localhost обязателен
      if (typeof window !== "undefined") {
        const isSecure =
          window.isSecureContext ||
          location.hostname === "localhost" ||
          location.hostname === "127.0.0.1";
        if (!isSecure) {
          if (!cancelled) {
            setStatus("insecure");
            setDetail("Камера доступна только по HTTPS");
            onReady?.(false);
          }
          return;
        }
      }

      // 2. Поддержка getUserMedia
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setStatus("unsupported");
          setDetail("Браузер не поддерживает доступ к камере");
          onReady?.(false);
        }
        return;
      }

      // 3. Permissions API (если доступен — без запроса)
      try {
        const perm = await navigator.permissions?.query?.({
          name: "camera" as PermissionName,
        });
        if (perm && !cancelled) {
          if (perm.state === "granted") {
            setStatus("granted");
            setDetail("Доступ к камере разрешён");
            onReady?.(true);
            return;
          }
          if (perm.state === "denied") {
            setStatus("denied");
            setDetail("Доступ к камере запрещён в настройках браузера");
            onReady?.(false);
            return;
          }
          // prompt — продолжим к шагу 4
        }
      } catch {
        // Permissions API недоступен — пробуем enumerateDevices
      }

      // 4. enumerateDevices — есть ли вообще камера
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some((d) => d.kind === "videoinput");
        if (!hasCamera && !cancelled) {
          setStatus("unsupported");
          setDetail("Камера не найдена на устройстве");
          onReady?.(false);
          return;
        }
      } catch {
        // ignore
      }

      if (!cancelled) {
        setStatus("prompt");
        setDetail("Камера готова — разрешение запросим при старте");
        onReady?.(true);
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [onReady]);

  const meta = (() => {
    switch (status) {
      case "checking":
        return {
          icon: "Loader2" as const,
          spin: true,
          color: "text-muted-foreground",
          bg: "bg-muted/40 border-border",
          title: "Проверяем камеру…",
        };
      case "granted":
        return {
          icon: "CheckCircle2" as const,
          spin: false,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10 border-emerald-500/30",
          title: "Камера готова к работе",
        };
      case "prompt":
        return {
          icon: "Camera" as const,
          spin: false,
          color: "text-primary",
          bg: "bg-primary/10 border-primary/30",
          title: "Камера найдена",
        };
      case "denied":
        return {
          icon: "ShieldAlert" as const,
          spin: false,
          color: "text-red-500",
          bg: "bg-red-500/10 border-red-500/30",
          title: "Доступ к камере запрещён",
        };
      case "insecure":
        return {
          icon: "Lock" as const,
          spin: false,
          color: "text-yellow-500",
          bg: "bg-yellow-500/10 border-yellow-500/30",
          title: "Нужен HTTPS",
        };
      case "unsupported":
        return {
          icon: "CameraOff" as const,
          spin: false,
          color: "text-red-500",
          bg: "bg-red-500/10 border-red-500/30",
          title: "Камера недоступна",
        };
    }
  })();

  return (
    <div className={`border-2 rounded-xl p-3 flex items-center gap-3 animate-fade-in ${meta.bg}`}>
      <Icon
        name={meta.icon}
        size={20}
        className={`${meta.color} shrink-0 ${meta.spin ? "animate-spin" : ""}`}
      />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground text-sm leading-tight">{meta.title}</p>
        {detail && (
          <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
            {detail}
          </p>
        )}
      </div>
      {status === "denied" && (
        <a
          href="https://support.google.com/chrome/answer/2693767"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-red-500 hover:underline shrink-0"
        >
          Как включить?
        </a>
      )}
    </div>
  );
}
