import { motion } from 'framer-motion';
import type { UserHeaderProps } from './types';
import { userHeaderVariants } from './menuAnimations';
import './UserHeader.css';

export default function UserHeader({ displayName, email }: UserHeaderProps) {
  return (
    <motion.div
      className="user-header"
      variants={userHeaderVariants}
    >
      <div className="user-header__avatar">
        {displayName.charAt(0).toUpperCase()}
      </div>
      <div className="user-header__info">
        <div className="user-header__name">{displayName}</div>
        <div className="user-header__email">{email}</div>
      </div>
    </motion.div>
  );
}
