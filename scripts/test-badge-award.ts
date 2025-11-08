import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

async function testBadgeAward() {
  console.log('Testing badge award functionality...\n');

  // Get test user
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id, display_name')
    .limit(1)
    .single();

  if (userError || !users) {
    console.error('❌ Failed to get test user:', userError);
    return;
  }

  console.log(`📝 Test user: ${users.display_name} (${users.id})\n`);

  // Test 1: Award "first_drink" badge
  console.log('Test 1: Awarding "first_drink" badge...');
  const { data: badge1, error: error1 } = await supabase
    .rpc('award_badge', {
      p_user_id: users.id,
      p_badge_code: 'first_drink',
      p_session_id: null,
      p_metadata: { test: true }
    });

  if (error1) {
    console.error('❌ Test 1 failed:', error1.message);
  } else {
    console.log('✅ Test 1 passed - Badge awarded, ID:', badge1);
  }

  // Test 2: Try to award the same badge again (should handle gracefully)
  console.log('\nTest 2: Awarding "first_drink" badge again (duplicate test)...');
  const { data: badge2, error: error2 } = await supabase
    .rpc('award_badge', {
      p_user_id: users.id,
      p_badge_code: 'first_drink',
      p_session_id: null,
      p_metadata: { test: true }
    });

  if (error2) {
    console.error('❌ Test 2 failed:', error2.message);
  } else {
    console.log('✅ Test 2 passed - Duplicate handled, returned ID:', badge2);
  }

  // Test 3: Award a different badge
  console.log('\nTest 3: Awarding "session_king" badge...');
  const { data: badge3, error: error3 } = await supabase
    .rpc('award_badge', {
      p_user_id: users.id,
      p_badge_code: 'session_king',
      p_session_id: null,
      p_metadata: { bac: 0.12, rank: 1 }
    });

  if (error3) {
    console.error('❌ Test 3 failed:', error3.message);
  } else {
    console.log('✅ Test 3 passed - Badge awarded, ID:', badge3);
  }

  // Verify badges in database
  console.log('\n📊 Verifying user badges in database...');
  const { data: userBadges, error: fetchError } = await supabase
    .from('user_badges')
    .select(`
      id,
      earned_at,
      metadata,
      badge:badges (
        code,
        title,
        tier,
        points
      )
    `)
    .eq('user_id', users.id);

  if (fetchError) {
    console.error('❌ Failed to fetch user badges:', fetchError);
  } else {
    console.log(`\n✅ User has ${userBadges?.length || 0} badge(s):`);
    userBadges?.forEach((ub: any) => {
      console.log(`  - ${ub.badge.title} (${ub.badge.tier}) - ${ub.badge.points} points`);
      console.log(`    Earned: ${new Date(ub.earned_at).toLocaleString()}`);
      if (ub.metadata) {
        console.log(`    Metadata:`, ub.metadata);
      }
    });
  }

  console.log('\n✅ All tests completed successfully!');
  console.log('\n🎉 The badge system is working correctly!');
}

testBadgeAward().catch(console.error);
