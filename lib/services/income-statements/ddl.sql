-- Ensure the moddatetime extension is enabled (run once per database)
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- Drop table only if it exists (safer for iterative development)
-- DROP TABLE IF EXISTS public.income_statements;

-- Create the income_statements table
CREATE TABLE IF NOT EXISTS public.income_statements (
    -- Primary Key
    id                                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Business Key / Identifiers
    symbol                                      TEXT NOT NULL,
    date                                        DATE NOT NULL,
    period                                      TEXT NOT NULL, -- e.g., FY, Q1

    -- Report Metadata
    reported_currency                           VARCHAR(3) NOT NULL,
    cik                                         TEXT NULL,
    filling_date                                DATE NOT NULL,
    accepted_date                               TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    calendar_year                               SMALLINT NOT NULL,

    -- Income Statement Lines (Using BIGINT/NUMERIC as in original DDL)
    revenue                                     BIGINT NULL,
    cost_of_revenue                             BIGINT NULL,
    gross_profit                                BIGINT NULL,
    gross_profit_ratio                          NUMERIC NULL, -- Consider DOUBLE PRECISION or NUMERIC(precision, scale)
    research_and_development_expenses           BIGINT NULL,
    general_and_administrative_expenses         BIGINT NULL,
    selling_and_marketing_expenses              BIGINT NULL,
    selling_general_and_administrative_expenses BIGINT NULL,
    other_expenses                              BIGINT NULL,
    operating_expenses                          BIGINT NULL,
    cost_and_expenses                           BIGINT NULL,
    interest_income                             BIGINT NULL,
    interest_expense                            BIGINT NULL,
    depreciation_and_amortization               BIGINT NULL,
    ebitda                                      BIGINT NULL,
    ebitdaratio                                 NUMERIC NULL, -- Consider DOUBLE PRECISION or NUMERIC(precision, scale)
    operating_income                            BIGINT NULL,
    operating_income_ratio                      NUMERIC NULL, -- Consider DOUBLE PRECISION or NUMERIC(precision, scale)
    total_other_income_expenses_net             BIGINT NULL,
    income_before_tax                           BIGINT NULL,
    income_before_tax_ratio                     NUMERIC NULL, -- Consider DOUBLE PRECISION or NUMERIC(precision, scale)
    income_tax_expense                          BIGINT NULL,
    net_income                                  BIGINT NULL,
    net_income_ratio                            NUMERIC NULL, -- Consider DOUBLE PRECISION or NUMERIC(precision, scale)
    eps                                         NUMERIC NULL, -- Consider DOUBLE PRECISION or NUMERIC(precision, scale)
    epsdiluted                                  NUMERIC NULL, -- Consider DOUBLE PRECISION or NUMERIC(precision, scale)
    weighted_average_shs_out                    BIGINT NULL,
    weighted_average_shs_out_dil                BIGINT NULL,
    link                                        TEXT NULL,
    final_link                                  TEXT NULL,

    -- Timestamps
    -- created_at TIMESTAMPTZ NOT NULL DEFAULT now(), -- Optional
    modified_at                                 TIMESTAMPTZ NOT NULL DEFAULT now(), -- Tracks last DB modification

    -- Constraints
    UNIQUE (symbol, date, period), -- Enforce business key uniqueness
    -- Optional: Add foreign key constraint if 'profiles' table exists
    CONSTRAINT fk_income_symbol FOREIGN KEY (symbol) REFERENCES public.profiles(symbol) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add comments for clarity
COMMENT ON TABLE public.income_statements IS 'Stores income statement data fetched from FMP API.';
COMMENT ON COLUMN public.income_statements.id IS 'Unique identifier for the statement record (UUID).';
COMMENT ON COLUMN public.income_statements.modified_at IS 'Timestamp of the last modification in this database.';
COMMENT ON CONSTRAINT income_statements_symbol_date_period_key ON public.income_statements IS 'Ensures uniqueness based on company, date, and reporting period.';

-- Indexes for common query patterns
-- Index for fetching all statements for a specific symbol efficiently
CREATE INDEX IF NOT EXISTS idx_income_symbol ON public.income_statements(symbol);
-- Index for cache checks based on modification time
CREATE INDEX IF NOT EXISTS idx_income_modified_at ON public.income_statements(modified_at DESC);
-- The UNIQUE constraint on (symbol, date, period) already provides an efficient index for lookups/sorting on those fields.

-- Trigger to automatically update modified_at timestamp on row update
CREATE OR REPLACE TRIGGER handle_income_statements_updated_at
BEFORE UPDATE ON public.income_statements
FOR EACH ROW
EXECUTE FUNCTION moddatetime('modified_at');

-- Optional: Grant permissions
-- GRANT SELECT ON public.income_statements TO authenticated;
-- GRANT ALL ON public.income_statements TO service_role;