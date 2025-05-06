/* ──────────────────────────────────────────────────────────────────────
 * lib/services/signals/types.ts
 * Type definitions for calculated Signal data using Supabase.
 * Based on the provided DDL for the 'signals' table.
 * ---------------------------------------------------------------------*/
import type { Database } from "@/lib/supabase/database.types";

// Define RowType using generated types
// Assumes your table name in Supabase is 'signals'
export type SignalRow = Database["public"]["Tables"]["signals"]["Row"];

// Define the structure for the API response item.
// Omits DB-specific timestamps, uses string 'id'.
export interface SignalApiItem
  extends Omit<SignalRow, "id" | "modified_at" | "created_at"> {
  id: string; // API id is string
  // Inherits snake_case keys: symbol, signal_date, signal_category, etc.
}

// Type for potential query parameters for fetching signals
// Corrected based on the actual DDL columns available for filtering
export interface SignalQueryOptions {
  symbol: string; // Always required to fetch by symbol
  signalDate?: string; // Optional: Filter by specific YYYY-MM-DD date
  signalCode?: string; // Optional: Filter by code
  signalCategory?: string; // Optional: Filter by category
  signalType?: "event" | "state"; // Optional: Filter by type
}

// Type for data needed to insert/upsert a new signal
// Excludes fields automatically handled by DB (id, created_at) or service (modified_at)
export type SignalInsertData = Omit<
  SignalRow,
  "id" | "created_at" | "modified_at"
>;
