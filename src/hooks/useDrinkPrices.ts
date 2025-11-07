import { useCallback, useMemo } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { DrinkPrice, DrinkPriceFormData } from '../types/analytics';
import { useAuth } from '../context/AuthContext';
import { queryKeys } from '../lib/queryKeys';
import { useSupabaseSubscription } from './useSupabaseSubscription';

/**
 * Hook to manage drink prices for the current user
 * Provides CRUD operations and real-time subscription to drink_prices table
 */
export function useDrinkPrices() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const pricesQuery = useQuery({
    queryKey: queryKeys.drinkPrices.list(user?.id ?? null),
    queryFn: async () => {
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('drink_prices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data as DrinkPrice[]) || [];
    },
    enabled: Boolean(user),
  });

  const invalidatePrices = useCallback(async () => {
    if (user) {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.drinkPrices.list(user.id),
      });
    }
  }, [queryClient, user]);

  useSupabaseSubscription(
    `drink_prices:${user?.id ?? 'anonymous'}`,
    useCallback(
      (channel) => {
        if (!user) return;

        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'drink_prices',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            invalidatePrices();
          },
        );
      },
      [invalidatePrices, user],
    ),
    Boolean(user),
  );

  const addPriceMutation = useMutation({
    mutationFn: async (formData: DrinkPriceFormData) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (formData.is_default) {
        await supabase
          .from('drink_prices')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true);
      }

      const { data, error } = await supabase
        .from('drink_prices')
        .insert({
          user_id: user.id,
          drink_name: formData.drink_name,
          price_amount: formData.price_amount,
          currency: formData.currency || 'NOK',
          volume_ml: formData.volume_ml,
          alcohol_percentage: formData.alcohol_percentage,
          is_default: formData.is_default || false,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as DrinkPrice;
    },
    onSuccess: invalidatePrices,
  });

  const updatePriceMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: Partial<DrinkPriceFormData> }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (formData.is_default) {
        await supabase
          .from('drink_prices')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true)
          .neq('id', id);
      }

      const { data, error } = await supabase
        .from('drink_prices')
        .update(formData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as DrinkPrice;
    },
    onSuccess: invalidatePrices,
  });

  const deletePriceMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('drink_prices')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: invalidatePrices,
  });

  const error = useMemo(() => {
    if (pricesQuery.error instanceof Error) {
      return pricesQuery.error.message;
    }
    return null;
  }, [pricesQuery.error]);

  return {
    prices: pricesQuery.data ?? [],
    loading: pricesQuery.isPending,
    error,
    addPrice: addPriceMutation.mutateAsync,
    updatePrice: (id: string, formData: Partial<DrinkPriceFormData>) =>
      updatePriceMutation.mutateAsync({ id, formData }),
    deletePrice: deletePriceMutation.mutateAsync,
  };
}
