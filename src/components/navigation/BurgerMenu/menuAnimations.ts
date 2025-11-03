import type { Variants, Transition } from 'framer-motion';

// Easing curves
export const EASINGS = {
  standard: [0.4, 0, 0.2, 1] as [number, number, number, number],
  decelerate: [0, 0, 0.2, 1] as [number, number, number, number],
  accelerate: [0.4, 0, 1, 1] as [number, number, number, number],
};

// Durations (in seconds)
export const DURATIONS = {
  fast: 0.15,
  base: 0.25,
  slow: 0.35,
  slower: 0.5,
};

// Overlay/Backdrop animations
export const overlayVariants: Variants = {
  closed: {
    opacity: 0,
    transition: {
      duration: DURATIONS.base,
      ease: EASINGS.standard,
    },
  },
  open: {
    opacity: 0.6,
    transition: {
      duration: DURATIONS.base,
      ease: EASINGS.standard,
    },
  },
};

// Menu panel slide animations
export const panelVariants: Variants = {
  closed: {
    x: '-100%',
    transition: {
      duration: DURATIONS.slow,
      ease: EASINGS.standard,
    },
  },
  open: {
    x: '0%',
    transition: {
      duration: 0.4,
      ease: EASINGS.standard,
    },
  },
};

// Menu item stagger animations
export const menuItemVariants: Variants = {
  closed: {
    x: -20,
    opacity: 0,
  },
  open: (index: number) => ({
    x: 0,
    opacity: 1,
    transition: {
      delay: 0.25 + index * 0.05,
      duration: DURATIONS.base,
      ease: EASINGS.decelerate,
    },
  }),
};

// Burger icon line animations
export const iconLineVariants = {
  top: {
    closed: {
      rotate: 0,
      translateY: 0,
      transition: {
        duration: 0.3,
        ease: EASINGS.standard,
      },
    },
    open: {
      rotate: 45,
      translateY: 8,
      transition: {
        duration: 0.3,
        ease: EASINGS.standard,
      },
    },
  },
  middle: {
    closed: {
      opacity: 1,
      scaleX: 1,
      transition: {
        duration: 0.3,
        ease: EASINGS.standard,
      },
    },
    open: {
      opacity: 0,
      scaleX: 0,
      transition: {
        duration: 0.3,
        ease: EASINGS.standard,
      },
    },
  },
  bottom: {
    closed: {
      rotate: 0,
      translateY: 0,
      transition: {
        duration: 0.3,
        ease: EASINGS.standard,
      },
    },
    open: {
      rotate: -45,
      translateY: -8,
      transition: {
        duration: 0.3,
        ease: EASINGS.standard,
      },
    },
  },
};

// Hover/tap micro-interactions
export const hoverScale = {
  scale: 1.05,
  transition: { duration: DURATIONS.fast },
};

export const tapScale = {
  scale: 0.97,
  transition: { duration: 0.1 },
};

export const menuItemHover = {
  x: 4,
  transition: { duration: 0.2, ease: EASINGS.decelerate },
};

// User header fade animation
export const userHeaderVariants: Variants = {
  closed: {
    opacity: 0,
  },
  open: {
    opacity: 1,
    transition: {
      delay: 0.2,
      duration: DURATIONS.base,
    },
  },
};

// Container for staggered children
export const staggerContainerVariants: Variants = {
  closed: {},
  open: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.25,
    },
  },
};

// Reduced motion fallback
export const reduceMotionTransition: Transition = {
  duration: 0.01,
};
