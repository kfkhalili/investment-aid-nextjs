/* ──────────────────────────────────────────────────────────────────────
 * lib/services/historical-prices/fetchHistoricalPricesByDate.ts
 * Service function to fetch historical price data for ALL symbols
 * for a specific date directly from the Supabase database.
 * ---------------------------------------------------------------------*/
import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import type { HistoricalPriceRow } from "./types"; // Uses the existing types.ts

const TABLE_NAME = "historical_prices"; // Ensure this matches your actual table name

/**
 * Fetches historical price data for ALL symbols for a specific date
 * directly from the Supabase database. Does NOT call FMP.
 *
 * @param targetDate The target date in 'YYYY-MM-DD' format.
 * @returns Promise<HistoricalPriceRow[]> An array of historical price rows for that date.
 */
export async function getHistoricalPricesForAllSymbolsByDate(
  targetDate: string
): Promise<HistoricalPriceRow[]> {
  const supabase: SupabaseClient = getSupabaseServerClient();

  console.log(
    `[HistPriceSvcByDate] Fetching all symbols from Supabase for date: ${targetDate}`
  );

  // Since HistoricalPriceRow is derived from the DB schema,
  // select('*') will fetch all columns defined for that row type.
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*") // Fetches all columns corresponding to HistoricalPriceRow
    .eq("date", targetDate);

  if (error) {
    console.error(
      `[HistPriceSvcByDate] Supabase query error for date ${targetDate}:`,
      error
    );
    // Propagate the error to be handled by the API route
    throw new Error(
      `Database query failed while fetching historical prices for date ${targetDate}: ${error.message}`
    );
  }

  // Supabase returns `null` for `data` if the query runs but finds no matching rows,
  // or an empty array depending on version/context.
  // We'll ensure an empty array is returned if no data.
  if (!data || data.length === 0) {
    console.log(
      `[HistPriceSvcByDate] No data found in Supabase for any symbol on ${targetDate}`
    );
    return [];
  }

  console.log(
    `[HistPriceSvcByDate] Fetched ${data.length} records for date ${targetDate}.`
  );
  // The data should already conform to HistoricalPriceRow[] due to select('*')
  // and the table type association, but casting can be explicit if desired.
  return data as HistoricalPriceRow[];
}
