import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { useApp } from "@/context/AppProvider";

type MagneticCardProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  footer?: ReactNode;
  lite?: boolean;
};

export function MagneticCard({ children, className = "", onClick, footer, lite = false }: MagneticCardProps) {
  const { reduceMotion } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 90, damping: 18 });
  const springY = useSpring(y, { stiffness: 90, damping: 18 });
  const motionOff = reduceMotion || lite;

  const handleMouseMove = (event: React.MouseEvent) => {
    if (motionOff || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const offsetX = event.clientX - (rect.left + rect.width / 2);
    const offsetY = event.clientY - (rect.top + rect.height / 2);
    const distance = Math.hypot(offsetX, offsetY);
    const radius = 110;
    if (distance < radius) {
      const pull = (radius - distance) / radius;
      x.set(offsetX * pull * 0.14);
      y.set(offsetY * pull * 0.14);
    } else {
      x.set(0);
      y.set(0);
    }
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!onClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      ref={ref}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      style={motionOff ? undefined : { x: springX, y: springY }}
      whileHover={motionOff || !onClick ? undefined : { scale: 1.018 }}
      whileTap={motionOff || !onClick ? undefined : { scale: 0.992 }}
      className={`magnetic-card group h-full ${className}`}
    >
      <span className="magnetic-card-glow" aria-hidden />
      <span className="magnetic-card-content">{children}</span>
      {footer ? (
        <div className="magnetic-card-footer" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          {footer}
        </div>
      ) : null}
    </motion.div>
  );
}
