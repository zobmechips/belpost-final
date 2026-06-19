import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useApp } from "@/context/AppProvider";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  items: { label: string; action: () => void }[];
};

export function MobileMenu({ open, onClose, items }: MobileMenuProps) {
  const { tr, reduceMotion } = useApp();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fluid-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.nav
            className="mobile-menu"
            initial={reduceMotion ? false : { x: "-100%" }}
            animate={{ x: 0 }}
            exit={reduceMotion ? undefined : { x: "-100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            aria-label={tr("header", "menu")}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <span className="font-display text-lg font-bold text-slate-900">{tr("header", "menu")}</span>
              <button type="button" onClick={onClose} className="fluid-modal-close" aria-label={tr("common", "close")}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="flex flex-col gap-1 p-4">
              {items.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    className="mobile-menu-link"
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
