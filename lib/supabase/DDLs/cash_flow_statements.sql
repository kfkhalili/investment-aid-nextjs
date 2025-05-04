-- Drop table only if it exists (safer for iterative development)
DROP TABLE IF EXISTS public.cash_flow_statements;

-- Create the cash_flow_statements table
CREATE TABLE IF NOT EXISTS public.cash_flow_statements (
    -- Primary Key
    id                                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Business Key / Identifiers (Ensure these are unique together)
    symbol                                      TEXT NOT NULL,
    date                                        DATE NOT NULL,
    period                                      TEXT NOT NULL, -- e.g., FY, Q1

    -- Report Metadata
    reported_currency                           VARCHAR(3) NOT NULL,
    cik                                         TEXT NULL, -- Explicitly allow NULL
    filling_date                                DATE NOT NULL,
    accepted_date                               TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    calendar_year                               SMALLINT NOT NULL,

    -- Operating Activities (Using BIGINT for large financial numbers)
    net_income                                  BIGINT NULL,
    depreciation_and_amortization               BIGINT NULL,
    deferred_income_tax                         BIGINT NULL,
    stock_based_compensation                    BIGINT NULL,
    change_in_working_capital                   BIGINT NULL,
    accounts_receivables                        BIGINT NULL,
    inventory                                   BIGINT NULL,
    accounts_payables                           BIGINT NULL,
    other_working_capital                       BIGINT NULL,
    other_non_cash_items                        BIGINT NULL,
    net_cash_provided_by_operating_activities   BIGINT NULL,

    -- Investing Activities
    investments_in_property_plant_and_equipment BIGINT NULL,
    acquisitions_net                            BIGINT NULL,
    purchases_of_investments                    BIGINT NULL,
    sales_maturities_of_investments             BIGINT NULL,
    other_investing_activites                   BIGINT NULL,
    net_cash_used_for_investing_activites       BIGINT NULL,

    -- Financing Activities
    debt_repayment                              BIGINT NULL,
    common_stock_issued                         BIGINT NULL,
    common_stock_repurchased                    BIGINT NULL,
    dividends_paid                              BIGINT NULL,
    other_financing_activites                   BIGINT NULL,
    net_cash_used_provided_by_financing_activities BIGINT NULL,

    -- Supplemental / Other
    effect_of_forex_changes_on_cash             BIGINT NULL,
    net_change_in_cash                          BIGINT NULL,
    cash_at_end_of_period                       BIGINT NULL,
    cash_at_beginning_of_period                 BIGINT NULL,
    operating_cash_flow                         BIGINT NULL,
    capital_expenditure                         BIGINT NULL,
    free_cash_flow                              BIGINT NULL,
    link                                        TEXT NULL,
    final_link                                  TEXT NULL,

    -- Timestamps
    -- created_at TIMESTAMPTZ NOT NULL DEFAULT now(), -- Optional: If you track creation time
    modified_at                                 TIMESTAMPTZ NOT NULL DEFAULT now(), -- Tracks last DB modification

    -- Constraints
    -- Enforce business key uniqueness across symbol, date, and period
    UNIQUE (symbol, date, period)
    -- Optional: Add foreign key constraint if 'profiles' table exists
    -- CONSTRAINT fk_cash_flow_symbol FOREIGN KEY (symbol) REFERENCES public.profiles(symbol) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add comments for clarity
COMMENT ON TABLE public.cash_flow_statements IS 'Stores cash flow statement data fetched from FMP API.';
COMMENT ON COLUMN public.cash_flow_statements.id IS 'Unique identifier for the statement record (UUID).';
COMMENT ON COLUMN public.cash_flow_statements.modified_at IS 'Timestamp of the last modification in this database.';
COMMENT ON CONSTRAINT cash_flow_statements_symbol_date_period_key ON public.cash_flow_statements IS 'Ensures uniqueness based on company, date, and reporting period.';


-- Indexes for common query patterns
-- Index for fetching all statements for a specific symbol efficiently
CREATE INDEX IF NOT EXISTS idx_cash_flow_symbol ON public.cash_flow_statements(symbol);
-- Index for cache checks based on modification time
CREATE INDEX IF NOT EXISTS idx_cash_flow_modified_at ON public.cash_flow_statements(modified_at DESC);
-- The UNIQUE constraint on (symbol, date, period) already provides an efficient index for lookups/sorting on those fields.


-- Trigger to automatically update modified_at timestamp on row update
CREATE OR REPLACE TRIGGER handle_cash_flow_statements_updated_at
BEFORE UPDATE ON public.cash_flow_statements
FOR EACH ROW
EXECUTE FUNCTION moddatetime('modified_at');

-- Optional: Grant permissions
-- GRANT SELECT ON public.cash_flow_statements TO authenticated;
-- GRANT ALL ON public.cash_flow_statements TO service_role;