-- Drop table if it exists (optional, for testing)
-- DROP TABLE IF EXISTS public.grades_consensus;

-- Create the grades_consensus table with daily snapshots
CREATE TABLE IF NOT EXISTS public.grades_consensus (
    -- Primary Key (Standard UUID)
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Business Key / Identifiers
    symbol              TEXT NOT NULL,
    date                DATE NOT NULL, -- Date the consensus snapshot was recorded

    -- Consensus Data (Using INTEGER as these are counts)
    strong_buy          INTEGER NULL,
    buy                 INTEGER NULL,
    hold                INTEGER NULL,
    sell                INTEGER NULL,
    strong_sell         INTEGER NULL,
    consensus           TEXT NULL, -- e.g., "Buy", "Hold"

    -- Timestamps
    -- created_at TIMESTAMPTZ NOT NULL DEFAULT now(), -- Optional: Track when row was first created
    modified_at         TIMESTAMPTZ NOT NULL DEFAULT now(), -- Tracks last DB modification of this specific snapshot

    -- Constraints
    UNIQUE (symbol, date), -- Enforce business key uniqueness for daily snapshots

    -- Optional: Foreign key to profiles table
    CONSTRAINT fk_grades_symbol FOREIGN KEY (symbol) REFERENCES public.profiles(symbol) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add comments for clarity
COMMENT ON TABLE public.grades_consensus IS 'Stores daily analyst grades consensus data fetched from FMP API.';
COMMENT ON COLUMN public.grades_consensus.id IS 'Unique identifier for the consensus record (UUID).';
COMMENT ON COLUMN public.grades_consensus.symbol IS 'Company stock ticker symbol.';
COMMENT ON COLUMN public.grades_consensus.date IS 'Date the consensus snapshot was recorded.';
COMMENT ON COLUMN public.grades_consensus.modified_at IS 'Timestamp of the last modification in this database.';
COMMENT ON CONSTRAINT grades_consensus_symbol_date_key ON public.grades_consensus IS 'Ensures uniqueness based on company and date.';


-- Indexes for common query patterns
-- Index for fetching all consensus data for a specific symbol, ordered by date
CREATE INDEX IF NOT EXISTS idx_grades_consensus_symbol_date ON public.grades_consensus(symbol, date DESC);
-- Index for cache checks (less critical if fetching daily, but good practice)
CREATE INDEX IF NOT EXISTS idx_grades_consensus_modified_at ON public.grades_consensus(modified_at DESC);


-- Trigger to automatically update modified_at timestamp on row update
CREATE OR REPLACE TRIGGER handle_grades_consensus_updated_at
BEFORE UPDATE ON public.grades_consensus
FOR EACH ROW
EXECUTE FUNCTION moddatetime('modified_at');

-- Optional: Grant permissions
-- GRANT SELECT ON public.grades_consensus TO authenticated;
-- GRANT ALL ON public.grades_consensus TO service_role;