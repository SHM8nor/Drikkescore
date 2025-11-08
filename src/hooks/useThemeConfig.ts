/**
 * Theme Configuration Hooks
 *
 * React Query hooks for fetching and updating theme configuration.
 * Used by HomePage to check if julebord theme is available,
 * and by admin panel to toggle theme settings.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getThemeConfig, updateThemeConfig } from '../api/themeConfig';
import { queryKeys } from '../lib/queryKeys';

/**
 * Fetch the current theme configuration
 *
 * @returns React Query result with theme config data
 *
 * @example
 * const { data: themeConfig, isLoading } = useThemeConfig();
 * if (themeConfig?.julebord_enabled) {
 *   // Show julebord button
 * }
 */
export function useThemeConfig() {
  return useQuery({
    queryKey: queryKeys.admin.themeConfig,
    queryFn: getThemeConfig,
    staleTime: 1000 * 60 * 5, // 5 minutes - config doesn't change often
    gcTime: 1000 * 60 * 10, // 10 minutes cache
  });
}

/**
 * Mutation for updating theme configuration (admin only)
 *
 * Automatically invalidates theme config query on success,
 * triggering refetch across all components using useThemeConfig.
 *
 * @returns React Query mutation object
 *
 * @example
 * const updateConfig = useUpdateThemeConfig();
 *
 * await updateConfig.mutateAsync({
 *   julebordEnabled: true,
 *   autoSeasonalSwitch: false
 * });
 */
export function useUpdateThemeConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      julebordEnabled,
      autoSeasonalSwitch,
    }: {
      julebordEnabled: boolean;
      autoSeasonalSwitch: boolean;
    }) => updateThemeConfig(julebordEnabled, autoSeasonalSwitch),
    onSuccess: () => {
      // Invalidate theme config query to trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.themeConfig });
    },
  });
}
