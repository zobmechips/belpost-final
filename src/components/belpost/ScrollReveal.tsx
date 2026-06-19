import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { useApp } from "@/context/AppProvider";

export const SCROLL_VIEWPORT = {
  once: false,
  amount: 0.15,
  margin: "0px 0px -8% 0px",
} as const;

export const revealItemVariants: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
  },
};

export const revealContainerVariants: Variants = {
  hidden: {
    opacity: 1,
    transition: { staggerChildren: 0.05, staggerDirection: -1 },
  },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

type ScrollRevealProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  delay?: number;
};

export function ScrollReveal({ children, className, delay = 0, ...rest }: ScrollRevealProps) {
  const { reduceMotion } = useApp();

  if (reduceMotion) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={SCROLL_VIEWPORT}
      variants={{
        hidden: revealItemVariants.hidden,
        visible: {
          ...revealItemVariants.visible,
          transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1], delay },
        },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

type ScrollRevealGroupProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
};

export function ScrollRevealGroup({ children, className, ...rest }: ScrollRevealGroupProps) {
  const { reduceMotion } = useApp();

  if (reduceMotion) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={SCROLL_VIEWPORT}
      variants={revealContainerVariants}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

type ScrollRevealItemProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
};

export function ScrollRevealItem({ children, className, ...rest }: ScrollRevealItemProps) {
  const { reduceMotion } = useApp();

  if (reduceMotion) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div className={className} variants={revealItemVariants} {...rest}>
      {children}
    </motion.div>
  );
}
