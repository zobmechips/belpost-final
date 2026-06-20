import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const STORAGE_KEY = "belpost-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = window.setTimeout(() => setVisible(true), 2000);
    return () => window.clearTimeout(t);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          className="fixed bottom-4 left-4 z-[80] w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/60 bg-white/75 p-4 shadow-[0_16px_48px_-20px_rgba(15,42,82,0.28)] backdrop-blur-xl sm:bottom-5 sm:left-5 sm:p-5"
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
    </AnimatePresence>
  );
}
