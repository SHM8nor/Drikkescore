/**
 * Theme Configuration
 *
 * Central configuration for theme system including feature flags,
 * seasonal settings, and available themes.
 */

import type { SessionType } from '../types/database';

// =============================================================================
// Theme Feature Flags
// =============================================================================

export interface ThemeConfig {
  /**
   * Enable/disable julebord theme globally
   * When false, users cannot create julebord sessions
   */
  julebordEnabled: boolean;

  /**
   * Automatically enable julebord theme during seasonal dates
   * When true, the julebord theme will be auto-enabled within the configured date range
   */
  autoSeasonalSwitch: boolean;

  /**
   * Available session types for creation
   * Dynamically filtered based on feature flags
   */
  availableThemes: SessionType[];

  /**
   * Seasonal dates for auto-enabling themed sessions
   * Format: { start: Date, end: Date }
   */
  seasonalDates: {
    julebord: {
      start: Date;
      end: Date;
    };
  };

  /**
   * Require admin approval for themed sessions
   * When true, themed sessions won't be visible until approved by admin
   */
  requireApproval: boolean;
}

// =============================================================================
// Default Configuration
// =============================================================================

/**
 * Get the current year's seasonal dates
 * Julebord season: December 1 - December 31
 */
function getSeasonalDates() {
  const currentYear = new Date().getFullYear();
  return {
    julebord: {
      start: new Date(currentYear, 11, 1), // December 1st
      end: new Date(currentYear, 11, 31, 23, 59, 59), // December 31st 23:59:59
    },
  };
}

/**
 * Default theme configuration
 * EDIT THIS TO CONFIGURE THEME SYSTEM
 */
export const defaultThemeConfig: ThemeConfig = {
  // Enable julebord theme (set to false to disable globally)
  julebordEnabled: true,

  // Auto-enable julebord during December
  autoSeasonalSwitch: true,

  // Available themes (will be filtered based on julebordEnabled flag)
  availableThemes: ['standard', 'julebord'],

  // Seasonal dates (auto-updated each year)
  seasonalDates: getSeasonalDates(),

  // Require admin approval for themed sessions (false = no approval needed)
  requireApproval: false,
};

// =============================================================================
// Runtime Theme Configuration
// =============================================================================

/**
 * Get runtime theme configuration
 * Applies feature flags and seasonal logic
 */
export function getThemeConfig(): ThemeConfig {
  const config = { ...defaultThemeConfig };

  // Filter available themes based on julebordEnabled flag
  if (!config.julebordEnabled) {
    config.availableThemes = config.availableThemes.filter(
      (theme) => theme === 'standard'
    );
  }

  return config;
}

/**
 * Check if a specific theme is currently available
 */
export function isThemeAvailable(theme: SessionType): boolean {
  const config = getThemeConfig();
  return config.availableThemes.includes(theme);
}

/**
 * Check if we're currently in seasonal period for a theme
 */
export function isInSeasonalPeriod(theme: SessionType): boolean {
  if (theme === 'standard') return true; // Standard is always available

  const config = getThemeConfig();
  const now = new Date();

  if (theme === 'julebord') {
    const { start, end } = config.seasonalDates.julebord;
    return now >= start && now <= end;
  }

  return false;
}

/**
 * Get the recommended theme based on current date and seasonal settings
 */
export function getRecommendedTheme(): SessionType {
  const config = getThemeConfig();

  // If auto-seasonal switching is disabled, always return standard
  if (!config.autoSeasonalSwitch) {
    return 'standard';
  }

  // Check if we're in julebord season
  if (config.julebordEnabled && isInSeasonalPeriod('julebord')) {
    return 'julebord';
  }

  return 'standard';
}

/**
 * Theme display names (Norwegian)
 */
export const themeDisplayNames: Record<SessionType, string> = {
  standard: 'Standard',
  julebord: 'Julebord',
};

/**
 * Theme descriptions (Norwegian)
 */
export const themeDescriptions: Record<SessionType, string> = {
  standard: 'Standard drikkesesjon uten spesielt tema',
  julebord: 'Julebord-tema med juledekorasjoner og spesielle badges',
};

/**
 * Theme emojis for visual indicators
 */
export const themeEmojis: Record<SessionType, string> = {
  standard: '🍺',
  julebord: '🎄',
};
