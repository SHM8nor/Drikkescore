-- Theme Analytics Migration
-- Creates views and functions for tracking theme usage statistics

-- =============================================================================
-- Theme Statistics View
-- =============================================================================

-- Create a view that aggregates session statistics by theme type
CREATE OR REPLACE VIEW public.theme_statistics AS
SELECT
  s.session_type,
  COUNT(DISTINCT s.id) AS total_sessions,
  COUNT(DISTINCT sp.user_id) AS total_participants,
  COUNT(DISTINCT CASE
    WHEN s.end_time > NOW() THEN s.id
    ELSE NULL
  END) AS active_sessions,
  COUNT(DISTINCT de.id) AS total_drinks,
  COALESCE(AVG(
    (SELECT COUNT(*)
     FROM public.session_participants sp2
     WHERE sp2.session_id = s.id)
  ), 0) AS avg_participants_per_session,
  MIN(s.created_at) AS first_session_created,
  MAX(s.created_at) AS last_session_created
FROM public.sessions s
LEFT JOIN public.session_participants sp ON s.id = sp.session_id
LEFT JOIN public.drink_entries de ON s.id = de.session_id
GROUP BY s.session_type;

-- Add comment
COMMENT ON VIEW public.theme_statistics IS 'Aggregated statistics for each session theme type';

-- =============================================================================
-- Badge Awards by Theme View
-- =============================================================================

-- Create a view that shows badge awards grouped by session theme
CREATE OR REPLACE VIEW public.theme_badge_statistics AS
SELECT
  s.session_type,
  b.category,
  COUNT(DISTINCT ub.id) AS total_awards,
  COUNT(DISTINCT ub.user_id) AS unique_recipients,
  COUNT(DISTINCT ub.session_id) AS sessions_with_awards,
  b.title AS badge_name,
  b.id AS badge_id
FROM public.sessions s
INNER JOIN public.user_badges ub ON s.id = ub.session_id
INNER JOIN public.badges b ON ub.badge_id = b.id
GROUP BY s.session_type, b.category, b.title, b.id
ORDER BY s.session_type, total_awards DESC;

-- Add comment
COMMENT ON VIEW public.theme_badge_statistics IS 'Badge award statistics grouped by session theme type';

-- =============================================================================
-- Theme Usage Over Time View
-- =============================================================================

-- Create a view that shows theme usage trends over time (daily aggregation)
CREATE OR REPLACE VIEW public.theme_usage_timeline AS
SELECT
  DATE(s.created_at) AS date,
  s.session_type,
  COUNT(DISTINCT s.id) AS sessions_created,
  COUNT(DISTINCT sp.user_id) AS unique_participants,
  COUNT(DISTINCT de.id) AS total_drinks
FROM public.sessions s
LEFT JOIN public.session_participants sp ON s.id = sp.session_id
LEFT JOIN public.drink_entries de ON s.id = de.session_id
GROUP BY DATE(s.created_at), s.session_type
ORDER BY date DESC, s.session_type;

-- Add comment
COMMENT ON VIEW public.theme_usage_timeline IS 'Daily timeline of theme usage statistics';

-- =============================================================================
-- Peak Usage Hours by Theme View
-- =============================================================================

-- Create a view showing peak usage hours for each theme
CREATE OR REPLACE VIEW public.theme_peak_hours AS
SELECT
  s.session_type,
  EXTRACT(HOUR FROM s.start_time) AS hour_of_day,
  COUNT(DISTINCT s.id) AS sessions_started,
  COUNT(DISTINCT sp.user_id) AS participants,
  EXTRACT(DOW FROM s.start_time) AS day_of_week -- 0=Sunday, 6=Saturday
FROM public.sessions s
LEFT JOIN public.session_participants sp ON s.id = sp.session_id
GROUP BY s.session_type, EXTRACT(HOUR FROM s.start_time), EXTRACT(DOW FROM s.start_time)
ORDER BY s.session_type, sessions_started DESC;

-- Add comment
COMMENT ON VIEW public.theme_peak_hours IS 'Peak usage hours and days for each theme type';

-- =============================================================================
-- Theme Analytics Function
-- =============================================================================

-- Function to get comprehensive theme analytics
CREATE OR REPLACE FUNCTION public.get_theme_analytics(theme_type VARCHAR DEFAULT NULL)
RETURNS TABLE(
  session_type VARCHAR,
  total_sessions BIGINT,
  active_sessions BIGINT,
  total_participants BIGINT,
  total_drinks BIGINT,
  avg_participants_per_session NUMERIC,
  avg_drinks_per_session NUMERIC,
  first_session_created TIMESTAMPTZ,
  last_session_created TIMESTAMPTZ,
  most_popular_badge_name VARCHAR,
  most_popular_badge_awards BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH session_stats AS (
    SELECT
      s.session_type AS st,
      COUNT(DISTINCT s.id) AS total_sess,
      COUNT(DISTINCT CASE WHEN s.end_time > NOW() THEN s.id END) AS active_sess,
      COUNT(DISTINCT sp.user_id) AS total_parts,
      COUNT(DISTINCT de.id) AS total_drnks,
      COALESCE(AVG((SELECT COUNT(*) FROM session_participants sp2 WHERE sp2.session_id = s.id)), 0) AS avg_parts,
      COALESCE(AVG((SELECT COUNT(*) FROM drink_entries de2 WHERE de2.session_id = s.id)), 0) AS avg_drnks,
      MIN(s.created_at) AS first_created,
      MAX(s.created_at) AS last_created
    FROM public.sessions s
    LEFT JOIN public.session_participants sp ON s.id = sp.session_id
    LEFT JOIN public.drink_entries de ON s.id = de.session_id
    WHERE (theme_type IS NULL OR s.session_type = theme_type)
    GROUP BY s.session_type
  ),
  badge_stats AS (
    SELECT DISTINCT ON (s.session_type)
      s.session_type AS st,
      b.title AS badge_name,
      COUNT(ub.id) AS badge_count
    FROM public.sessions s
    INNER JOIN public.user_badges ub ON s.id = ub.session_id
    INNER JOIN public.badges b ON ub.badge_id = b.id
    WHERE (theme_type IS NULL OR s.session_type = theme_type)
    GROUP BY s.session_type, b.title
    ORDER BY s.session_type, badge_count DESC
  )
  SELECT
    ss.st::VARCHAR,
    ss.total_sess,
    ss.active_sess,
    ss.total_parts,
    ss.total_drnks,
    ss.avg_parts,
    ss.avg_drnks,
    ss.first_created,
    ss.last_created,
    bs.badge_name::VARCHAR,
    bs.badge_count
  FROM session_stats ss
  LEFT JOIN badge_stats bs ON ss.st = bs.st;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.get_theme_analytics IS 'Get comprehensive analytics for session themes with optional filtering';

-- =============================================================================
-- Most Popular Theme Function
-- =============================================================================

-- Function to get the most popular theme based on various metrics
CREATE OR REPLACE FUNCTION public.get_most_popular_theme()
RETURNS TABLE(
  session_type VARCHAR,
  total_sessions BIGINT,
  total_participants BIGINT,
  popularity_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.session_type::VARCHAR,
    COUNT(DISTINCT s.id) AS total_sessions,
    COUNT(DISTINCT sp.user_id) AS total_participants,
    -- Popularity score: weighted combination of sessions and participants
    (COUNT(DISTINCT s.id) * 1.0 + COUNT(DISTINCT sp.user_id) * 2.0) AS popularity_score
  FROM public.sessions s
  LEFT JOIN public.session_participants sp ON s.id = sp.session_id
  GROUP BY s.session_type
  ORDER BY popularity_score DESC
  LIMIT 1;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.get_most_popular_theme IS 'Returns the most popular theme based on usage metrics';

-- =============================================================================
-- Theme Comparison Function
-- =============================================================================

-- Function to compare two themes side-by-side
CREATE OR REPLACE FUNCTION public.compare_themes(
  theme_a VARCHAR,
  theme_b VARCHAR
)
RETURNS TABLE(
  metric_name TEXT,
  theme_a_value NUMERIC,
  theme_b_value NUMERIC,
  difference NUMERIC,
  percent_difference NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  a_sessions BIGINT;
  b_sessions BIGINT;
  a_participants BIGINT;
  b_participants BIGINT;
  a_drinks BIGINT;
  b_drinks BIGINT;
BEGIN
  -- Get metrics for theme A
  SELECT
    COUNT(DISTINCT s.id),
    COUNT(DISTINCT sp.user_id),
    COUNT(DISTINCT de.id)
  INTO a_sessions, a_participants, a_drinks
  FROM public.sessions s
  LEFT JOIN public.session_participants sp ON s.id = sp.session_id
  LEFT JOIN public.drink_entries de ON s.id = de.session_id
  WHERE s.session_type = theme_a;

  -- Get metrics for theme B
  SELECT
    COUNT(DISTINCT s.id),
    COUNT(DISTINCT sp.user_id),
    COUNT(DISTINCT de.id)
  INTO b_sessions, b_participants, b_drinks
  FROM public.sessions s
  LEFT JOIN public.session_participants sp ON s.id = sp.session_id
  LEFT JOIN public.drink_entries de ON s.id = de.session_id
  WHERE s.session_type = theme_b;

  -- Return comparison rows
  RETURN QUERY
  SELECT
    'Total Sessions'::TEXT,
    a_sessions::NUMERIC,
    b_sessions::NUMERIC,
    (a_sessions - b_sessions)::NUMERIC,
    CASE WHEN b_sessions > 0
      THEN ((a_sessions - b_sessions) * 100.0 / b_sessions)::NUMERIC
      ELSE NULL
    END
  UNION ALL
  SELECT
    'Total Participants'::TEXT,
    a_participants::NUMERIC,
    b_participants::NUMERIC,
    (a_participants - b_participants)::NUMERIC,
    CASE WHEN b_participants > 0
      THEN ((a_participants - b_participants) * 100.0 / b_participants)::NUMERIC
      ELSE NULL
    END
  UNION ALL
  SELECT
    'Total Drinks'::TEXT,
    a_drinks::NUMERIC,
    b_drinks::NUMERIC,
    (a_drinks - b_drinks)::NUMERIC,
    CASE WHEN b_drinks > 0
      THEN ((a_drinks - b_drinks) * 100.0 / b_drinks)::NUMERIC
      ELSE NULL
    END;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.compare_themes IS 'Compare usage metrics between two themes';

-- =============================================================================
-- Grant Permissions
-- =============================================================================

-- Grant access to admin users
GRANT SELECT ON public.theme_statistics TO authenticated;
GRANT SELECT ON public.theme_badge_statistics TO authenticated;
GRANT SELECT ON public.theme_usage_timeline TO authenticated;
GRANT SELECT ON public.theme_peak_hours TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_theme_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_most_popular_theme TO authenticated;
GRANT EXECUTE ON FUNCTION public.compare_themes TO authenticated;
