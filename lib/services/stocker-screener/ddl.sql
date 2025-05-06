-- Drop table if it exists (optional, for testing)
-- DROP TABLE IF EXISTS public.stock_screener;

-- Create the stock_screener table
CREATE TABLE IF NOT EXISTS public.stock_screener (
    -- Primary Key (Consistent with other tables)
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Core identifier (Unique for a screener snapshot)
    symbol                      TEXT NOT NULL UNIQUE,

    -- Data from FMP Stock Screener
    company_name                TEXT NULL,
    market_cap                  BIGINT NULL,
    sector                      TEXT NULL,
    industry                    TEXT NULL,
    beta                        DOUBLE PRECISION NULL,
    price                       DOUBLE PRECISION NULL,
    last_annual_dividend        DOUBLE PRECISION NULL,
    volume                      BIGINT NULL,
    exchange                    TEXT NULL,
    exchange_short_name         TEXT NULL,
    country                     VARCHAR(2) NULL, -- Assuming 2-char country code
    is_etf                      BOOLEAN NULL,
    is_fund                     BOOLEAN NULL,
    is_actively_trading         BOOLEAN NULL,

    -- Timestamps (Consistent with BaseRow and auto-update)
    -- created_at TIMESTAMPTZ NOT NULL DEFAULT now(), -- Optional
    modified_at                 TIMESTAMPTZ NOT NULL DEFAULT now() -- Tracks last DB modification
);

-- Add comments for clarity
COMMENT ON TABLE public.stock_screener IS 'Stores stock screener snapshot data fetched from FMP API.';
COMMENT ON COLUMN public.stock_screener.id IS 'Unique identifier for the screener record (UUID).';
COMMENT ON COLUMN public.stock_screener.symbol IS 'Company stock ticker symbol (must be unique within a snapshot).';
COMMENT ON COLUMN public.stock_screener.modified_at IS 'Timestamp of the last modification in this database (indicates snapshot freshness).';

-- Indexes
-- The UNIQUE constraint on symbol already creates an index.
-- Index for cache checks based on modification time (useful for FullCollection mode)
CREATE INDEX IF NOT EXISTS idx_stock_screener_modified_at ON public.stock_screener(modified_at DESC);

-- Trigger to automatically update modified_at timestamp on row update
CREATE OR REPLACE TRIGGER handle_stock_screener_updated_at
BEFORE UPDATE ON public.stock_screener
FOR EACH ROW
EXECUTE FUNCTION moddatetime('modified_at');

-- Optional: Grant permissions
-- GRANT SELECT ON public.stock_screener TO authenticated;
-- GRANT ALL ON public.stock_screener TO service_role;