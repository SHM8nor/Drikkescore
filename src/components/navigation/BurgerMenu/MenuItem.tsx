import { motion } from 'framer-motion';
import type { MenuItemProps } from './types';
import { menuItemVariants, menuItemHover, tapScale } from './menuAnimations';
import './MenuItem.css';

export default function MenuItem({ item, index, isActive, onClick }: MenuItemProps) {
  return (
    <motion.button
      className={`menu-item ${isActive ? 'menu-item--active' : ''}`}
      custom={index}
      variants={menuItemVariants}
      whileHover={menuItemHover}
      whileTap={tapScale}
      onClick={onClick}
      role="menuitem"
    >
      <span className="menu-item__icon">{item.icon}</span>
      <span className="menu-item__label">{item.label}</span>
      {isActive && (
        <motion.div
          className="menu-item__indicator"
          layoutId="activeIndicator"
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  );
}
