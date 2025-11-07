/**
 * Script to create test users in local Supabase
 * Run with: npx tsx scripts/seed-users.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const testUsers = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'test1@example.com',
    password: 'password123',
    full_name: 'Test User 1',
    weight_kg: 75,
    height_cm: 180,
    gender: 'male',
    age: 25,
    role: 'user',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'test2@example.com',
    password: 'password123',
    full_name: 'Test User 2',
    weight_kg: 65,
    height_cm: 165,
    gender: 'female',
    age: 23,
    role: 'user',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'admin@example.com',
    password: 'password123',
    full_name: 'Admin User',
    weight_kg: 80,
    height_cm: 185,
    gender: 'male',
    age: 30,
    role: 'admin',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'test4@example.com',
    password: 'password123',
    full_name: 'Test User 4',
    weight_kg: 70,
    height_cm: 175,
    gender: 'male',
    age: 28,
    role: 'user',
  },
]

async function createTestUsers() {
  console.log('Creating test users...\n')

  let successCount = 0

  for (const user of testUsers) {
    try {
      // Try to create auth user with admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
        },
      })

      let userId: string

      if (authError) {
        if (authError.message.includes('already been registered')) {
          console.log(`ℹ️  Auth user already exists: ${user.email}`)
          // Try to get the existing user
          const { data: users } = await supabase.auth.admin.listUsers()
          const existingUser = users?.users.find((u) => u.email === user.email)
          if (existingUser) {
            userId = existingUser.id
            console.log(`   Using existing user ID: ${userId}`)
          } else {
            console.error(`❌ Could not find existing user ${user.email}`)
            continue
          }
        } else {
          console.error(`❌ Failed to create auth user ${user.email}:`, authError.message)
          continue
        }
      } else {
        userId = authData.user.id
        console.log(`✅ Created auth user: ${user.email}`)
      }

      // Create or update profile
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: user.full_name,
        weight_kg: user.weight_kg,
        height_cm: user.height_cm,
        gender: user.gender,
        age: user.age,
        role: user.role,
      })

      if (profileError) {
        console.error(`❌ Failed to create profile for ${user.email}:`, profileError.message)
      } else {
        console.log(`✅ Created/updated profile for: ${user.email}`)
        successCount++
      }

      console.log()
    } catch (error) {
      console.error(`❌ Error creating user ${user.email}:`, error)
    }
  }

  if (successCount > 0) {
    console.log(`\n✅ Successfully set up ${successCount} test user(s)!`)
    console.log('\nYou can now login with:')
    testUsers.forEach((user) => {
      console.log(`  - ${user.email} / password123 ${user.role === 'admin' ? '(admin)' : ''}`)
    })
  } else {
    console.log('\n❌ No users were set up successfully')
  }
}

createTestUsers().catch(console.error)
