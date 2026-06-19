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
        <motion.div
          className="cookie-consent"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
        >
          <p className="cookie-consent-text">
            Мы используем файлы cookie для персонализации сервисов и повышения удобства пользования сайтом.
            Продолжая использовать сайт, вы соглашаетесь с нашей{" "}
            <Link to="/privacy" className="cookie-consent-link">Политикой конфиденциальности</Link>.
          </p>
          <button type="button" className="cookie-consent-btn" onClick={accept}>
            Принять
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
