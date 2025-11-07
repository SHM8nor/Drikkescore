-- Add drink_prices table for Personal Analytics feature
-- This table allows users to optionally track prices of their drinks for spending analytics

-- =============================================================================
-- Create drink_prices table
-- =============================================================================
CREATE TABLE IF NOT EXISTS drink_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  drink_name VARCHAR(100) NOT NULL,
  price_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NOK',
  volume_ml INTEGER,
  alcohol_percentage DECIMAL(4, 2),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================================================
-- Create indexes for performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_drink_prices_user_id ON drink_prices(user_id);
CREATE INDEX IF NOT EXISTS idx_drink_prices_is_default ON drink_prices(user_id, is_default);

-- =============================================================================
-- Enable Row Level Security (RLS)
-- =============================================================================
ALTER TABLE drink_prices ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS Policies
-- =============================================================================

-- Users can view their own drink prices
CREATE POLICY "Users can view their own drink prices"
  ON drink_prices FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own drink prices
CREATE POLICY "Users can insert their own drink prices"
  ON drink_prices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own drink prices
CREATE POLICY "Users can update their own drink prices"
  ON drink_prices FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own drink prices
CREATE POLICY "Users can delete their own drink prices"
  ON drink_prices FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- Create updated_at trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION update_drink_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER drink_prices_updated_at
  BEFORE UPDATE ON drink_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_drink_prices_updated_at();

-- =============================================================================
-- Verify setup
-- =============================================================================
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'drink_prices'
ORDER BY policyname;
