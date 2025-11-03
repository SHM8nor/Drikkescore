import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import type { MenuPanelProps } from './types';
import { panelVariants } from './menuAnimations';
import './MenuPanel.css';

export default function MenuPanel({ isOpen, onClose, children }: MenuPanelProps) {
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Close if dragged left beyond threshold or velocity is high enough
    const shouldClose = info.offset.x < -100 || info.velocity.x < -500;

    if (shouldClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="burger-menu-panel"
          className="menu-panel"
          variants={panelVariants}
          initial="closed"
          animate="open"
          exit="closed"
          drag="x"
          dragConstraints={{ left: -320, right: 0 }}
          dragElastic={0.2}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="menu-panel-content">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
