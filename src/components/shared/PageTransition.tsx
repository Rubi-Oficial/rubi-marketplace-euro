import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Centralized page transition wrapper.
 *
 * Uses a subtle fade + vertical slide for a premium feel.
 * Respects `prefers-reduced-motion` via CSS — framer-motion
 * automatically reads that media query and disables animations.
 */

const variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const transition = {
  duration: 0.3,
  ease: [0.25, 0.1, 0.25, 1], // cubic-bezier — smooth ease-out
};

interface PageTransitionProps {
  children: ReactNode;
  /** Optional key override (defaults to nothing — caller should set via `key` prop) */
  className?: string;
}

export default function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
