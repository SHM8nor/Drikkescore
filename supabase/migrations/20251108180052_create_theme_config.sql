-- Theme configuration table (single row)
-- This stores global theme configuration for the application
-- Admin users can toggle themes on/off via the admin panel

CREATE TABLE IF NOT EXISTS public.theme_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  julebord_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_seasonal_switch BOOLEAN NOT NULL DEFAULT true,
  seasonal_start_date DATE,
  seasonal_end_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default config with a fixed UUID for easy querying
INSERT INTO public.theme_config (id, julebord_enabled, auto_seasonal_switch)
VALUES ('00000000-0000-0000-0000-000000000001', true, true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.theme_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read config (needed for homepage and session creation)
CREATE POLICY "Theme config is viewable by everyone"
  ON public.theme_config FOR SELECT
  USING (true);

-- Only admins can update config
CREATE POLICY "Theme config is updatable by admins"
  ON public.theme_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to update config (enforces admin-only access)
CREATE OR REPLACE FUNCTION public.update_theme_config(
  p_julebord_enabled BOOLEAN,
  p_auto_seasonal_switch BOOLEAN
)
RETURNS public.theme_config
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_config public.theme_config;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update theme configuration';
  END IF;

  -- Update config (there's only one row with fixed UUID)
  UPDATE public.theme_config
  SET
    julebord_enabled = p_julebord_enabled,
    auto_seasonal_switch = p_auto_seasonal_switch,
    updated_at = NOW(),
    updated_by = auth.uid()
  WHERE id = '00000000-0000-0000-0000-000000000001'
  RETURNING * INTO v_config;

  RETURN v_config;
END;
$$;

-- Add comment to table
COMMENT ON TABLE public.theme_config IS 'Global theme configuration. Single row table managed by admins only.';
