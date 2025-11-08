/**
 * Theme Configuration API
 *
 * Handles fetching and updating global theme configuration.
 * Only admins can update the config, but everyone can read it.
 */

import { supabase } from '../lib/supabase';
import type { ThemeConfig } from '../types/database';

/**
 * Get the current theme configuration
 * @returns Promise<ThemeConfig>
 */
export async function getThemeConfig(): Promise<ThemeConfig> {
  const { data, error } = await supabase
    .from('theme_config')
    .select('*')
    .single();

  if (error) {
    console.error('Failed to fetch theme config:', error);
    throw new Error('Kunne ikke hente temakonfigurasjon');
  }

  return data;
}

/**
 * Update theme configuration (admin only)
 * Uses RPC function for security (enforces admin check at DB level)
 *
 * @param julebordEnabled - Enable/disable julebord theme
 * @param autoSeasonalSwitch - Enable/disable automatic seasonal switching
 * @returns Promise<ThemeConfig>
 */
export async function updateThemeConfig(
  julebordEnabled: boolean,
  autoSeasonalSwitch: boolean
): Promise<ThemeConfig> {
  const { data, error } = await supabase.rpc('update_theme_config', {
    p_julebord_enabled: julebordEnabled,
    p_auto_seasonal_switch: autoSeasonalSwitch,
  });

  if (error) {
    console.error('Failed to update theme config:', error);

    // Provide user-friendly error messages
    if (error.message?.includes('Only admins')) {
      throw new Error('Kun administratorer kan endre temakonfigurasjon');
    }

    throw new Error('Kunne ikke oppdatere temakonfigurasjon');
  }

  return data;
}
