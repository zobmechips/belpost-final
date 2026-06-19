import { motion } from "framer-motion";
import { useApp } from "@/context/AppProvider";

type TrackingStepperProps = {
  activeStep: number;
  visible: boolean;
  labels?: string[];
};

const NODE_X = [40, 200, 360, 520];

export function TrackingStepper({ activeStep, visible, labels = ["Принято", "Сортировка", "В пути", "Доставлено"] }: TrackingStepperProps) {
  const { reduceMotion } = useApp();
  if (!visible) return null;

  const progress = activeStep / (labels.length - 1);

  return (
    <div className="tracking-stepper">
      <svg viewBox="0 0 600 80" className="w-full" aria-hidden>
        <path d="M 40 40 H 200 H 360 H 520" fill="none" stroke="rgba(31,111,216,0.2)" strokeWidth="3" strokeLinecap="round" />
        <motion.path
          d="M 40 40 H 200 H 360 H 520"
          fill="none"
          stroke="#1F6FD8"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="480"
          initial={reduceMotion ? false : { strokeDashoffset: 480 }}
          animate={{ strokeDashoffset: 480 - 480 * progress }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }}
        />
        {labels.map((label, index) => {
          const x = NODE_X[index];
          const active = index <= activeStep;
          return (
            <circle
              key={label}
              cx={x}
              cy={40}
              r={7}
              fill={active ? "#1F6FD8" : "#fff"}
              stroke="#1F6FD8"
              strokeWidth="2"
            />
          );
        })}
      </svg>
      <div className="tracking-stepper-labels">
        {labels.map((label, index) => (
          <span key={label} className={index <= activeStep ? "is-active" : ""}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
