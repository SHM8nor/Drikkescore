import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

async function testBadgeFix() {
  console.log('Testing Badge Duplicate Fix...\n');

  // Get test user
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, display_name')
    .limit(1)
    .single();

  if (userError || !user) {
    console.error('❌ Failed to get test user:', userError);
    return;
  }

  console.log(`📝 Test user: ${user.display_name} (${user.id})\n`);

  // Create two test sessions
  const session1Id = crypto.randomUUID();
  const session2Id = crypto.randomUUID();

  console.log('Creating test sessions...');
  const { error: session1Error } = await supabase
    .from('sessions')
    .insert({
      id: session1Id,
      session_code: 'TEST01',
      created_by: user.id,
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 3600000).toISOString(),
    });

  const { error: session2Error } = await supabase
    .from('sessions')
    .insert({
      id: session2Id,
      session_code: 'TEST02',
      created_by: user.id,
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 3600000).toISOString(),
    });

  if (session1Error || session2Error) {
    console.error('❌ Failed to create sessions');
    return;
  }

  console.log('✅ Created test sessions\n');

  // TEST 1: Award "first_drink" (milestone) from session 1
  console.log('='.repeat(60));
  console.log('TEST 1: Award milestone badge "first_drink" from session 1');
  console.log('='.repeat(60));
  const { data: badge1, error: error1 } = await supabase
    .rpc('award_badge', {
      p_user_id: user.id,
      p_badge_code: 'first_drink',
      p_session_id: session1Id,
      p_metadata: { test: 'session1' }
    });

  if (error1) {
    console.error('❌ Test 1 failed:', error1.message);
  } else {
    console.log('✅ Test 1 passed - Badge awarded, ID:', badge1);
  }

  // Check database to see what was stored
  const { data: check1 } = await supabase
    .from('user_badges')
    .select('*, badge:badges(title, category)')
    .eq('id', badge1)
    .single();

  console.log('📊 Badge in database:');
  console.log(`   - Title: ${(check1?.badge as any)?.title}`);
  console.log(`   - Category: ${(check1?.badge as any)?.category}`);
  console.log(`   - Session ID: ${check1?.session_id || 'NULL'} ${check1?.session_id === null ? '✅ (Correct - forced to NULL for milestone)' : '❌ (Wrong - should be NULL)'}`);
  console.log('');

  // TEST 2: Award "first_drink" again from session 2 (should return same badge)
  console.log('='.repeat(60));
  console.log('TEST 2: Award same milestone badge from session 2');
  console.log('Expected: Should return existing badge, NO duplicate');
  console.log('='.repeat(60));
  const { data: badge2, error: error2 } = await supabase
    .rpc('award_badge', {
      p_user_id: user.id,
      p_badge_code: 'first_drink',
      p_session_id: session2Id,
      p_metadata: { test: 'session2' }
    });

  if (error2) {
    console.error('❌ Test 2 failed:', error2.message);
  } else {
    if (badge2 === badge1) {
      console.log('✅ Test 2 passed - Returned existing badge (idempotent)');
      console.log(`   Badge IDs match: ${badge1} === ${badge2}`);
    } else {
      console.log('❌ Test 2 FAILED - Created duplicate badge!');
      console.log(`   Different IDs: ${badge1} !== ${badge2}`);
    }
  }

  // Count total "first_drink" badges for this user
  const { data: badgeCount } = await supabase
    .from('user_badges')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('badge_id', (await supabase.from('badges').select('id').eq('code', 'first_drink').single()).data?.id);

  console.log(`📊 Total "first_drink" badges: ${badgeCount?.length || 0} ${badgeCount?.length === 1 ? '✅ (Correct)' : '❌ (Should be 1)'}`);
  console.log('');

  // TEST 3: Award "session_king" (session badge) from session 1
  console.log('='.repeat(60));
  console.log('TEST 3: Award session badge "session_king" from session 1');
  console.log('='.repeat(60));
  const { data: badge3, error: error3 } = await supabase
    .rpc('award_badge', {
      p_user_id: user.id,
      p_badge_code: 'session_king',
      p_session_id: session1Id,
      p_metadata: { bac: 0.12 }
    });

  if (error3) {
    console.error('❌ Test 3 failed:', error3.message);
  } else {
    console.log('✅ Test 3 passed - Badge awarded, ID:', badge3);
  }

  const { data: check3 } = await supabase
    .from('user_badges')
    .select('*, badge:badges(title, category)')
    .eq('id', badge3)
    .single();

  console.log('📊 Badge in database:');
  console.log(`   - Title: ${(check3?.badge as any)?.title}`);
  console.log(`   - Category: ${(check3?.badge as any)?.category}`);
  console.log(`   - Session ID: ${check3?.session_id} ${check3?.session_id === session1Id ? '✅ (Correct - tied to session)' : '❌ (Wrong)'}`);
  console.log('');

  // TEST 4: Award "session_king" again from session 2 (should create NEW badge)
  console.log('='.repeat(60));
  console.log('TEST 4: Award same session badge from session 2');
  console.log('Expected: Should create NEW badge (can earn once per session)');
  console.log('='.repeat(60));
  const { data: badge4, error: error4 } = await supabase
    .rpc('award_badge', {
      p_user_id: user.id,
      p_badge_code: 'session_king',
      p_session_id: session2Id,
      p_metadata: { bac: 0.15 }
    });

  if (error4) {
    console.error('❌ Test 4 failed:', error4.message);
  } else {
    if (badge4 !== badge3) {
      console.log('✅ Test 4 passed - Created NEW badge for different session');
      console.log(`   Different IDs: ${badge3} !== ${badge4}`);
    } else {
      console.log('❌ Test 4 FAILED - Should have created new badge!');
      console.log(`   Same IDs: ${badge3} === ${badge4}`);
    }
  }

  // Count total "session_king" badges
  const { data: sessionKingCount } = await supabase
    .from('user_badges')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('badge_id', (await supabase.from('badges').select('id').eq('code', 'session_king').single()).data?.id);

  console.log(`📊 Total "session_king" badges: ${sessionKingCount?.length || 0} ${sessionKingCount?.length === 2 ? '✅ (Correct - one per session)' : '❌ (Should be 2)'}`);
  console.log('');

  // Final Summary
  console.log('='.repeat(60));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(60));

  const { data: allBadges } = await supabase
    .from('user_badges')
    .select('*, badge:badges(title, category)')
    .eq('user_id', user.id);

  console.log(`\n📊 User has ${allBadges?.length || 0} total badge(s):`);
  allBadges?.forEach((ub: any) => {
    console.log(`  - ${ub.badge.title} (${ub.badge.category}) - Session: ${ub.session_id || 'NULL'}`);
  });

  console.log('\n✅ All tests completed!');

  if (badgeCount?.length === 1 && sessionKingCount?.length === 2) {
    console.log('\n🎉 Badge duplicate fix is working correctly!');
  } else {
    console.log('\n❌ Badge duplicate fix has issues - review results above');
  }
}

testBadgeFix().catch(console.error);
