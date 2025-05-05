-- Drop table if it exists (optional, for testing)
-- DROP TABLE IF EXISTS public.signals;

-- Create the table to store generated signals
CREATE TABLE public.signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  signal_date date NOT NULL,
  symbol text NOT NULL,
  signal_type text NOT NULL CHECK (signal_type IN ('technical', 'sentiment', 'event', 'fundamental', 'macro', 'quant', 'flow', 'intermarket', 'volatility', 'alternative', 'esg', 'regulatory')), -- Add/modify types as needed
  signal_code text NOT NULL, -- e.g., 'SMA50_CROSS_ABOVE', 'RSI_OVERBOUGHT'
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processing', 'posted_to_x', 'error', 'archived')),
  details jsonb NULL, -- Store contextual data, e.g., { "close": 123.45, "sma50": 123.10 }
  confidence real NULL, -- Optional confidence score (0.0 to 1.0)

  -- Unique Constraint: Prevent duplicate signals for the same symbol, date, and code
  CONSTRAINT signals_symbol_date_code_uniq UNIQUE (symbol, signal_date, signal_code),

  -- Foreign Key Constraint: Ensure symbol exists in your profiles table
  CONSTRAINT fk_signals_symbol -- Naming the constraint
    FOREIGN KEY(symbol)
    REFERENCES public.profiles(symbol) -- *** Referencing public.profiles(symbol) as requested ***
    ON DELETE CASCADE -- If a profile/symbol is deleted, delete its signals
    ON UPDATE CASCADE -- If a symbol is updated in profiles, update it here too
);

-- Add comments to columns for clarity
COMMENT ON COLUMN public.signals.id IS 'Unique identifier for the signal record';
COMMENT ON COLUMN public.signals.created_at IS 'Timestamp when the signal record was created';
COMMENT ON COLUMN public.signals.signal_date IS 'The date the signal condition was met in the market data';
COMMENT ON COLUMN public.signals.symbol IS 'The stock/asset ticker symbol the signal relates to';
COMMENT ON COLUMN public.signals.signal_type IS 'High-level category of the signal (e.g., technical, sentiment)';
COMMENT ON COLUMN public.signals.signal_code IS 'Specific identifier code for the signal event';
COMMENT ON COLUMN public.signals.status IS 'Processing status of the signal (new, posted_to_x, etc.)';
COMMENT ON COLUMN public.signals.details IS 'JSON object containing relevant data points at the time of the signal';
COMMENT ON COLUMN public.signals.confidence IS 'Optional confidence score for the signal (e.g., 0.0 to 1.0)';

-- Create indexes for common query patterns
CREATE INDEX idx_signals_symbol_date ON public.signals (symbol, signal_date);
CREATE INDEX idx_signals_status_created_at ON public.signals (status, created_at); -- Good for fetching 'new' signals for posting
CREATE INDEX idx_signals_signal_code ON public.signals (signal_code);

-- Recommended: Ensure Row Level Security is Enabled if not already
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- Define RLS Policies (Example: Allow service_role full access)
DROP POLICY IF EXISTS "Allow service_role full access" ON public.signals;
CREATE POLICY "Allow service_role full access" ON public.signals
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add other policies as needed