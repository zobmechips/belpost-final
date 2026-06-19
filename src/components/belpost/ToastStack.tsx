import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

export type ToastItem = {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
};

type ToastStackProps = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    <div className="toast-stack" aria-live="polite">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type ?? "info"];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 80, y: -12, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className={`toast-card toast-${toast.type ?? "info"}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <p className="flex-1 text-sm">{toast.message}</p>
              <button type="button" onClick={() => onDismiss(toast.id)} className="toast-dismiss" aria-label="Закрыть">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
