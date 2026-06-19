import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useApp } from "@/context/AppProvider";

type FluidModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function FluidModal({ open, title, onClose, children, footer }: FluidModalProps) {
  const { tr, reduceMotion } = useApp();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fluid-overlay"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.3 }}
          onClick={onClose}
        >
          <motion.div
            className="fluid-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fluid-modal-title"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 id="fluid-modal-title" className="fluid-modal-title">{title}</h3>
              <button type="button" onClick={onClose} className="fluid-modal-close" aria-label={tr("common", "close")}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="fluid-modal-body">{children}</div>
            {footer && <div className="fluid-modal-footer">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
