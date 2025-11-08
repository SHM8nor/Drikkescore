import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './AnimatedHeader.css';

// Animation variants with proper TypeScript types
const headerVariants: Variants = {
  top: {
    height: 80,
    transition: {
      duration: 0.25,
      ease: [0.42, 0, 0.58, 1], // easeInOut bezier curve
    },
  },
  scrolled: {
    height: 60,
    transition: {
      duration: 0.25,
      ease: [0.42, 0, 0.58, 1], // easeInOut bezier curve
    },
  },
};

const titleVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.12, 0, 0.39, 0], // easeOut bezier curve
    },
  },
};

// Map routes to Norwegian page titles
const getPageTitle = (pathname: string): string => {
  if (pathname === '/') return 'Hjem';
  if (pathname === '/settings') return 'Innstillinger';
  if (pathname === '/history') return 'Historikk';
  if (pathname === '/analytics') return 'Analyse';
  if (pathname.startsWith('/session/')) return 'Økt';
  return 'Drikker du?';
};

export default function AnimatedHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { sessionType } = useTheme();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [pageTitle, setPageTitle] = useState('');

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Update title when route changes
  useEffect(() => {
    setPageTitle(getPageTitle(location.pathname));
  }, [location.pathname]);

  // Track scroll position
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50);
  });

  // Get user initials for avatar fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get decorative elements based on theme
  const getThemeDecoration = () => {
    if (sessionType === 'julebord') {
      return (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            marginLeft: '12px',
            fontSize: '1.5rem',
            display: 'inline-block',
          }}
        >
          🎄
        </motion.span>
      );
    }
    return null;
  };

  return (
    <motion.header
      className="animated-header"
      variants={prefersReducedMotion ? undefined : headerVariants}
      initial="top"
      animate={isScrolled ? 'scrolled' : 'top'}
      style={{
        background: sessionType === 'julebord'
          ? 'linear-gradient(135deg, var(--christmas-green), var(--christmas-holly))'
          : undefined,
        transition: 'background 0.5s ease',
      }}
    >
      <div className="animated-header__container">
        {/* Page Title with theme decoration */}
        <motion.div
          className="animated-header__title"
          variants={prefersReducedMotion ? undefined : titleVariants}
          initial="hidden"
          animate="visible"
          key={pageTitle} // Re-animate when title changes
        >
          <h1>
            {pageTitle}
            {getThemeDecoration()}
          </h1>
        </motion.div>

        {/* User Info */}
        {profile && user && (
          <motion.div
            className="animated-header__user"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            onClick={() => navigate(`/profile/${user.id}`)}
            style={{ cursor: 'pointer' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="animated-header__user-info">
              <span className="animated-header__user-name">{profile.full_name}</span>
            </div>
            <div className="animated-header__user-avatar">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} />
              ) : (
                <span className="animated-header__user-initials">
                  {getInitials(profile.full_name)}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
