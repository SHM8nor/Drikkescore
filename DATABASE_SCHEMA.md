# Database Schema

This document describes the database schema for the Drikkescore application and provides SQL queries to set up the database in Supabase.

## Overview

The database consists of four main tables:
1. **profiles** - User profile data for BAC calculations
2. **sessions** - Drinking sessions with start/end times
3. **session_participants** - Many-to-many relationship between users and sessions
4. **drink_entries** - Individual drink records

## Schema Diagram

```
auth.users (Supabase Auth)
    ↓
profiles (user data for BAC calculation)
    ↓
session_participants ← sessions (drinking sessions)
    ↓
drink_entries (individual drinks)
```

## Tables

### 1. profiles

Stores user profile information needed for BAC calculation using the Widmark formula.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, references auth.users(id) |
| full_name | text | User's full name |
| weight_kg | numeric(5,2) | Weight in kilograms |
| height_cm | numeric(5,2) | Height in centimeters |
| gender | text | 'male' or 'female' (for Widmark constant) |
| age | integer | User's age |
| created_at | timestamptz | Record creation timestamp |
| updated_at | timestamptz | Record update timestamp |

### 2. sessions

Stores drinking session information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| session_code | text | Unique 6-character code for joining |
| created_by | uuid | References profiles(id) |
| start_time | timestamptz | Session start time |
| end_time | timestamptz | Session end time |
| created_at | timestamptz | Record creation timestamp |
| updated_at | timestamptz | Record update timestamp |

### 3. session_participants

Junction table linking users to sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| session_id | uuid | References sessions(id) |
| user_id | uuid | References profiles(id) |
| joined_at | timestamptz | When user joined the session |

### 4. drink_entries

Stores individual drink records for BAC calculation.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| session_id | uuid | References sessions(id) |
| user_id | uuid | References profiles(id) |
| volume_ml | numeric(6,2) | Drink volume in milliliters |
| alcohol_percentage | numeric(4,2) | Alcohol percentage (e.g., 5.0 for 5%) |
| consumed_at | timestamptz | When the drink was consumed |
| created_at | timestamptz | Record creation timestamp |

## SQL Setup Queries

Run these queries in the Supabase SQL Editor in order:

### 1. Create profiles table

```sql
-- Create profiles table
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL,
  weight_kg numeric(5,2) NOT NULL CHECK (weight_kg > 0 AND weight_kg < 500),
  height_cm numeric(5,2) NOT NULL CHECK (height_cm > 0 AND height_cm < 300),
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  age integer NOT NULL CHECK (age >= 18 AND age <= 120),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. Create sessions table

```sql
-- Create sessions table
CREATE TABLE sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_code text NOT NULL UNIQUE,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CHECK (end_time > start_time)
);

-- Create index for session_code lookups
CREATE INDEX idx_sessions_session_code ON sessions(session_code);
CREATE INDEX idx_sessions_created_by ON sessions(created_by);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create basic policies for sessions (more policies added after session_participants table is created)
-- Users can view sessions they created
CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = created_by);

-- Users can insert their own sessions
CREATE POLICY "Users can insert sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can update sessions they created
CREATE POLICY "Users can update own sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = created_by);

-- Create trigger for sessions
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique session codes
CREATE OR REPLACE FUNCTION generate_session_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude similar chars
  result text := '';
  i integer := 0;
  code_exists boolean := true;
BEGIN
  WHILE code_exists LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;

    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM sessions WHERE session_code = result) INTO code_exists;
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### 3. Create session_participants table

```sql
-- Create session_participants table
CREATE TABLE session_participants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(session_id, user_id)
);

-- Create indexes
CREATE INDEX idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX idx_session_participants_user_id ON session_participants(user_id);

-- Enable Row Level Security
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for session_participants
-- Users can view participants in sessions they're part of
CREATE POLICY "Users can view participants in their sessions"
  ON session_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_participants sp
      WHERE sp.session_id = session_participants.session_id
      AND sp.user_id = auth.uid()
    )
  );

-- Users can join sessions (insert themselves)
CREATE POLICY "Users can join sessions"
  ON session_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can leave sessions (delete themselves)
CREATE POLICY "Users can leave sessions"
  ON session_participants FOR DELETE
  USING (auth.uid() = user_id);
```

### 4. Add additional sessions policy (now that session_participants exists)

```sql
-- Now we can add the policy for viewing sessions user participates in
CREATE POLICY "Users can view sessions they participate in"
  ON sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = sessions.id
      AND session_participants.user_id = auth.uid()
    )
  );
```

### 5. Create drink_entries table

```sql
-- Create drink_entries table
CREATE TABLE drink_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  volume_ml numeric(6,2) NOT NULL CHECK (volume_ml > 0 AND volume_ml <= 5000),
  alcohol_percentage numeric(4,2) NOT NULL CHECK (alcohol_percentage >= 0 AND alcohol_percentage <= 100),
  consumed_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX idx_drink_entries_session_id ON drink_entries(session_id);
CREATE INDEX idx_drink_entries_user_id ON drink_entries(user_id);
CREATE INDEX idx_drink_entries_consumed_at ON drink_entries(consumed_at);

-- Enable Row Level Security
ALTER TABLE drink_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for drink_entries
-- Users can view drink entries in sessions they're part of
CREATE POLICY "Users can view drinks in their sessions"
  ON drink_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = drink_entries.session_id
      AND session_participants.user_id = auth.uid()
    )
  );

-- Users can insert their own drink entries
CREATE POLICY "Users can insert own drinks"
  ON drink_entries FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.session_id = drink_entries.session_id
      AND session_participants.user_id = auth.uid()
    )
  );

-- Users can update their own drink entries
CREATE POLICY "Users can update own drinks"
  ON drink_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own drink entries
CREATE POLICY "Users can delete own drinks"
  ON drink_entries FOR DELETE
  USING (auth.uid() = user_id);
```

### 6. Create helper functions for the application

```sql
-- Function to calculate current BAC for a user in a session
CREATE OR REPLACE FUNCTION calculate_user_bac(
  p_user_id uuid,
  p_session_id uuid,
  p_current_time timestamptz DEFAULT now()
)
RETURNS numeric AS $$
DECLARE
  v_weight_kg numeric;
  v_gender text;
  v_widmark_r numeric;
  v_total_alcohol_grams numeric := 0;
  v_time_elapsed_hours numeric;
  v_bac numeric;
  v_first_drink_time timestamptz;
BEGIN
  -- Get user profile data
  SELECT weight_kg, gender INTO v_weight_kg, v_gender
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Set Widmark constant based on gender
  v_widmark_r := CASE WHEN v_gender = 'male' THEN 0.68 ELSE 0.55 END;

  -- Get first drink time
  SELECT MIN(consumed_at) INTO v_first_drink_time
  FROM drink_entries
  WHERE user_id = p_user_id AND session_id = p_session_id;

  IF v_first_drink_time IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate total alcohol consumed in grams
  -- Formula: volume_ml * (alcohol_percentage / 100) * 0.789 (density of ethanol)
  SELECT COALESCE(SUM(volume_ml * (alcohol_percentage / 100.0) * 0.789), 0)
  INTO v_total_alcohol_grams
  FROM drink_entries
  WHERE user_id = p_user_id
    AND session_id = p_session_id
    AND consumed_at <= p_current_time;

  -- Calculate BAC using Widmark formula
  -- BAC = (alcohol in grams / (body weight in grams * r)) * 100
  v_bac := (v_total_alcohol_grams / (v_weight_kg * 1000 * v_widmark_r)) * 100;

  -- Apply elimination rate (0.015% per hour)
  v_time_elapsed_hours := EXTRACT(EPOCH FROM (p_current_time - v_first_drink_time)) / 3600.0;
  v_bac := v_bac - (0.015 * v_time_elapsed_hours);

  -- BAC cannot be negative
  v_bac := GREATEST(v_bac, 0);

  RETURN ROUND(v_bac, 4);
END;
$$ LANGUAGE plpgsql;

-- Function to get leaderboard for a session
CREATE OR REPLACE FUNCTION get_session_leaderboard(
  p_session_id uuid,
  p_current_time timestamptz DEFAULT now()
)
RETURNS TABLE (
  rank integer,
  user_id uuid,
  full_name text,
  bac numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY calculate_user_bac(sp.user_id, sp.session_id, p_current_time) DESC)::integer as rank,
    sp.user_id,
    p.full_name,
    calculate_user_bac(sp.user_id, sp.session_id, p_current_time) as bac
  FROM session_participants sp
  JOIN profiles p ON p.id = sp.user_id
  WHERE sp.session_id = p_session_id
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql;
```

## Usage Examples

### Create a new session

```sql
INSERT INTO sessions (session_code, created_by, start_time, end_time)
VALUES (
  generate_session_code(),
  'user-uuid-here',
  '2025-10-24 20:00:00+00',
  '2025-10-25 02:00:00+00'
);
```

### Join a session

```sql
INSERT INTO session_participants (session_id, user_id)
VALUES ('session-uuid-here', 'user-uuid-here');
```

### Add a drink entry

```sql
INSERT INTO drink_entries (session_id, user_id, volume_ml, alcohol_percentage)
VALUES (
  'session-uuid-here',
  'user-uuid-here',
  330, -- 330ml (standard beer can)
  4.5  -- 4.5% alcohol
);
```

### Get current leaderboard

```sql
SELECT * FROM get_session_leaderboard('session-uuid-here');
```

### Calculate user's current BAC

```sql
SELECT calculate_user_bac('user-uuid-here', 'session-uuid-here');
```

## BAC Calculation Formula

The application uses the **Widmark Formula**:

```
BAC = (A / (W × r)) × 100 - (0.015 × t)

Where:
- A = Total alcohol consumed in grams
- W = Body weight in kilograms
- r = Widmark constant (0.68 for males, 0.55 for females)
- t = Time elapsed since first drink (in hours)
- 0.015 = Average alcohol elimination rate per hour

Alcohol in grams = volume_ml × (alcohol_percentage / 100) × 0.789
```

## Notes

- All times are stored in UTC (timestamptz)
- Session codes are 6 characters using easily distinguishable characters
- BAC values are stored as percentages (e.g., 0.08 = 0.08%)
- The elimination rate of 0.015% per hour is an average and varies by individual
- Row Level Security (RLS) ensures users can only access their own data and sessions they participate in
