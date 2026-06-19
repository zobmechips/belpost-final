import { motion } from "framer-motion";

type RevealTextProps = {
  text: string;
  className?: string;
  delay?: number;
};

export function RevealText({ text, className = "", delay = 0 }: RevealTextProps) {
  return (
    <span className={`inline-flex flex-wrap ${className}`} aria-label={text}>
      {text.split("").map((char, index) => (
        <span key={`${char}-${index}`} className="reveal-mask">
          <motion.span
            className="reveal-char"
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{
              delay: delay + index * 0.035,
              duration: 0.75,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
