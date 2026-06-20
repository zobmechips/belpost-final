import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const STORAGE_KEY = "cookie-accepted";

function hasAcceptedCookies() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!hasAcceptedCookies()) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.aside
          className="fixed bottom-6 z-50 max-w-[400px] w-[calc(100%-2rem)] left-4 right-4 sm:left-6 sm:right-auto rounded-2xl border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur-md sm:bottom-6 sm:p-5"
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          role="dialog"
          aria-label="Согласие на использование cookie"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-5">
            <p className="flex-1 text-[0.8125rem] leading-relaxed text-slate-600">
              Мы используем файлы cookie для персонализации сервисов и повышения удобства пользования сайтом.
              Продолжая использовать сайт, вы соглашаетесь с нашей{" "}
              <Link
                to="/privacy"
                className="font-medium text-[#1F6FD8] underline decoration-[#1F6FD8]/40 underline-offset-2 transition-colors hover:text-[#1558b0]"
              >
                Политикой конфиденциальности
              </Link>
              .
            </p>
            <button
              type="button"
              onClick={accept}
              className="shrink-0 self-stretch rounded-xl bg-[#1F6FD8] px-5 py-2.5 text-[0.8125rem] font-semibold text-white shadow-sm transition-colors hover:bg-[#1558b0] md:self-center"
            >
              Принять
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>,
    document.body,
  );
}
