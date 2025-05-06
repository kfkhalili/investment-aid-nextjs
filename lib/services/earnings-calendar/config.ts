/* ──────────────────────────────────────────────────────────────────────
 * src/api/earnings-calendar/service/config.ts (Supabase Version)
 * Configuration for the Earnings Calendar service using Supabase.
 * ---------------------------------------------------------------------*/
import {
  GenericSupabaseServiceConfig,
  FetchMode,
  mapRowToPartialApi, // Assuming this is the correct path for the generic mapper
} from "@/lib/common/supabase";
import { earningsCalendarKeyOrder, CACHE_TTL_MS } from "./constants";
import {
  RawEarningsCalendarItem,
  EarningsCalendarRow,
  EarningsCalendarApiItem,
  mapRawEarningsCalendarToRow,
} from "./types";

/**
 * Processes the raw earnings calendar data array from FMP.
 * 1. Filters out items with invalid/missing symbol or date.
 * 2. Validates date format (YYYY-MM-DD).
 * 3. Deduplicates items based on (symbol, date), preferring the one with the latest 'lastUpdated' timestamp.
 *
 * @param rawData The raw array of earnings calendar items from the FMP API.
 * @returns A cleaned array of RawEarningsCalendarItem.
 */
const processEarningsCalendarRawData = (
  rawData: RawEarningsCalendarItem[]
): RawEarningsCalendarItem[] => {
  // Step 1 & 2: Filter and validate essential fields
  const filteredItems = rawData.filter((item: RawEarningsCalendarItem) => {
    if (
      !item.symbol ||
      typeof item.symbol !== "string" ||
      item.symbol.trim() === ""
    ) {
      console.warn(
        "[EarningsCalendarService] Filtering raw item: missing or invalid symbol.",
        item
      );
      return false;
    }
    if (
      !item.date ||
      typeof item.date !== "string" ||
      item.date.trim() === ""
    ) {
      console.warn(
        "[EarningsCalendarService] Filtering raw item: missing or invalid date string.",
        item
      );
      return false;
    }
    // Validate YYYY-MM-DD format for the date field
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
      console.warn(
        `[EarningsCalendarService] Filtering raw item: invalid date format for '${item.date}' (expected YYYY-MM-DD).`,
        item
      );
      return false;
    }
    return true;
  });

  // Step 3: Deduplicate
  const uniqueRawItemsMap = new Map<string, RawEarningsCalendarItem>();
  for (const item of filteredItems) {
    // item.date is confirmed as a non-null, correctly formatted string here
    const key = `${item.symbol}|${item.date!}`;
    const existingItem = uniqueRawItemsMap.get(key);

    if (existingItem) {
      let takeNewItem = true; // Default to taking the current (new) item

      // Compare based on lastUpdated if both items have it
      if (existingItem.lastUpdated && item.lastUpdated) {
        try {
          const existingTimestamp = new Date(
            existingItem.lastUpdated
          ).getTime();
          const currentTimestamp = new Date(item.lastUpdated).getTime();

          // Handle cases where date parsing might result in NaN
          if (isNaN(existingTimestamp) && !isNaN(currentTimestamp)) {
            takeNewItem = true; // Existing date invalid, current is valid
          } else if (!isNaN(existingTimestamp) && isNaN(currentTimestamp)) {
            takeNewItem = false; // Existing date valid, current is invalid, keep existing
          } else if (isNaN(existingTimestamp) && isNaN(currentTimestamp)) {
            // Both lastUpdated dates are invalid, could log and decide (e.g., take new by default)
            console.warn(
              `[EarningsCalendarService] Both lastUpdated dates are invalid for key ${key}. Taking current item by default.`
            );
            takeNewItem = true;
          } else if (existingTimestamp >= currentTimestamp) {
            // Existing is newer or same, keep existing
            takeNewItem = false;
          }
          // If currentTimestamp > existingTimestamp, takeNewItem remains true (overwrite with new)
        } catch (dateParseError) {
          console.warn(
            `[EarningsCalendarService] Error parsing lastUpdated dates for key ${key}. Defaulting to overwrite with current item.`,
            dateParseError
          );
          takeNewItem = true; // On error, default to taking the new item
        }
      } else if (existingItem.lastUpdated && !item.lastUpdated) {
        // Existing has lastUpdated, current (new) one doesn't; keep existing.
        takeNewItem = false;
      }
      // If current (new) one has lastUpdated and existing doesn't, takeNewItem remains true (default).
      // If neither has lastUpdated, takeNewItem remains true (effectively taking the latter item from the input array).

      if (takeNewItem) {
        uniqueRawItemsMap.set(key, item);
      }
    } else {
      uniqueRawItemsMap.set(key, item);
    }
  }
  const deduplicatedRawArray = Array.from(uniqueRawItemsMap.values());

  if (deduplicatedRawArray.length < rawData.length) {
    console.log(
      `[EarningsCalendarService] Processed raw data: Original: ${rawData.length}, Filtered: ${filteredItems.length}, Final (deduplicated): ${deduplicatedRawArray.length}`
    );
  }

  return deduplicatedRawArray;
};

/**
 * Configuration object passed to `createGenericSupabaseService`.
 */
export const earningsCalendarConfig: GenericSupabaseServiceConfig<
  RawEarningsCalendarItem,
  EarningsCalendarRow,
  EarningsCalendarApiItem
> = {
  // --- Core Identification & Storage ---
  tableName: "earnings_calendar",

  // --- FMP API Fetching ---
  fetchMode: FetchMode.FullCollection, // Fetches the entire calendar snapshot
  fmpBasePath: "stable", // Uses stable path
  fmpPath: "earnings-calendar", // Endpoint path
  // fmpSymbolLocation: not needed for FullCollection
  fmpParams: {}, // No extra static params usually needed

  // --- Caching ---
  cacheTtlMs: CACHE_TTL_MS,

  // --- Data Structure, Uniqueness & Mapping ---
  // Unique constraint for upsert (symbol + date for daily event)
  uniqueKeyColumns: ["symbol", "date"],
  mapRawToRow: mapRawEarningsCalendarToRow,
  mapRowToApi: mapRowToPartialApi, // Use common mapper
  apiFieldOrder: earningsCalendarKeyOrder,

  // --- Behavior Modifiers ---
  // Not directly applicable for FullCollection cache checks in the same way
  // isSingleRecordPerSymbol: undefined,
  // sortByFieldForLatest: undefined,

  // --- Optional Callbacks ---
  // Example for validateRawData (optional, can be used for initial schema check if needed)
  // validateRawData: (data: unknown): data is RawEarningsCalendarItem[] => {
  //   return Array.isArray(data) && data.every(item => typeof item === 'object' && item !== null && 'symbol' in item && 'date' in item);
  // },
  processRawDataArray: processEarningsCalendarRawData, // Assign the processing function
};
