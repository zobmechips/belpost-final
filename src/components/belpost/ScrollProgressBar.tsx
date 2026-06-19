import { motion } from "framer-motion";
import { useSmoothScroll } from "./SmoothScrollProvider";

export function ScrollProgressBar() {
  const { scrollProgress } = useSmoothScroll();

  return (
    <div className="scroll-progress-track">
      <motion.div
        className="scroll-progress-fill"
        animate={{ width: `${scrollProgress * 100}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 28, mass: 0.4 }}
      />
    </div>
  );
}
