import { useEffect, useState } from "react";

/** Shared layout breakpoints (px) — aligned with Tailwind v4 defaults */
export const BREAKPOINTS = {
  xs: 360,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

function getWidth() {
  return typeof window !== "undefined" ? window.innerWidth : BREAKPOINTS.xl;
}

export function useWindowWidth() {
  const [width, setWidth] = useState(getWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize, { passive: true });
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return width;
}

/** Phone only: < 768px */
export function useIsPhone() {
  const width = useWindowWidth();
  return width < BREAKPOINTS.md;
}

/** Tablet only: 768px – 1279px */
export function useIsTablet() {
  const width = useWindowWidth();
  return width >= BREAKPOINTS.md && width < BREAKPOINTS.xl;
}

export function useMinWidth(bp: BreakpointKey) {
  const width = useWindowWidth();
  return width >= BREAKPOINTS[bp];
}

/** Cards visible in carousels: 1 mobile → 2 tablet → 3 desktop */
export function useCarouselVisibleCount() {
  const width = useWindowWidth();
  if (width >= BREAKPOINTS.lg) return 3;
  if (width >= BREAKPOINTS.sm) return 2;
  return 1;
}
