-- Fix: Allow users to view profiles of other participants in their sessions
-- This is needed so users can see other participants' names and BAC data

CREATE POLICY "Users can view profiles of session participants"
  ON profiles FOR SELECT
  USING (
    -- User can view profiles of people in the same session
    EXISTS (
      SELECT 1
      FROM session_participants sp1
      INNER JOIN session_participants sp2
        ON sp1.session_id = sp2.session_id
      WHERE sp1.user_id = auth.uid()
        AND sp2.user_id = profiles.id
    )
  );
