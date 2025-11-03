import { motion, AnimatePresence } from 'framer-motion';
import type { MenuOverlayProps } from './types';
import { overlayVariants } from './menuAnimations';
import './MenuOverlay.css';

export default function MenuOverlay({ isOpen, onClick }: MenuOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="menu-overlay"
          variants={overlayVariants}
          initial="closed"
          animate="open"
          exit="closed"
          onClick={onClick}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
}
