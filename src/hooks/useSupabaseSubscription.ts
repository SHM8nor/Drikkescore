import { useEffect } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

/**
 * Helper hook to manage Supabase real-time subscriptions alongside React Query.
 * Pass a memoized subscribe callback that registers one or more listeners on the channel.
 */
export function useSupabaseSubscription(
  channelName: string,
  subscribe: (channel: RealtimeChannel) => void,
  enabled: boolean = true,
) {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const channel = supabase.channel(channelName);
    subscribe(channel);
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, enabled, subscribe]);
}
