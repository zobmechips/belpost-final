import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { useApp } from "@/context/AppProvider";

const INTRO_KEY = "belpost-intro-seen";
const SPLASH_DURATION_MS = 5000;
const SPLASH_EXIT_S = 0.8;
const PROGRESS_DURATION_S = 4;
const EXIT_EASE = [0.43, 0.13, 0.23, 0.96] as const;
const LETTER_EASE = [0.22, 1, 0.36, 1] as const;

const TITLE = "БЕЛПОЧТА";
const STATUS_LINES = [
  "Проверка безопасности PostgreSQL",
  "Инициализация ИИ-модулей",
  "Подключение Яндекс.Карт",
];

type SplashContextValue = {
  splashComplete: boolean;
};

const SplashContext = createContext<SplashContextValue>({ splashComplete: false });

export function useSplashComplete() {
  return useContext(SplashContext).splashComplete;
}

function shouldSkipSplash(reduceMotion: boolean) {
  if (typeof window === "undefined") return false;
  return reduceMotion || sessionStorage.getItem(INTRO_KEY) === "1";
}

function readSplashBoot(reduceMotion: boolean) {
  if (typeof window === "undefined") {
    return { show: true, complete: false };
  }
  const skip = shouldSkipSplash(reduceMotion);
  return { show: !skip, complete: skip };
}

export function SplashProvider({ children }: { children: ReactNode }) {
  const { reduceMotion } = useApp();
  const [showSplash, setShowSplash] = useState(() => readSplashBoot(false).show);
  const [splashComplete, setSplashComplete] = useState(() => readSplashBoot(false).complete);

  useLayoutEffect(() => {
    const boot = readSplashBoot(reduceMotion);
    setShowSplash(boot.show);
    setSplashComplete(boot.complete);
  }, [reduceMotion]);

  const handleSplashExitComplete = () => {
    sessionStorage.setItem(INTRO_KEY, "1");
    setShowSplash(false);
    setSplashComplete(true);
  };

  return (
    <SplashContext.Provider value={{ splashComplete }}>
      {showSplash && <PreloaderOverlay onExitComplete={handleSplashExitComplete} />}
      {splashComplete ? children : null}
    </SplashContext.Provider>
  );
}

type PreloaderOverlayProps = {
  onExitComplete: () => void;
};

function PreloaderOverlay({ onExitComplete }: PreloaderOverlayProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hideTimer = window.setTimeout(() => setVisible(false), SPLASH_DURATION_MS);
    return () => window.clearTimeout(hideTimer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {visible && <CinematicSplash key="belpost-splash" />}
    </AnimatePresence>
  );
}

function CinematicSplash() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-28, 28]), { stiffness: 70, damping: 22 });
  const glowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-18, 18]), { stiffness: 70, damping: 22 });

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set((event.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      className="belpost-splash"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Загрузка Белпочты"
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, y: -50 }}
      transition={{ duration: SPLASH_EXIT_S, ease: EXIT_EASE }}
      onPointerMove={handlePointerMove}
    >
      <div className="belpost-splash__base" aria-hidden />
      <motion.div
        className="belpost-splash__glow"
        style={{ x: glowX, y: glowY }}
        aria-hidden
        animate={{ opacity: [0.55, 0.85, 0.6], scale: [1, 1.06, 1] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="belpost-splash__veil" aria-hidden />
      <div className="belpost-splash__noise" aria-hidden />
      <div className="belpost-splash__grid" aria-hidden />

      <div className="belpost-splash__content">
        <motion.p
          className="belpost-splash__eyebrow"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: LETTER_EASE }}
        >
          Национальный оператор почтовой связи
        </motion.p>

        <h1 className="belpost-splash__title" aria-label={TITLE}>
          {TITLE.split("").map((char, index) => (
            <motion.span
              key={`${char}-${index}`}
              className="belpost-splash__char"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.65,
                delay: 0.22 + index * 0.07,
                ease: LETTER_EASE,
              }}
            >
              {char}
            </motion.span>
          ))}
        </h1>

        <div className="belpost-splash__progress-wrap">
          <div className="belpost-splash__progress-track" aria-hidden>
            <motion.div
              className="belpost-splash__progress-fill"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: PROGRESS_DURATION_S, ease: [0.33, 1, 0.32, 1] }}
            />
            <motion.div
              className="belpost-splash__progress-shine"
              initial={{ x: "-120%" }}
              animate={{ x: "220%" }}
              transition={{ duration: PROGRESS_DURATION_S, ease: [0.33, 1, 0.32, 1] }}
            />
          </div>
          <motion.p
            className="belpost-splash__status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            {STATUS_LINES.map((line, index) => (
              <motion.span
                key={line}
                className="belpost-splash__status-line"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: index === 0 ? 0.9 : index === 1 ? 0.55 : 0.35, y: 0 }}
                transition={{ duration: 0.55, delay: 0.55 + index * 0.35, ease: LETTER_EASE }}
              >
                {line}
              </motion.span>
            ))}
          </motion.p>
        </div>
      </div>

      <motion.div
        className="belpost-splash__footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.45 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        aria-hidden
      >
        РУП «Белпочта» · Республика Беларусь
      </motion.div>
    </motion.div>
  );
}
