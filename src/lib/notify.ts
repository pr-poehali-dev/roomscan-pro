import { toast } from "sonner";

/**
 * Централизованные уведомления — замена нативных alert/confirm/prompt.
 * Используем sonner toast для не-блокирующего UX.
 */

export const notify = {
  success(msg: string, description?: string) {
    toast.success(msg, { description });
  },
  error(msg: string, description?: string) {
    toast.error(msg, { description });
  },
  info(msg: string, description?: string) {
    toast(msg, { description });
  },
  warn(msg: string, description?: string) {
    if (typeof toast.warning === "function") {
      toast.warning(msg, { description });
    } else {
      toast(msg, { description });
    }
  },
};

/**
 * Замена нативного confirm() на toast с действием.
 * Использует Promise — можно `await confirmAction(...)`.
 */
export function confirmAction(
  message: string,
  opts: { confirmLabel?: string; cancelLabel?: string; description?: string } = {},
): Promise<boolean> {
  return new Promise((resolve) => {
    const { confirmLabel = "Подтвердить", cancelLabel = "Отмена", description } = opts;
    const id = toast(message, {
      description,
      duration: 10000,
      action: {
        label: confirmLabel,
        onClick: () => {
          resolve(true);
          toast.dismiss(id);
        },
      },
      cancel: {
        label: cancelLabel,
        onClick: () => {
          resolve(false);
          toast.dismiss(id);
        },
      },
      onDismiss: () => resolve(false),
      onAutoClose: () => resolve(false),
    });
  });
}