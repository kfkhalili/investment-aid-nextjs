-- Drop table only if it exists (safer for iterative development)
DROP TABLE IF EXISTS public.balance_sheet_statements;

-- Create the balance_sheet_statements table
CREATE TABLE IF NOT EXISTS public.balance_sheet_statements (
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

    -- Balance Sheet Lines (Using BIGINT as specified, allowing NULL)
    cash_and_cash_equivalents                   BIGINT NULL,
    short_term_investments                      BIGINT NULL,
    cash_and_short_term_investments             BIGINT NULL,
    net_receivables                             BIGINT NULL,
    inventory                                   BIGINT NULL,
    other_current_assets                        BIGINT NULL,
    total_current_assets                        BIGINT NULL,
    property_plant_equipment_net                BIGINT NULL,
    goodwill                                    BIGINT NULL,
    intangible_assets                           BIGINT NULL,
    goodwill_and_intangible_assets              BIGINT NULL,
    long_term_investments                       BIGINT NULL,
    tax_assets                                  BIGINT NULL,
    other_non_current_assets                    BIGINT NULL,
    total_non_current_assets                    BIGINT NULL,
    other_assets                                BIGINT NULL,
    total_assets                                BIGINT NULL,
    account_payables                            BIGINT NULL,
    short_term_debt                             BIGINT NULL,
    tax_payables                                BIGINT NULL,
    deferred_revenue                            BIGINT NULL,
    other_current_liabilities                   BIGINT NULL,
    total_current_liabilities                   BIGINT NULL,
    long_term_debt                              BIGINT NULL,
    deferred_revenue_non_current                BIGINT NULL,
    deferred_tax_liabilities_non_current        BIGINT NULL,
    other_non_current_liabilities               BIGINT NULL,
    total_non_current_liabilities               BIGINT NULL,
    other_liabilities                           BIGINT NULL,
    capital_lease_obligations                   BIGINT NULL, -- Explicitly nullable
    total_liabilities                           BIGINT NULL,
    preferred_stock                             BIGINT NULL,
    common_stock                                BIGINT NULL,
    retained_earnings                           BIGINT NULL,
    accumulated_other_comprehensive_income_loss BIGINT NULL,
    othertotal_stockholders_equity              BIGINT NULL,
    total_stockholders_equity                   BIGINT NULL,
    total_equity                                BIGINT NULL,
    total_liabilities_and_stockholders_equity   BIGINT NULL,
    minority_interest                           BIGINT NULL,
    total_liabilities_and_total_equity          BIGINT NULL,
    total_investments                           BIGINT NULL,
    total_debt                                  BIGINT NULL,
    net_debt                                    BIGINT NULL,
    link                                        TEXT NULL,
    final_link                                  TEXT NULL,

    -- Timestamps
    -- created_at TIMESTAMPTZ NOT NULL DEFAULT now(), -- Optional
    modified_at                                 TIMESTAMPTZ NOT NULL DEFAULT now(), -- Tracks last DB modification

    -- Constraints
    UNIQUE (symbol, date, period), -- Enforce business key uniqueness
    -- Optional: Add foreign key constraint if 'profiles' table exists
    CONSTRAINT fk_balance_sheet_symbol FOREIGN KEY (symbol) REFERENCES public.profiles(symbol) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add comments for clarity
COMMENT ON TABLE public.balance_sheet_statements IS 'Stores balance sheet statement data fetched from FMP API.';
COMMENT ON COLUMN public.balance_sheet_statements.id IS 'Unique identifier for the statement record (UUID).';
COMMENT ON COLUMN public.balance_sheet_statements.modified_at IS 'Timestamp of the last modification in this database.';
COMMENT ON CONSTRAINT balance_sheet_statements_symbol_date_period_key ON public.balance_sheet_statements IS 'Ensures uniqueness based on company, date, and reporting period.';


-- Indexes for common query patterns
-- Index for fetching all statements for a specific symbol efficiently
CREATE INDEX IF NOT EXISTS idx_balance_sheet_symbol ON public.balance_sheet_statements(symbol);
-- Index for cache checks based on modification time
CREATE INDEX IF NOT EXISTS idx_balance_sheet_modified_at ON public.balance_sheet_statements(modified_at DESC);
-- The UNIQUE constraint on (symbol, date, period) already provides an efficient index for lookups/sorting on those fields.


-- Trigger to automatically update modified_at timestamp on row update
CREATE OR REPLACE TRIGGER handle_balance_sheet_statements_updated_at
BEFORE UPDATE ON public.balance_sheet_statements
FOR EACH ROW
EXECUTE FUNCTION moddatetime('modified_at');

-- Optional: Grant permissions
-- GRANT SELECT ON public.balance_sheet_statements TO authenticated;
-- GRANT ALL ON public.balance_sheet_statements TO service_role;