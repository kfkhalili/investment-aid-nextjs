-- Ensure the moddatetime extension is enabled (run once per database)
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- Drop table only if it exists (safer for iterative development)
-- DROP TABLE IF EXISTS public.earnings_calendar;

-- Create the earnings_calendar table
CREATE TABLE IF NOT EXISTS public.earnings_calendar (
    -- Primary Key (Standard UUID)
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Business Key / Identifiers
    symbol                      TEXT NOT NULL,
    date                        DATE NOT NULL, -- Date of the earnings event

    -- Earnings Data (Use DOUBLE PRECISION for potential decimals)
    eps_actual                  DOUBLE PRECISION NULL,
    eps_estimated               DOUBLE PRECISION NULL,
    revenue_actual              BIGINT NULL, -- Assuming revenue is large integer
    revenue_estimated           BIGINT NULL, -- Assuming revenue is large integer
    last_updated                DATE NULL,   -- Date the estimate/actual was last updated

    -- Timestamps
    -- created_at TIMESTAMPTZ NOT NULL DEFAULT now(), -- Optional
    modified_at                 TIMESTAMPTZ NOT NULL DEFAULT now(), -- Tracks last DB modification

    -- Constraints
    UNIQUE (symbol, date), -- Enforce business key uniqueness for daily events
);

-- Add comments for clarity
COMMENT ON TABLE public.earnings_calendar IS 'Stores earnings calendar event data fetched from FMP API.';
COMMENT ON COLUMN public.earnings_calendar.id IS 'Unique identifier for the earnings event record (UUID).';
COMMENT ON COLUMN public.earnings_calendar.symbol IS 'Company stock ticker symbol.';
COMMENT ON COLUMN public.earnings_calendar.date IS 'Date of the scheduled or actual earnings release.';
COMMENT ON COLUMN public.earnings_calendar.modified_at IS 'Timestamp of the last modification in this database.';
COMMENT ON CONSTRAINT earnings_calendar_symbol_date_key ON public.earnings_calendar IS 'Ensures uniqueness based on company and earnings date.';


-- Indexes for common query patterns
-- Index for fetching events for a specific symbol, ordered by date
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_symbol_date ON public.earnings_calendar(symbol, date DESC);
-- Index for fetching events by date (useful for showing calendar for a day/week)
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_date ON public.earnings_calendar(date DESC);
-- Index for cache checks based on modification time (useful for FullCollection mode)
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_modified_at ON public.earnings_calendar(modified_at DESC);


-- Trigger to automatically update modified_at timestamp on row update
CREATE OR REPLACE TRIGGER handle_earnings_calendar_updated_at
BEFORE UPDATE ON public.earnings_calendar
FOR EACH ROW
EXECUTE FUNCTION moddatetime('modified_at');

-- Optional: Grant permissions
-- GRANT SELECT ON public.earnings_calendar TO authenticated;
-- GRANT ALL ON public.earnings_calendar TO service_role;

