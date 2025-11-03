import { motion } from 'framer-motion';
import type { BurgerIconProps } from './types';
import { iconLineVariants, hoverScale, tapScale } from './menuAnimations';
import './BurgerIcon.css';

export default function BurgerIcon({ isOpen, onClick }: BurgerIconProps) {
  const state = isOpen ? 'open' : 'closed';

  return (
    <motion.button
      className="burger-icon"
      onClick={onClick}
      whileHover={hoverScale}
      whileTap={tapScale}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
      aria-controls="burger-menu-panel"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.line
          x1="3"
          y1="6"
          x2="21"
          y2="6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          variants={iconLineVariants.top}
          animate={state}
          initial="closed"
        />
        <motion.line
          x1="3"
          y1="12"
          x2="21"
          y2="12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          variants={iconLineVariants.middle}
          animate={state}
          initial="closed"
        />
        <motion.line
          x1="3"
          y1="18"
          x2="21"
          y2="18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          variants={iconLineVariants.bottom}
          animate={state}
          initial="closed"
        />
      </svg>
    </motion.button>
  );
}
