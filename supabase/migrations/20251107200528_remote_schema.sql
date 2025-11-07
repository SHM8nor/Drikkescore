


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."session_status" AS ENUM (
    'active',
    'idle',
    'offline'
);


ALTER TYPE "public"."session_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."are_friends"("p_user_id" "uuid", "p_friend_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM friendships
    WHERE
      ((user_id = p_user_id AND friend_id = p_friend_id) OR
       (user_id = p_friend_id AND friend_id = p_user_id)) AND
      status = 'accepted'
  );
END;
$$;


ALTER FUNCTION "public"."are_friends"("p_user_id" "uuid", "p_friend_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_user_bac"("p_user_id" "uuid", "p_session_id" "uuid", "p_current_time" timestamp with time zone DEFAULT "now"()) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."calculate_user_bac"("p_user_id" "uuid", "p_session_id" "uuid", "p_current_time" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_stale_sessions"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE active_sessions
  SET status = 'offline'
  WHERE
    status != 'offline' AND
    last_seen < now() - interval '5 minutes';

  -- Optionally delete very old offline records (older than 1 hour)
  DELETE FROM active_sessions
  WHERE
    status = 'offline' AND
    updated_at < now() - interval '1 hour';
END;
$$;


ALTER FUNCTION "public"."cleanup_stale_sessions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_user_drinking_data"("target_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  deleted_drinks INTEGER;
  deleted_active_sessions INTEGER;
  deleted_participations INTEGER;
  deleted_sessions INTEGER;
BEGIN
  -- Security check: Must be the user themselves
  IF target_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You can only delete your own drinking data';
  END IF;

  -- Step 1: Delete drink entries
  -- This removes all individual drink records for the user
  DELETE FROM drink_entries WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_drinks = ROW_COUNT;

  -- Step 2: Delete active session records for this user
  -- This must be done before deleting session_participants to prevent orphaned records
  DELETE FROM active_sessions WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_active_sessions = ROW_COUNT;

  -- Step 3: Delete session participations
  -- This removes the user from all sessions they participated in
  DELETE FROM session_participants WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_participations = ROW_COUNT;

  -- Step 4: Delete sessions where user was the sole creator AND no other participants remain
  -- This only deletes sessions that would be orphaned by removing this user
  DELETE FROM sessions
  WHERE created_by = target_user_id
  AND id NOT IN (
    SELECT DISTINCT session_id FROM session_participants
  );
  GET DIAGNOSTICS deleted_sessions = ROW_COUNT;

  -- Return summary of deleted data
  RETURN json_build_object(
    'drinks_deleted', deleted_drinks,
    'active_sessions_deleted', deleted_active_sessions,
    'participations_deleted', deleted_participations,
    'sessions_deleted', deleted_sessions,
    'success', true
  );
END;
$$;


ALTER FUNCTION "public"."delete_user_drinking_data"("target_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."delete_user_drinking_data"("target_user_id" "uuid") IS 'Deletes all drinking-related data for a user including drink entries, session participations, and orphaned sessions. Users can only delete their own data.';



CREATE OR REPLACE FUNCTION "public"."generate_session_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."generate_session_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_friends_sessions"("p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS TABLE("friend_id" "uuid", "friend_name" "text", "friend_avatar_url" "text", "session_id" "uuid", "session_name" "text", "session_code" "text", "status" "public"."session_status", "last_seen" timestamp with time zone, "participant_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN f.user_id = p_user_id THEN f.friend_id
      ELSE f.user_id
    END AS friend_id,
    p.full_name AS friend_name,
    p.avatar_url AS friend_avatar_url,
    s.id AS session_id,
    s.session_name,
    s.session_code,
    a.status,
    a.last_seen,
    (SELECT COUNT(*) FROM session_participants sp WHERE sp.session_id = s.id) AS participant_count
  FROM friendships f
  JOIN profiles p ON (
    (f.user_id = p_user_id AND p.id = f.friend_id) OR
    (f.friend_id = p_user_id AND p.id = f.user_id)
  )
  JOIN active_sessions a ON a.user_id = p.id
  JOIN sessions s ON s.id = a.session_id
  WHERE
    (f.user_id = p_user_id OR f.friend_id = p_user_id) AND
    f.status = 'accepted' AND
    a.status IN ('active', 'idle') AND
    s.end_time > now() -- Only active sessions
  ORDER BY a.last_seen DESC;
END;
$$;


ALTER FUNCTION "public"."get_active_friends_sessions"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_friends"("p_user_id" "uuid") RETURNS TABLE("friend_id" "uuid", "full_name" "text", "avatar_url" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN f.user_id = p_user_id THEN f.friend_id
      ELSE f.user_id
    END AS friend_id,
    p.full_name,
    p.avatar_url,
    f.created_at
  FROM friendships f
  JOIN profiles p ON (
    (f.user_id = p_user_id AND p.id = f.friend_id) OR
    (f.friend_id = p_user_id AND p.id = f.user_id)
  )
  WHERE
    (f.user_id = p_user_id OR f.friend_id = p_user_id) AND
    f.status = 'accepted'
  ORDER BY p.full_name;
END;
$$;


ALTER FUNCTION "public"."get_friends"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_friendship_status"("p_user_id" "uuid", "p_friend_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status
  FROM friendships
  WHERE
    (user_id = p_user_id AND friend_id = p_friend_id) OR
    (user_id = p_friend_id AND friend_id = p_user_id);

  RETURN COALESCE(v_status, 'none');
END;
$$;


ALTER FUNCTION "public"."get_friendship_status"("p_user_id" "uuid", "p_friend_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pending_requests"("p_user_id" "uuid") RETURNS TABLE("friendship_id" "uuid", "requester_id" "uuid", "full_name" "text", "avatar_url" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id AS friendship_id,
    f.user_id AS requester_id,
    p.full_name,
    p.avatar_url,
    f.created_at
  FROM friendships f
  JOIN profiles p ON p.id = f.user_id
  WHERE
    f.friend_id = p_user_id AND
    f.status = 'pending'
  ORDER BY f.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_pending_requests"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_sent_requests"("p_user_id" "uuid") RETURNS TABLE("friendship_id" "uuid", "recipient_id" "uuid", "full_name" "text", "avatar_url" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id AS friendship_id,
    f.friend_id AS recipient_id,
    p.full_name,
    p.avatar_url,
    f.created_at
  FROM friendships f
  JOIN profiles p ON p.id = f.friend_id
  WHERE
    f.user_id = p_user_id AND
    f.status = 'pending'
  ORDER BY f.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_sent_requests"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_session_active_users"("p_session_id" "uuid") RETURNS TABLE("user_id" "uuid", "full_name" "text", "avatar_url" "text", "status" "public"."session_status", "last_seen" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.full_name,
    p.avatar_url,
    a.status,
    a.last_seen
  FROM active_sessions a
  JOIN profiles p ON p.id = a.user_id
  WHERE
    a.session_id = p_session_id AND
    a.status IN ('active', 'idle')
  ORDER BY a.last_seen DESC;
END;
$$;


ALTER FUNCTION "public"."get_session_active_users"("p_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_session_leaderboard"("p_session_id" "uuid", "p_current_time" timestamp with time zone DEFAULT "now"()) RETURNS TABLE("rank" integer, "user_id" "uuid", "full_name" "text", "bac" numeric)
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."get_session_leaderboard"("p_session_id" "uuid", "p_current_time" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, weight_kg, height_cm, gender, age)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'weight_kg')::numeric, 70),
    COALESCE((NEW.raw_user_meta_data->>'height_cm')::numeric, 170),
    COALESCE(NEW.raw_user_meta_data->>'gender', 'male'),
    COALESCE((NEW.raw_user_meta_data->>'age')::integer, 18)
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_session_offline"("p_user_id" "uuid", "p_session_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE active_sessions
  SET status = 'offline', updated_at = now()
  WHERE user_id = p_user_id AND session_id = p_session_id;
END;
$$;


ALTER FUNCTION "public"."mark_session_offline"("p_user_id" "uuid", "p_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_drink_prices_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_drink_prices_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_last_seen"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.last_seen = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_last_seen"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_session_presence"("p_user_id" "uuid", "p_session_id" "uuid", "p_status" "public"."session_status" DEFAULT 'active'::"public"."session_status") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_active_session_id uuid;
BEGIN
  -- Verify user is a participant in the session
  IF NOT EXISTS (
    SELECT 1 FROM session_participants
    WHERE user_id = p_user_id AND session_id = p_session_id
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this session';
  END IF;

  -- Upsert active session record
  INSERT INTO active_sessions (user_id, session_id, status)
  VALUES (p_user_id, p_session_id, p_status)
  ON CONFLICT (user_id, session_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    last_seen = now(),
    updated_at = now()
  RETURNING id INTO v_active_session_id;

  RETURN v_active_session_id;
END;
$$;


ALTER FUNCTION "public"."upsert_session_presence"("p_user_id" "uuid", "p_session_id" "uuid", "p_status" "public"."session_status") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_recap_session"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.last_session_recap_viewed IS NOT NULL THEN
    -- Verify user participated in this session
    IF NOT EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_id = NEW.last_session_recap_viewed
      AND user_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Cannot set recap for session user did not participate in';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_recap_session"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_recap_session"() IS 'Validates that users can only mark recaps as viewed for sessions they participated in';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."active_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_id" "uuid" NOT NULL,
    "status" "public"."session_status" DEFAULT 'active'::"public"."session_status" NOT NULL,
    "last_seen" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."active_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drink_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "volume_ml" numeric(6,2) NOT NULL,
    "alcohol_percentage" numeric(4,2) NOT NULL,
    "consumed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "food_consumed" boolean DEFAULT false,
    "rapid_consumption" boolean DEFAULT false,
    CONSTRAINT "drink_entries_alcohol_percentage_check" CHECK ((("alcohol_percentage" >= (0)::numeric) AND ("alcohol_percentage" <= (100)::numeric))),
    CONSTRAINT "drink_entries_volume_ml_check" CHECK ((("volume_ml" > (0)::numeric) AND ("volume_ml" <= (5000)::numeric)))
);


ALTER TABLE "public"."drink_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drink_prices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "drink_name" character varying(100) NOT NULL,
    "price_amount" numeric(10,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'NOK'::character varying,
    "volume_ml" integer,
    "alcohol_percentage" numeric(4,2),
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."drink_prices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."friendships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friend_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "friendships_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'blocked'::"text"]))),
    CONSTRAINT "no_self_friendship" CHECK (("user_id" <> "friend_id"))
);


ALTER TABLE "public"."friendships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "weight_kg" numeric(5,2) NOT NULL,
    "height_cm" numeric(5,2) NOT NULL,
    "gender" "text" NOT NULL,
    "age" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "avatar_url" "text",
    "role" "text" DEFAULT 'user'::"text",
    "has_accepted_terms" boolean DEFAULT false,
    "terms_accepted_at" timestamp with time zone,
    "privacy_policy_version" integer DEFAULT 1,
    "last_session_recap_viewed" "uuid",
    "last_recap_dismissed_at" timestamp with time zone,
    "session_recaps_enabled" boolean DEFAULT true,
    CONSTRAINT "profiles_age_check" CHECK ((("age" >= 18) AND ("age" <= 120))),
    CONSTRAINT "profiles_gender_check" CHECK (("gender" = ANY (ARRAY['male'::"text", 'female'::"text"]))),
    CONSTRAINT "profiles_height_cm_check" CHECK ((("height_cm" > (0)::numeric) AND ("height_cm" < (300)::numeric))),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'admin'::"text"]))),
    CONSTRAINT "profiles_weight_kg_check" CHECK ((("weight_kg" > (0)::numeric) AND ("weight_kg" < (500)::numeric)))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."avatar_url" IS 'Public URL to user avatar image stored in Supabase Storage';



COMMENT ON COLUMN "public"."profiles"."has_accepted_terms" IS 'Indicates whether the user has accepted the current terms of service';



COMMENT ON COLUMN "public"."profiles"."terms_accepted_at" IS 'Timestamp when the user accepted the terms of service';



COMMENT ON COLUMN "public"."profiles"."privacy_policy_version" IS 'Version number of the privacy policy the user has accepted';



COMMENT ON COLUMN "public"."profiles"."last_session_recap_viewed" IS 'The session ID of the last recap the user has viewed or dismissed';



COMMENT ON COLUMN "public"."profiles"."last_recap_dismissed_at" IS 'Timestamp when the user last dismissed a session recap';



COMMENT ON COLUMN "public"."profiles"."session_recaps_enabled" IS 'Whether user wants to see session recaps after their drinking sessions (Settings toggle)';



CREATE TABLE IF NOT EXISTS "public"."session_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."session_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_code" "text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "session_name" "text",
    CONSTRAINT "sessions_check" CHECK (("end_time" > "start_time"))
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."sessions"."session_name" IS 'Name of the session';



ALTER TABLE ONLY "public"."active_sessions"
    ADD CONSTRAINT "active_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drink_entries"
    ADD CONSTRAINT "drink_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drink_prices"
    ADD CONSTRAINT "drink_prices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_participants"
    ADD CONSTRAINT "session_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_participants"
    ADD CONSTRAINT "session_participants_session_id_user_id_key" UNIQUE ("session_id", "user_id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_session_code_key" UNIQUE ("session_code");



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "unique_friendship" UNIQUE ("user_id", "friend_id");



ALTER TABLE ONLY "public"."active_sessions"
    ADD CONSTRAINT "unique_user_session" UNIQUE ("user_id", "session_id");



CREATE INDEX "idx_active_sessions_last_seen" ON "public"."active_sessions" USING "btree" ("last_seen");



CREATE INDEX "idx_active_sessions_session_id" ON "public"."active_sessions" USING "btree" ("session_id");



CREATE INDEX "idx_active_sessions_status" ON "public"."active_sessions" USING "btree" ("status");



CREATE INDEX "idx_active_sessions_user_id" ON "public"."active_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_drink_entries_consumed_at" ON "public"."drink_entries" USING "btree" ("consumed_at");



CREATE INDEX "idx_drink_entries_session_id" ON "public"."drink_entries" USING "btree" ("session_id");



CREATE INDEX "idx_drink_entries_user_id" ON "public"."drink_entries" USING "btree" ("user_id");



CREATE INDEX "idx_drink_prices_is_default" ON "public"."drink_prices" USING "btree" ("user_id", "is_default");



CREATE INDEX "idx_drink_prices_user_id" ON "public"."drink_prices" USING "btree" ("user_id");



CREATE INDEX "idx_friendships_friend_id" ON "public"."friendships" USING "btree" ("friend_id");



CREATE INDEX "idx_friendships_status" ON "public"."friendships" USING "btree" ("status");



CREATE INDEX "idx_friendships_user_id" ON "public"."friendships" USING "btree" ("user_id");



CREATE INDEX "idx_friendships_user_status" ON "public"."friendships" USING "btree" ("user_id", "status");



CREATE INDEX "idx_profiles_last_recap" ON "public"."profiles" USING "btree" ("last_session_recap_viewed");



CREATE INDEX "idx_profiles_recaps_enabled" ON "public"."profiles" USING "btree" ("session_recaps_enabled") WHERE ("session_recaps_enabled" = true);



CREATE INDEX "idx_profiles_terms_acceptance" ON "public"."profiles" USING "btree" ("has_accepted_terms") WHERE ("has_accepted_terms" = false);



CREATE INDEX "idx_session_participants_session_id" ON "public"."session_participants" USING "btree" ("session_id");



CREATE INDEX "idx_session_participants_user_id" ON "public"."session_participants" USING "btree" ("user_id");



CREATE INDEX "idx_sessions_created_by" ON "public"."sessions" USING "btree" ("created_by");



CREATE INDEX "idx_sessions_session_code" ON "public"."sessions" USING "btree" ("session_code");



CREATE OR REPLACE TRIGGER "check_recap_session_participation" BEFORE UPDATE OF "last_session_recap_viewed" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."validate_recap_session"();



CREATE OR REPLACE TRIGGER "drink_prices_updated_at" BEFORE UPDATE ON "public"."drink_prices" FOR EACH ROW EXECUTE FUNCTION "public"."update_drink_prices_updated_at"();



CREATE OR REPLACE TRIGGER "update_active_sessions_last_seen" BEFORE UPDATE ON "public"."active_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_last_seen"();



CREATE OR REPLACE TRIGGER "update_active_sessions_updated_at" BEFORE UPDATE ON "public"."active_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_friendships_updated_at" BEFORE UPDATE ON "public"."friendships" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sessions_updated_at" BEFORE UPDATE ON "public"."sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."active_sessions"
    ADD CONSTRAINT "active_sessions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."active_sessions"
    ADD CONSTRAINT "active_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."drink_entries"
    ADD CONSTRAINT "drink_entries_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."drink_entries"
    ADD CONSTRAINT "drink_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."drink_prices"
    ADD CONSTRAINT "drink_prices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "fk_last_session_recap_viewed" FOREIGN KEY ("last_session_recap_viewed") REFERENCES "public"."sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_participants"
    ADD CONSTRAINT "session_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_participants"
    ADD CONSTRAINT "session_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete sessions" ON "public"."sessions" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update sessions" ON "public"."sessions" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all sessions" ON "public"."sessions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "Users can create sessions" ON "public"."sessions" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can delete own active sessions" ON "public"."active_sessions" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete own drinks" ON "public"."drink_entries" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their friendships" ON "public"."friendships" FOR DELETE USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (( SELECT "auth"."uid"() AS "uid") = "friend_id")));



CREATE POLICY "Users can delete their own drink prices" ON "public"."drink_prices" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can discover active sessions" ON "public"."sessions" FOR SELECT TO "authenticated" USING ((("start_time" <= "now"()) AND ("end_time" > "now"())));



CREATE POLICY "Users can insert own active sessions" ON "public"."active_sessions" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."session_participants" "sp"
  WHERE (("sp"."session_id" = "active_sessions"."session_id") AND ("sp"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can insert own drinks" ON "public"."drink_entries" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."session_participants"
  WHERE (("session_participants"."session_id" = "drink_entries"."session_id") AND ("session_participants"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own drink prices" ON "public"."drink_prices" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can join sessions" ON "public"."session_participants" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can leave sessions" ON "public"."session_participants" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can send friend requests" ON "public"."friendships" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "user_id") AND ("status" = 'pending'::"text")));



CREATE POLICY "Users can update friend requests sent to them" ON "public"."friendships" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "friend_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "friend_id"));



CREATE POLICY "Users can update own active sessions" ON "public"."active_sessions" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own drinks" ON "public"."drink_entries" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can update own sessions" ON "public"."sessions" FOR UPDATE TO "authenticated" USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can update their own drink prices" ON "public"."drink_prices" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own friend requests" ON "public"."friendships" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view active sessions in their sessions" ON "public"."active_sessions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."session_participants" "sp"
  WHERE (("sp"."session_id" = "active_sessions"."session_id") AND ("sp"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can view drinks in their sessions" ON "public"."drink_entries" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."session_participants"
  WHERE (("session_participants"."session_id" = "drink_entries"."session_id") AND ("session_participants"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users can view friend profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."friendships" "f"
  WHERE (("f"."status" = 'accepted'::"text") AND ((("f"."user_id" = "auth"."uid"()) AND ("f"."friend_id" = "profiles"."id")) OR (("f"."friend_id" = "auth"."uid"()) AND ("f"."user_id" = "profiles"."id")))))));



CREATE POLICY "Users can view friends' active sessions" ON "public"."active_sessions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."friendships" "f"
  WHERE (((("f"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("f"."friend_id" = "active_sessions"."user_id")) OR (("f"."friend_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("f"."user_id" = "active_sessions"."user_id"))) AND ("f"."status" = 'accepted'::"text")))));



CREATE POLICY "Users can view joined sessions" ON "public"."sessions" FOR SELECT TO "authenticated" USING (("id" IN ( SELECT "sp"."session_id"
   FROM "public"."session_participants" "sp"
  WHERE ("sp"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can view own sessions" ON "public"."sessions" FOR SELECT TO "authenticated" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can view participants in their sessions" ON "public"."session_participants" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."sessions" "s"
  WHERE (("s"."id" = "session_participants"."session_id") AND ("s"."created_by" = "auth"."uid"()))))));



CREATE POLICY "Users can view their own active sessions" ON "public"."active_sessions" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own drink prices" ON "public"."drink_prices" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own friendships" ON "public"."friendships" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "user_id") OR (( SELECT "auth"."uid"() AS "uid") = "friend_id")));



ALTER TABLE "public"."active_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drink_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drink_prices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."friendships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."active_sessions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."drink_entries";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."friendships";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."session_participants";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."are_friends"("p_user_id" "uuid", "p_friend_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."are_friends"("p_user_id" "uuid", "p_friend_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."are_friends"("p_user_id" "uuid", "p_friend_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_user_bac"("p_user_id" "uuid", "p_session_id" "uuid", "p_current_time" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_user_bac"("p_user_id" "uuid", "p_session_id" "uuid", "p_current_time" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_user_bac"("p_user_id" "uuid", "p_session_id" "uuid", "p_current_time" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_stale_sessions"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_stale_sessions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_stale_sessions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_user_drinking_data"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_user_drinking_data"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_user_drinking_data"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_session_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_session_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_session_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_friends_sessions"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_friends_sessions"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_friends_sessions"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_friends"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_friends"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_friends"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_friendship_status"("p_user_id" "uuid", "p_friend_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_friendship_status"("p_user_id" "uuid", "p_friend_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_friendship_status"("p_user_id" "uuid", "p_friend_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pending_requests"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_pending_requests"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pending_requests"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_sent_requests"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_sent_requests"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_sent_requests"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_session_active_users"("p_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_session_active_users"("p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_session_active_users"("p_session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_session_leaderboard"("p_session_id" "uuid", "p_current_time" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_session_leaderboard"("p_session_id" "uuid", "p_current_time" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_session_leaderboard"("p_session_id" "uuid", "p_current_time" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_session_offline"("p_user_id" "uuid", "p_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_session_offline"("p_user_id" "uuid", "p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_session_offline"("p_user_id" "uuid", "p_session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_drink_prices_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_drink_prices_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_drink_prices_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_last_seen"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_last_seen"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_last_seen"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_session_presence"("p_user_id" "uuid", "p_session_id" "uuid", "p_status" "public"."session_status") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_session_presence"("p_user_id" "uuid", "p_session_id" "uuid", "p_status" "public"."session_status") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_session_presence"("p_user_id" "uuid", "p_session_id" "uuid", "p_status" "public"."session_status") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_recap_session"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_recap_session"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_recap_session"() TO "service_role";


















GRANT ALL ON TABLE "public"."active_sessions" TO "anon";
GRANT ALL ON TABLE "public"."active_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."active_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."drink_entries" TO "anon";
GRANT ALL ON TABLE "public"."drink_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."drink_entries" TO "service_role";



GRANT ALL ON TABLE "public"."drink_prices" TO "anon";
GRANT ALL ON TABLE "public"."drink_prices" TO "authenticated";
GRANT ALL ON TABLE "public"."drink_prices" TO "service_role";



GRANT ALL ON TABLE "public"."friendships" TO "anon";
GRANT ALL ON TABLE "public"."friendships" TO "authenticated";
GRANT ALL ON TABLE "public"."friendships" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."session_participants" TO "anon";
GRANT ALL ON TABLE "public"."session_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."session_participants" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































