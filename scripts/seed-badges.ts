import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

const starterBadges = [
  {
    code: 'first_drink',
    title: 'Første Drink',
    description: 'Registrerte din aller første drink i en økt!',
    category: 'milestone' as const,
    tier: 'bronze' as const,
    tier_order: 1,
    icon_url: null,
    criteria: {
      type: 'threshold',
      conditions: [
        {
          metric: 'total_drinks',
          operator: '>=',
          value: 1,
          timeframe: 'all_time'
        }
      ]
    },
    is_active: true,
    is_automatic: true,
    points: 10
  },
  {
    code: 'veteran',
    title: 'Veteran',
    description: 'Fullførte 10 drikkesøkter!',
    category: 'global' as const,
    tier: 'silver' as const,
    tier_order: 2,
    icon_url: null,
    criteria: {
      type: 'milestone',
      conditions: [
        {
          metric: 'session_count',
          operator: '>=',
          value: 10,
          timeframe: 'all_time'
        }
      ]
    },
    is_active: true,
    is_automatic: true,
    points: 50
  },
  {
    code: 'social_butterfly',
    title: 'Sosial Sommerfugl',
    description: 'Drakk med 5 eller flere venner i samme økt!',
    category: 'social' as const,
    tier: 'gold' as const,
    tier_order: 3,
    icon_url: null,
    criteria: {
      type: 'threshold',
      conditions: [
        {
          metric: 'unique_friends_in_session',
          operator: '>=',
          value: 5,
          timeframe: 'session'
        }
      ]
    },
    is_active: true,
    is_automatic: true,
    points: 100
  },
  {
    code: 'session_king',
    title: 'Øktkongen',
    description: 'Hadde høyest promille i økten!',
    category: 'session' as const,
    tier: 'gold' as const,
    tier_order: 3,
    icon_url: null,
    criteria: {
      type: 'threshold',
      conditions: [
        {
          metric: 'max_bac_in_session',
          operator: '>=',
          value: 0.08,
          timeframe: 'session'
        }
      ]
    },
    is_active: true,
    is_automatic: true,
    points: 75
  },
  {
    code: 'party_legend',
    title: 'Festlegende',
    description: 'Fullførte 100 økter - du er en sann legende!',
    category: 'global' as const,
    tier: 'legendary' as const,
    tier_order: 5,
    icon_url: null,
    criteria: {
      type: 'milestone',
      conditions: [
        {
          metric: 'session_count',
          operator: '>=',
          value: 100,
          timeframe: 'all_time'
        }
      ]
    },
    is_active: true,
    is_automatic: true,
    points: 500
  }
];

async function seedBadges() {
  console.log('Creating starter badges...\n');

  for (const badge of starterBadges) {
    const { data, error } = await supabase
      .from('badges')
      .insert(badge)
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to create badge "${badge.title}":`, error.message);
    } else {
      console.log(`✅ Created badge: ${badge.title} (${badge.tier})`);
    }
  }

  console.log('\n✅ Successfully created starter badges!');
  console.log('\nYou can now:');
  console.log('  - View badges in Supabase Studio: http://127.0.0.1:54323/project/default/editor');
  console.log('  - Test badge awarding with the award_badge() function');
  console.log('  - Build the badge UI pages\n');
}

seedBadges().catch(console.error);
