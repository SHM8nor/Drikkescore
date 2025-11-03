import { useState, useEffect, useCallback, useRef } from 'react';

export function useBurgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    // Store current focus to restore later
    previousFocusRef.current = document.activeElement as HTMLElement;

    setIsOpen(true);
    setIsAnimating(true);

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Animation complete
    setTimeout(() => setIsAnimating(false), 600);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setIsAnimating(true);

    // Unlock body scroll
    document.body.style.overflow = '';

    // Restore focus
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }

    // Animation complete
    setTimeout(() => setIsAnimating(false), 400);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Close on Escape key
      if (event.key === 'Escape' && isOpen) {
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  // Focus trap when menu is open
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const menuPanel = document.getElementById('burger-menu-panel');
      if (!menuPanel) return;

      const focusableElements = menuPanel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return {
    isOpen,
    isAnimating,
    open,
    close,
    toggle,
  };
}
