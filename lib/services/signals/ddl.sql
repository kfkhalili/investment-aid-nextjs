-- Ensure the moddatetime extension is enabled (run once per database)
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- Drop table if it exists (optional, for development/resetting)
-- DROP TABLE IF EXISTS public.signals;

-- Create the table to store generated signals with both type and category
CREATE TABLE public.signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  signal_date date NOT NULL,
  symbol text NOT NULL,

  -- Broader classification of the signal's origin or nature
  signal_category text NOT NULL CHECK (signal_category IN (
    'technical',
    'sentiment',
    'fundamental',
    'macro',
    'quant',
    'flow',
    'intermarket',
    'volatility',
    'alternative',
    'esg',
    'regulatory'
  )),

  -- Specific nature: Is it an ongoing condition or a point-in-time occurrence?
  signal_type text NOT NULL CHECK (signal_type IN ('event', 'state')),

  -- Specific identifier code for the signal event or state
  signal_code text NOT NULL, -- e.g., 'SMA50_CROSS_ABOVE', 'PRICE_POS_RANK_5'

  -- Optional: Store contextual data points relevant to the signal
  details jsonb NULL, -- e.g., { "close": 123.45, "sma50": 123.10 }

  -- Optional: Confidence score for the signal (e.g., 0.0 to 1.0)
  confidence real NULL,

  -- Unique Constraint: Prevent duplicate signals for the same symbol, date, and code
  CONSTRAINT signals_symbol_date_code_uniq UNIQUE (symbol, signal_date, signal_code),

  -- Foreign Key Constraint: Ensure symbol exists in your profiles table
  CONSTRAINT fk_signals_symbol -- Naming the constraint
    FOREIGN KEY(symbol)
    REFERENCES public.profiles(symbol) -- Referencing public.profiles(symbol)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Add comments to columns for clarity
COMMENT ON TABLE public.signals IS 'Stores generated market signals, categorized by origin and type (event/state).';
COMMENT ON COLUMN public.signals.id IS 'Unique identifier for the signal record';
COMMENT ON COLUMN public.signals.created_at IS 'Timestamp when the signal record was created';
COMMENT ON COLUMN public.signals.signal_date IS 'The date the signal condition was met in the market data';
COMMENT ON COLUMN public.signals.symbol IS 'The stock/asset ticker symbol the signal relates to';
COMMENT ON COLUMN public.signals.signal_category IS 'Broad category of the signal (e.g., technical, event, fundamental)';
COMMENT ON COLUMN public.signals.signal_type IS 'Indicates if the signal represents a state or an event';
COMMENT ON COLUMN public.signals.signal_code IS 'Specific identifier code for the signal event or state';
COMMENT ON COLUMN public.signals.details IS 'JSON object containing relevant data points at the time of the signal';
COMMENT ON COLUMN public.signals.confidence IS 'Optional confidence score for the signal (e.g., 0.0 to 1.0)';

-- Create indexes for common query patterns
-- Using CREATE INDEX IF NOT EXISTS to avoid errors if run multiple times
CREATE INDEX IF NOT EXISTS idx_signals_symbol_date ON public.signals (symbol, signal_date);
CREATE INDEX IF NOT EXISTS idx_signals_signal_code ON public.signals (signal_code);
CREATE INDEX IF NOT EXISTS idx_signals_category_type ON public.signals (signal_category, signal_type);

-- Recommended: Ensure Row Level Security is Enabled if not already
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- Define RLS Policies (Example: Allow service_role full access)
-- Drop policy if it exists before creating, prevents error on re-run
DROP POLICY IF EXISTS "Allow service_role full access" ON public.signals;
-- Allow service_role (used by your server client) to do anything
CREATE POLICY "Allow service_role full access" ON public.signals
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add other policies as needed (e.g., for read access by authenticated users)
