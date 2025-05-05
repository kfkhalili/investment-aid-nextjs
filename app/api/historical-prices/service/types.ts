/* ──────────────────────────────────────────────────────────────────────
 * src/api/historical-price/service/types.ts (Supabase Version)
 * Type definitions for Historical Price data using Supabase.
 * ---------------------------------------------------------------------*/
import type { Database } from "@/lib/supabase/database.types"; // Import generated DB types

// Define RowType using generated types
// Assumes your table name is 'historical_prices'
export type HistoricalPriceRow =
  Database["public"]["Tables"]["historical_prices"]["Row"];

// 1. Interface for the nested historical data items from FMP API (camelCase)
export interface RawHistoricalPriceItem {
  date: string; // Expecting YYYY-MM-DD
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  adjClose: number | null;
  volume: number | null;
  unadjustedVolume: number | null;
  change: number | null;
  changePercent: number | null;
  vwap: number | null;
  label: string | null;
  changeOverTime: number | null;
}

// 2. Interface for the overall Raw Data structure from FMP API
export interface RawHistoricalPriceResponse {
  symbol: string;
  historical: RawHistoricalPriceItem[]; // The nested array
}

// 3. Interface for the structure to be inserted/upserted into the DB
// Excludes DB-generated fields like 'id', 'created_at', 'modified_at'
// Uses snake_case column names. Includes 'symbol' which comes from the parent object.
export type HistoricalPriceInsertData = Omit<
  HistoricalPriceRow,
  "id" | "created_at" | "modified_at"
>;

// 4. (Optional) Define the shape returned by the API route/service function
// This might omit DB timestamps and use string 'id' if needed by client.
// For simplicity, service function might just return HistoricalPriceRow[] or Partial<...>
export interface HistoricalPriceApiItem
  extends Omit<HistoricalPriceRow, "id" | "modified_at" | "created_at"> {
  id: string; // API id is string
  // Inherits snake_case keys like adj_close, change_percent, etc.
}
