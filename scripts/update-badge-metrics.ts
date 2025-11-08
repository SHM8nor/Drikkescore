import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

async function updateBadgeMetrics() {
  console.log('Updating badge metrics to fix "max_bac" → "max_bac_in_session"...\n');

  // Update the session_king badge
  const { data, error } = await supabase
    .from('badges')
    .update({
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
      }
    })
    .eq('code', 'session_king')
    .select();

  if (error) {
    console.error('❌ Failed to update badge:', error.message);
  } else {
    console.log('✅ Updated "Øktkongen" badge');
    console.log('   Old metric: max_bac');
    console.log('   New metric: max_bac_in_session');
  }

  // Verify the update
  const { data: badge } = await supabase
    .from('badges')
    .select('code, title, criteria')
    .eq('code', 'session_king')
    .single();

  if (badge) {
    console.log('\n📊 Current badge criteria:');
    console.log(JSON.stringify(badge.criteria, null, 2));
  }

  console.log('\n✅ Badge metric update complete!');
}

updateBadgeMetrics().catch(console.error);
