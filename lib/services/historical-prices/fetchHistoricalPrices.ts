/* ──────────────────────────────────────────────────────────────────────
 * lib/services/historical-prices/fetchHistoricalPrices.ts
 * Dedicated service function for fetching/caching historical price data.
 * (Profile dependency check moved to the API route handler)
 * ---------------------------------------------------------------------*/
import { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import {
  RawHistoricalPriceResponse,
  RawHistoricalPriceItem,
  HistoricalPriceRow,
  HistoricalPriceInsertData,
} from "./types";
import { CACHE_TTL_MS } from "./constants";

const TABLE_NAME = "historical_prices";
const FMP_PATH = "historical-price-full";
const FMP_BASE_PATH = "v3";

// Helper function to safely get the FMP API key
function getFmpApiKey(): string {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    throw new Error("FMP_API_KEY environment variable is not set.");
  }
  return apiKey;
}

/**
 * Maps a single raw historical item from FMP to the DB insert structure.
 */
function mapRawItemToInsertData(
  rawItem: RawHistoricalPriceItem,
  symbol: string
): HistoricalPriceInsertData {
  // Helper to round number or return null for BIGINT columns that allow NULL
  const roundToBigIntOrNull = (
    value: number | null | undefined
  ): number | null => {
    if (value === null || value === undefined) return null;
    return Math.round(value);
  };
  return {
    symbol: symbol,
    date: rawItem.date, // Assuming FMP date is 'YYYY-MM-DD' compatible with DATE type
    open: rawItem.open ?? null,
    high: rawItem.high ?? null,
    low: rawItem.low ?? null,
    close: rawItem.close ?? null,
    adj_close: rawItem.adjClose ?? null,
    volume: roundToBigIntOrNull(rawItem.volume), // Round potentially float volume
    unadjusted_volume: roundToBigIntOrNull(rawItem.unadjustedVolume), // Round potentially float volume
    change: rawItem.change ?? null,
    change_percent: rawItem.changePercent ?? null,
    vwap: rawItem.vwap ?? null,
    label: rawItem.label ?? null,
    change_over_time: rawItem.changeOverTime ?? null,
  };
}

/**
 * Fetches historical price data for a symbol, utilizing caching via Supabase.
 * Assumes the related profile already exists (checked by the caller/route).
 *
 * @param symbol The stock symbol.
 * @returns Promise<HistoricalPriceRow[]> An array of historical price rows (unsorted/unfiltered).
 */
export async function getHistoricalPricesForSymbol(
  symbol: string
): Promise<HistoricalPriceRow[]> {
  const supabase: SupabaseClient = getSupabaseServerClient();
  const symbolUpper = symbol.toUpperCase();

  console.log(`[HistPrice] Checking cache/fetching for ${symbolUpper}...`);

  // --- Step 1: Check Cache (Find latest entry for the symbol) ---
  // Check latest date, not modified_at, as historical data is keyed by date
  const { data: latestEntry, error: findError } = (await supabase
    .from(TABLE_NAME)
    .select("date, modified_at") // Select date and modified_at for cache check
    .eq("symbol", symbolUpper)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle()) as {
    data: Pick<HistoricalPriceRow, "date" | "modified_at"> | null;
    error: PostgrestError | null;
  };

  if (findError && findError.code !== "PGRST116") {
    // Ignore error if table is empty for symbol
    console.error(
      `[HistPrice] Error checking cache for ${symbolUpper}:`,
      findError
    );
    throw findError;
  }

  // Cache logic: Check if latest entry exists and if its modified_at is recent
  const isFresh =
    latestEntry &&
    Date.now() - new Date(latestEntry.modified_at).getTime() < CACHE_TTL_MS;

  if (isFresh) {
    console.log(`[HistPrice] Cache hit for ${symbolUpper}. Fetching from DB.`);
    // Fetch all data for the symbol from DB if cache is fresh
    const { data: cachedData, error: fetchError } = (await supabase
      .from(TABLE_NAME)
      .select("*") // Select all columns
      .eq("symbol", symbolUpper)
      .order("date", { ascending: false })) as {
      data: HistoricalPriceRow[] | null;
      error: PostgrestError | null;
    };

    if (fetchError) {
      console.error(
        `[HistPrice] Error fetching cached data for ${symbolUpper}:`,
        fetchError
      );
      throw fetchError;
    }
    return cachedData ?? []; // Return DB data or empty array
  }

  // --- Step 2: Fetch from FMP API (Cache Miss or Stale) ---
  console.log(
    `[HistPrice] Cache miss/stale for ${symbolUpper}. Fetching from FMP...`
  );
  const apiKey = getFmpApiKey();
  // Construct URL (assuming v3 and symbol in path for this specific endpoint)
  const actualUrl = `https://financialmodelingprep.com/api/${FMP_BASE_PATH}/${FMP_PATH}/${symbolUpper}?apikey=${apiKey}`;
  console.log(`Fetching from FMP: ${actualUrl.replace(apiKey, "***")}`);

  const response = await fetch(actualUrl, { cache: "no-store" });
  if (!response.ok) {
    let eBody = `(Status ${response.status})`;
    try {
      eBody = await response.text();
    } catch {}
    console.error(
      `[HistPrice] FMP Error Body (${response.status}) for ${symbolUpper}: ${eBody}`
    );
    // If stale data exists, return it, otherwise throw
    if (latestEntry) {
      console.warn(
        `[HistPrice] FMP fetch failed for ${symbolUpper}, returning potentially stale data.`
      );
      const { data: staleData, error: staleFetchError } = (await supabase
        .from(TABLE_NAME)
        .select("*")
        .eq("symbol", symbolUpper)
        .order("date", { ascending: false })) as {
        data: HistoricalPriceRow[] | null;
        error: PostgrestError | null;
      };
      if (staleFetchError) {
        console.error(
          `[HistPrice] Error fetching stale data for ${symbolUpper}:`,
          staleFetchError
        );
        throw staleFetchError;
      }
      return staleData ?? [];
    }
    throw new Error(
      `FMP request failed (${response.status}) for historical prices.`
    );
  }

  const rawResponse: unknown = await response.json();

  // Validate the expected structure
  if (
    typeof rawResponse !== "object" ||
    rawResponse === null ||
    !("historical" in rawResponse) ||
    !Array.isArray(rawResponse.historical)
  ) {
    console.error(
      "[HistPrice] Invalid data structure received from FMP:",
      rawResponse
    );
    throw new Error(
      `Invalid historical price data structure received from FMP for ${symbolUpper}.`
    );
  }

  const historicalData = (rawResponse as RawHistoricalPriceResponse).historical;
  if (historicalData.length === 0) {
    console.warn(
      `[HistPrice] FMP returned no historical data for ${symbolUpper}.`
    );
    return []; // Return empty if no data from FMP
  }

  // --- Step 3: Map and Prepare for Upsert ---
  const now = new Date().toISOString();
  const rowsToUpsert = historicalData.map((item) => ({
    ...mapRawItemToInsertData(item, symbolUpper),
    modified_at: now, // Add timestamp for cache tracking
  }));

  // --- Step 4: Upsert into Supabase ---
  const conflictColumns = "symbol,date"; // Unique constraint
  console.log(
    `[HistPrice] Upserting ${rowsToUpsert.length} rows for ${symbolUpper} to ${TABLE_NAME} on conflict (${conflictColumns}).`
  );

  // Upsert all rows. We don't strictly need to select them back here.
  const { error: upsertError } = await supabase
    .from(TABLE_NAME)
    .upsert(rowsToUpsert, { onConflict: conflictColumns });

  if (upsertError) {
    console.error(
      `[HistPrice] Supabase upsert error for ${symbolUpper}:`,
      upsertError
    );
    throw new Error(
      `Database upsert failed: ${upsertError.message} (Code: ${upsertError.code})`
    );
  }

  // --- Step 5: Fetch the newly upserted/updated data from DB ---
  console.log(`[HistPrice] Fetching updated data from DB for ${symbolUpper}.`);
  const { data: finalData, error: finalFetchError } = (await supabase
    .from(TABLE_NAME)
    .select("*") // Select all for now
    .eq("symbol", symbolUpper)
    .order("date", { ascending: false })) as {
    data: HistoricalPriceRow[] | null;
    error: PostgrestError | null;
  };

  if (finalFetchError) {
    console.error(
      `[HistPrice] Error fetching final data for ${symbolUpper} after upsert:`,
      finalFetchError
    );
    throw finalFetchError;
  }

  console.log(
    `[HistPrice] Successfully fetched/updated ${
      finalData?.length ?? 0
    } records for ${symbolUpper}.`
  );
  return finalData ?? []; // Return the data just stored/updated
}
