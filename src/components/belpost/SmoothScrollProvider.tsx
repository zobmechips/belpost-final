import Lenis from "@studio-freight/lenis";
import { useRouterState } from "@tanstack/react-router";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useApp } from "@/context/AppProvider";

type SmoothScrollContextValue = {
  scrollProgress: number;
  scrollToSection: (id: string) => void;
};

const SmoothScrollContext = createContext<SmoothScrollContextValue>({
  scrollProgress: 0,
  scrollToSection: () => {},
});

export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const { reduceMotion } = useApp();
  const [scrollProgress, setScrollProgress] = useState(0);
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { duration: reduceMotion ? 0 : 1.1 });
    } else {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    }
  }, [pathname, reduceMotion]);

  const scrollToSection = useCallback(
    (id: string) => {
      const target = document.getElementById(id);
      if (!target) return;
      if (lenisRef.current) {
        lenisRef.current.scrollTo(target, { offset: -80, duration: reduceMotion ? 0 : 1.1 });
      } else {
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }
    },
    [reduceMotion],
  );

  useEffect(() => {
    if (reduceMotion) {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      const onScroll = () => {
        const limit = document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress(limit > 0 ? window.scrollY / limit : 0);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    const lenis = new Lenis({
      duration: 1.45,
      easing: (t) => 1 - (1 - t) ** 4,
      smoothWheel: true,
      wheelMultiplier: 0.72,
      lerp: 0.08,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ({ scroll, limit }) => {
      setScrollProgress(limit > 0 ? scroll / limit : 0);
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduceMotion]);

  return (
    <SmoothScrollContext.Provider value={{ scrollProgress, scrollToSection }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
