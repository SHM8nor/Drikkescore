-- =============================================================================
-- Migration: Create friendships table
-- Description: Implements bi-directional friend relationships with request system
-- Author: Claude Code
-- Date: 2025-11-04
-- =============================================================================

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id),
  CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_friendships_user_status ON friendships(user_id, status);

-- Add trigger for updated_at
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS Policies for friendships
-- =============================================================================

-- Policy 1: Users can view friendships where they are involved (either as user or friend)
CREATE POLICY "Users can view their own friendships"
  ON friendships FOR SELECT
  USING (
    auth.uid() = user_id OR auth.uid() = friend_id
  );

-- Policy 2: Users can send friend requests (create pending friendships)
CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    status = 'pending' AND
    -- Prevent duplicate requests (check reverse direction doesn't exist)
    NOT EXISTS (
      SELECT 1 FROM friendships
      WHERE user_id = NEW.friend_id
        AND friend_id = NEW.user_id
    )
  );

-- Policy 3: Users can update friendship status if they are the recipient (friend_id)
-- This allows accepting/declining friend requests
CREATE POLICY "Users can update friend requests sent to them"
  ON friendships FOR UPDATE
  USING (auth.uid() = friend_id)
  WITH CHECK (auth.uid() = friend_id);

-- Policy 4: Users can update friendships they initiated (for blocking, etc.)
CREATE POLICY "Users can update their own friend requests"
  ON friendships FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 5: Users can delete friendships where they are involved
CREATE POLICY "Users can delete their friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- =============================================================================
-- Helper Functions for Friendships
-- =============================================================================

-- Function: Get all accepted friends for a user (bi-directional)
CREATE OR REPLACE FUNCTION get_friends(p_user_id uuid)
RETURNS TABLE (
  friend_id uuid,
  full_name text,
  avatar_url text,
  created_at timestamptz
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get pending friend requests sent to a user
CREATE OR REPLACE FUNCTION get_pending_requests(p_user_id uuid)
RETURNS TABLE (
  friendship_id uuid,
  requester_id uuid,
  full_name text,
  avatar_url text,
  created_at timestamptz
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get pending friend requests sent by a user
CREATE OR REPLACE FUNCTION get_sent_requests(p_user_id uuid)
RETURNS TABLE (
  friendship_id uuid,
  recipient_id uuid,
  full_name text,
  avatar_url text,
  created_at timestamptz
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if two users are friends
CREATE OR REPLACE FUNCTION are_friends(p_user_id uuid, p_friend_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM friendships
    WHERE
      ((user_id = p_user_id AND friend_id = p_friend_id) OR
       (user_id = p_friend_id AND friend_id = p_user_id)) AND
      status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get friendship status between two users
CREATE OR REPLACE FUNCTION get_friendship_status(p_user_id uuid, p_friend_id uuid)
RETURNS text AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Grant necessary permissions
-- =============================================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_friends(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_requests(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sent_requests(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION are_friends(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_friendship_status(uuid, uuid) TO authenticated;

-- =============================================================================
-- Enable Realtime for friendships
-- =============================================================================

-- Add friendships table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;

-- =============================================================================
-- Verification Queries
-- =============================================================================

-- Check RLS policies
-- SELECT schemaname, tablename, policyname
-- FROM pg_policies
-- WHERE tablename = 'friendships'
-- ORDER BY policyname;

-- Check indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'friendships';
