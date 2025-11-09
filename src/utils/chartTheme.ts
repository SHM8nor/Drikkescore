import type { Theme } from '@mui/material/styles';
import { pink, yellow, brown, blueGrey } from '@mui/material/colors';

/**
 * Chart Theme Utilities
 *
 * Centralized theme integration for chart components.
 * Provides consistent colors, spacing, and styling using MUI theme values.
 */

/**
 * Get chart color palette from theme
 * Returns an array of colors for participant/series visualization
 */
export function getChartColors(theme: Theme): string[] {
  return [
    theme.palette.primary.main,        // Blue
    theme.palette.error.main,          // Red
    theme.palette.success.main,        // Green
    theme.palette.warning.main,        // Orange
    theme.palette.secondary.main,      // Purple
    theme.palette.info.main,           // Cyan
    pink[600],                         // Pink (Material Design)
    yellow[700],                       // Yellow (Material Design)
    brown[700],                        // Brown (Material Design)
    blueGrey[600],                     // Blue Grey (Material Design)
  ];
}

/**
 * Get chart axis styling from theme
 */
export function getChartAxisStyles(theme: Theme) {
  return {
    label: {
      fontSize: theme.typography.body2.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
    },
    tickLabel: {
      fontSize: theme.typography.caption.fontSize,
    },
  };
}

/**
 * Get empty state styling from theme
 */
export function getEmptyStateStyles(theme: Theme) {
  return {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: theme.spacing(37.5), // 300px
    color: theme.palette.text.secondary,
    fontSize: theme.typography.body2.fontSize,
  };
}

/**
 * Get bar label styling from theme
 */
export function getBarLabelStyles(theme: Theme) {
  return {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: theme.typography.fontWeightBold,
    fill: theme.palette.common.white,
  };
}

/**
 * Get legend styling from theme
 */
export function getLegendStyles(theme: Theme) {
  return {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing(1.875), // 15px
      py: theme.spacing(1),
      pb: theme.spacing(1.5),
    },
    item: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.625), // 5px
    },
    colorBox: {
      width: theme.spacing(1.25), // 10px
      height: theme.spacing(1.25), // 10px
      borderRadius: typeof theme.shape.borderRadius === 'number'
        ? theme.shape.borderRadius * 0.25
        : theme.spacing(0.25), // Use theme spacing instead of hardcoded 2
    },
    label: {
      fontSize: theme.typography.body2.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
    },
  };
}

/**
 * Get total value display styling from theme
 */
export function getTotalValueStyles(theme: Theme) {
  return {
    textAlign: 'center' as const,
    py: theme.spacing(2),
    pt: theme.spacing(1),
    fontSize: theme.typography.h5.fontSize,
    fontWeight: theme.typography.fontWeightBold,
    color: theme.palette.primary.main,
  };
}

/**
 * Get chart container styling from theme
 */
export function getChartContainerStyles(theme: Theme) {
  return {
    width: '100%',
    height: '100%',
    minHeight: theme.spacing(43.75), // 350px
    display: 'flex',
    flexDirection: 'column' as const,
  };
}
