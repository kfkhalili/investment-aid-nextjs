/* ──────────────────────────────────────────────────────────────────────
 * src/api/grades-consensus/service/fetchByDate.ts
 * Dedicated function to fetch grades consensus for a specific symbol and date.
 * ---------------------------------------------------------------------*/
import { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient"; // Adjust path
import {
  mapRowToPartialApi,
  reorderAndFilterObjectKeys,
} from "@/lib/common/supabase"; // Adjust path
import type { GradesConsensusRow, GradesConsensusApiItem } from "./types";
import { gradesConsensusKeyOrder } from "./constants"; // Import key order

const TABLE_NAME = "grades_consensus";

// Helper to generate select string
function generateSelectString(
  order?: ReadonlyArray<keyof GradesConsensusApiItem>
): string {
  const alwaysSelect = ["id", "symbol", "date", "modified_at"]; // Include date
  if (!order || order.length === 0) {
    return "*";
  }
  const apiKeys = order.filter((k) => typeof k === "string") as string[];
  const columnsToSelect = [...new Set([...alwaysSelect, ...apiKeys])];
  return columnsToSelect.join(", ");
}

/**
 * Fetches the grades consensus snapshot for a specific symbol and date.
 * Assumes the related profile exists (checked by the caller/route).
 *
 * @param symbol The stock symbol (uppercase).
 * @param date The specific date in 'YYYY-MM-DD' format.
 * @returns Promise<Partial<GradesConsensusApiItem> | null> The consensus data or null if not found.
 */
export async function getGradesConsensusForDateAndSymbol(
  symbol: string,
  date: string
): Promise<Partial<GradesConsensusApiItem> | null> {
  const supabase: SupabaseClient = getSupabaseServerClient();
  const selectString = generateSelectString(gradesConsensusKeyOrder);
  const filter = { symbol: symbol, date: date };

  console.log(
    `[Grades Service] Fetching from DB for ${symbol} on ${date} with select: ${selectString}`
  );

  // Fetch the specific record for the symbol and date
  // Renamed 'doc' to 'row'
  const { data: row, error } = (await supabase
    .from(TABLE_NAME)
    .select(selectString)
    .match(filter)
    .maybeSingle()) as {
    data: GradesConsensusRow | null;
    error: PostgrestError | null;
  }; // Cast result

  if (error) {
    console.error(
      `[Grades Service] Supabase error fetching by date for ${symbol} on ${date}:`,
      error
    );
    return null; // Return null on error
  }

  if (!row) {
    // Check if row is null
    console.log(`[Grades Service] No data found for ${symbol} on ${date}.`);
    return null;
  }

  // Map the found row to the API shape and apply ordering/filtering
  const mapped = mapRowToPartialApi(row); // Use common mapper with the row
  const shaped = reorderAndFilterObjectKeys(mapped, gradesConsensusKeyOrder); // Use common helper

  return shaped;
}
