/* ──────────────────────────────────────────────────────────────────────
 * src/api/stock-screener/service/types.ts (Supabase Version)
 * Type definitions and mappers for Stock Screener data using Supabase.
 * ---------------------------------------------------------------------*/
import type { Database } from "@/lib/supabase/database.types"; // Import generated DB types

// Define RowType using generated types
// Assumes your table name in Supabase is 'stock_screener'
export type StockScreenerRow =
  Database["public"]["Tables"]["stock_screener"]["Row"];

// 1. Interface for Raw Data from FMP API (camelCase, added nullability)
// Matches the example provided for the stock screener endpoint.
export interface RawStockScreenerItem {
  symbol: string;
  companyName: string | null;
  marketCap: number | null;
  sector: string | null;
  industry: string | null;
  beta: number | null;
  price: number | null;
  lastAnnualDividend: number | null;
  volume: number | null;
  exchange: string | null;
  exchangeShortName: string | null;
  country: string | null;
  isEtf: boolean | null;
  isFund: boolean | null;
  isActivelyTrading: boolean | null;
}

// 2. Interface for API Response Shape (Conceptual Full Type)
// Derived from StockScreenerRow (snake_case), includes string id.
export interface StockScreenerItem
  extends Omit<StockScreenerRow, "id" | "modified_at" | "created_at"> {
  id: string; // API id is string
  // Inherits snake_case keys like company_name, market_cap etc.
}
// Note: The generic service actually returns Partial<StockScreenerApiItem>

// --- Mapping Function (Raw -> Row Structure for DB) ---

// Helper function for numeric fields, defaulting to null if input is null/undefined
// Changed default from 0 to null as most fields in screener DDL allow null
const numberOrNull = (value: number | null | undefined): number | null => {
  return value ?? null;
};

/**
 * Maps raw FMP API Stock Screener item data (camelCase) to the structure
 * needed for DB storage (snake_case), excluding id and timestamps.
 * Handles defaults (null for numbers/strings) and type conversions.
 */
export const mapRawStockScreenerToRow = (
  raw: RawStockScreenerItem
): Omit<StockScreenerRow, "id" | "created_at" | "modified_at"> => {
  // Map RawStockScreenerItem (camelCase) keys to StockScreenerRow (snake_case) keys
  return {
    symbol: raw.symbol, // REQUIRED
    company_name: raw.companyName ?? null,
    market_cap: numberOrNull(raw.marketCap),
    sector: raw.sector ?? null,
    industry: raw.industry ?? null,
    beta: numberOrNull(raw.beta),
    price: numberOrNull(raw.price),
    last_annual_dividend: numberOrNull(raw.lastAnnualDividend),
    volume: numberOrNull(raw.volume),
    exchange: raw.exchange ?? null,
    exchange_short_name: raw.exchangeShortName ?? null,
    country: raw.country ?? null,
    is_etf: raw.isEtf ?? null, // Allow null for booleans if DB allows
    is_fund: raw.isFund ?? null,
    is_actively_trading: raw.isActivelyTrading ?? null,
  };
};

// Note: mapRowToApi is handled by the common mapper
