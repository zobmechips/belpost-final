import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppProvider";

const INTRO_KEY = "belpost-intro-seen";

export function Preloader() {
  const { reduceMotion } = useApp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reduceMotion || sessionStorage.getItem(INTRO_KEY)) return;
    setVisible(true);
    const timer = window.setTimeout(() => {
      sessionStorage.setItem(INTRO_KEY, "1");
      setVisible(false);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  if (!visible) return null;

  return (
    <div className="site-preloader" aria-busy="true" aria-label="Загрузка">
      <motion.div
        className="preloader-line"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
      <p className="preloader-text">БЕЛПОЧТА</p>
    </div>
  );
}
