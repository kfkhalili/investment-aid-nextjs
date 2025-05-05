-- Drop table if it exists (optional, for testing)
-- DROP TABLE IF EXISTS public.historical_prices;

-- Create the historical_prices table
CREATE TABLE IF NOT EXISTS public.historical_prices (
    -- Primary Key (UUID is good practice, though symbol+date is unique)
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Business Key / Identifiers
    symbol                      TEXT NOT NULL,
    date                        DATE NOT NULL,

    -- Price Data (Using DOUBLE PRECISION for flexibility)
    open                        DOUBLE PRECISION NULL,
    high                        DOUBLE PRECISION NULL,
    low                         DOUBLE PRECISION NULL,
    close                       DOUBLE PRECISION NULL,
    adj_close                   DOUBLE PRECISION NULL, -- Renamed from adjClose
    volume                      BIGINT NULL,
    unadjusted_volume           BIGINT NULL, -- Renamed from unadjustedVolume
    change                      DOUBLE PRECISION NULL,
    change_percent              DOUBLE PRECISION NULL, -- Renamed from changePercent
    vwap                        DOUBLE PRECISION NULL,
    label                       TEXT NULL, -- The display label like "May 02, 25"
    change_over_time            DOUBLE PRECISION NULL, -- Renamed from changeOverTime

    -- Timestamps
    -- created_at TIMESTAMPTZ NOT NULL DEFAULT now(), -- Optional
    modified_at                 TIMESTAMPTZ NOT NULL DEFAULT now(), -- Tracks last DB modification

    -- Constraints
    UNIQUE (symbol, date), -- Enforce business key uniqueness

    -- Optional: Foreign key to profiles table
    CONSTRAINT fk_historical_price_symbol FOREIGN KEY (symbol) REFERENCES public.profiles(symbol) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add comments for clarity
COMMENT ON TABLE public.historical_prices IS 'Stores daily historical stock price data fetched from FMP API.';
COMMENT ON COLUMN public.historical_prices.id IS 'Unique identifier for the historical price record (UUID).';
COMMENT ON COLUMN public.historical_prices.symbol IS 'Company stock ticker symbol.';
COMMENT ON COLUMN public.historical_prices.date IS 'The specific date for the historical price data.';
COMMENT ON COLUMN public.historical_prices.modified_at IS 'Timestamp of the last modification in this database.';
COMMENT ON CONSTRAINT historical_prices_symbol_date_key ON public.historical_prices IS 'Ensures uniqueness based on company and date.';


-- Indexes for common query patterns
-- Index for fetching all prices for a specific symbol efficiently, ordered by date
CREATE INDEX IF NOT EXISTS idx_historical_price_symbol_date ON public.historical_prices(symbol, date DESC);
-- Index for potential cache checks (though likely done per-symbol based on latest date)
CREATE INDEX IF NOT EXISTS idx_historical_price_modified_at ON public.historical_prices(modified_at DESC);


-- Trigger to automatically update modified_at timestamp on row update
CREATE OR REPLACE TRIGGER handle_historical_prices_updated_at
BEFORE UPDATE ON public.historical_prices
FOR EACH ROW
EXECUTE FUNCTION moddatetime('modified_at');

-- Optional: Grant permissions
-- GRANT SELECT ON public.historical_prices TO authenticated;
-- GRANT ALL ON public.historical_prices TO service_role;

