import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { DrinkPrice, DrinkPriceFormData } from '../types/analytics';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to manage drink prices for the current user
 * Provides CRUD operations and real-time subscription to drink_prices table
 */
export function useDrinkPrices() {
  const { user } = useAuth();
  const [prices, setPrices] = useState<DrinkPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch drink prices
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPrices = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('drink_prices')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setPrices(data || []);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching drink prices:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPrices();

    // Set up real-time subscription
    const channel = supabase
      .channel(`drink_prices:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drink_prices',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time drink price update:', payload);

          if (payload.eventType === 'INSERT') {
            setPrices((prev) => [payload.new as DrinkPrice, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setPrices((prev) =>
              prev.map((p) => (p.id === payload.new.id ? (payload.new as DrinkPrice) : p))
            );
          } else if (payload.eventType === 'DELETE') {
            setPrices((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Drink prices subscription status:', status);
      });

    return () => {
      console.log('Cleaning up drink prices subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Add a new drink price
  const addPrice = async (formData: DrinkPriceFormData) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // If this price is set as default, unset all other defaults
      if (formData.is_default) {
        await supabase
          .from('drink_prices')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true);
      }

      const { data, error: insertError } = await supabase
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

      if (insertError) throw insertError;

      console.log('Price added successfully:', data);
      return data as DrinkPrice;
    } catch (err: any) {
      console.error('Error adding drink price:', err);
      throw err;
    }
  };

  // Update an existing drink price
  const updatePrice = async (id: string, formData: Partial<DrinkPriceFormData>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // If this price is being set as default, unset all other defaults
      if (formData.is_default) {
        await supabase
          .from('drink_prices')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true)
          .neq('id', id);
      }

      const { data, error: updateError } = await supabase
        .from('drink_prices')
        .update(formData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      console.log('Price updated successfully:', data);
      return data as DrinkPrice;
    } catch (err: any) {
      console.error('Error updating drink price:', err);
      throw err;
    }
  };

  // Delete a drink price
  const deletePrice = async (id: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { error: deleteError } = await supabase
        .from('drink_prices')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      console.log('Price deleted successfully');
    } catch (err: any) {
      console.error('Error deleting drink price:', err);
      throw err;
    }
  };

  return {
    prices,
    loading,
    error,
    addPrice,
    updatePrice,
    deletePrice,
  };
}
