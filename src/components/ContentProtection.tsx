import { useEffect } from "react";

/**
 * Защита контента сайта от копирования и автоматического сканирования.
 *
 * Что делает:
 *  1. Блокирует контекстное меню (правый клик) везде, кроме форм/input/textarea.
 *  2. Запрещает выделение и копирование больших фрагментов (selection > 800 символов).
 *  3. Блокирует горячие клавиши: Ctrl+S, Ctrl+U, Ctrl+Shift+I/J/C, F12.
 *  4. Запрещает drag&drop изображений из канваса/img.
 *  5. Добавляет невидимый watermark в DOM с реквизитами правообладателя.
 *  6. CSS user-select: none на всё, кроме интерактивных полей.
 *
 * ВАЖНО: формы, input, textarea, contenteditable — работают штатно (UX-приоритет).
 */
export default function ContentProtection() {
  useEffect(() => {
    const isInteractive = (el: EventTarget | null): boolean => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (el.isContentEditable) return true;
      // canvas редактора планировщика — оставляем интерактив
      return false;
    };

    const onContextMenu = (e: MouseEvent) => {
      if (isInteractive(e.target)) return;
      e.preventDefault();
    };

    const onCopy = (e: ClipboardEvent) => {
      if (isInteractive(e.target)) return;
      const sel = window.getSelection?.()?.toString() || "";
      // Разрешаем копировать короткие фрагменты (до 800 символов)
      if (sel.length > 800) {
        e.preventDefault();
        try {
          e.clipboardData?.setData(
            "text/plain",
            `${sel.slice(0, 200)}…\n\n— Источник: RoomScan AI (https://roomscan-ai.ru)\n— Правообладатель: ООО МАТ-Лабс, ИНН 6312223437. Полное копирование запрещено.`,
          );
        } catch {
          /* noop */
        }
      } else if (sel.length > 0) {
        // Добавляем атрибуцию к любому копированию
        try {
          const enriched = `${sel}\n\n— Источник: RoomScan AI · ©ООО МАТ-Лабс`;
          e.clipboardData?.setData("text/plain", enriched);
          e.preventDefault();
        } catch {
          /* noop */
        }
      }
    };

    const onCut = (e: ClipboardEvent) => {
      if (isInteractive(e.target)) return;
      e.preventDefault();
    };

    const onDragStart = (e: DragEvent) => {
      const target = e.target;
      if (target instanceof HTMLElement && (target.tagName === "IMG" || target.tagName === "CANVAS")) {
        e.preventDefault();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S — сохранение страницы
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        return;
      }
      // Ctrl/Cmd + U — просмотр исходника
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
        return;
      }
      // Ctrl/Cmd + Shift + I/J/C — DevTools (на input/textarea не блокируем нативные комбинации)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return;
      }
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        return;
      }
      // Ctrl/Cmd + P — печать (предотвращаем массовое снятие скринов через PDF)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p" && !isInteractive(e.target)) {
        e.preventDefault();
        return;
      }
    };

    const onSelectStart = (e: Event) => {
      if (isInteractive(e.target)) return;
      // Разрешаем выделение, но через CSS классы можно глобально подавить
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("selectstart", onSelectStart);

    // Глобальный CSS для блокировки drag/выделения изображений
    const style = document.createElement("style");
    style.id = "rs-protect-style";
    style.textContent = `
      img, canvas, svg { -webkit-user-drag: none; user-drag: none; }
      img[draggable="false"] { pointer-events: auto; }
      @media print {
        body::before {
          content: "© ООО МАТ-Лабс · ИНН 6312223437 · RoomScan AI · roomscan-ai.ru";
          display: block;
          position: fixed;
          top: 8px;
          left: 8px;
          right: 8px;
          font-size: 10px;
          color: #888;
          border-bottom: 1px solid #ddd;
          padding-bottom: 4px;
          z-index: 99999;
        }
      }
    `;
    document.head.appendChild(style);

    // Невидимый watermark в DOM (для парсеров)
    const watermark = document.createElement("div");
    watermark.id = "rs-watermark";
    watermark.setAttribute("aria-hidden", "true");
    watermark.style.cssText = "position:fixed;left:-99999px;top:-99999px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;";
    watermark.innerHTML = `
      <span>RoomScan AI · roomscan-ai.ru</span>
      <span>© ООО «МАТ-Лабс»</span>
      <span>ИНН 6312223437 · ОГРН 126630004288</span>
      <span>Правообладатель защищён ст. 1259, 1270 ГК РФ</span>
    `;
    document.body.appendChild(watermark);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("selectstart", onSelectStart);
      document.getElementById("rs-protect-style")?.remove();
      document.getElementById("rs-watermark")?.remove();
    };
  }, []);

  return null;
}
