// lib/services/fetch-all-data/service.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

// Import individual data fetching functions
import { getProfile } from "@/lib/services/profiles";
import { getIncomeStatementsForSymbol } from "@/lib/services/income-statements";
import { getBalanceSheetStatementsForSymbol } from "@/lib/services/balance-sheet-statements";
import { getCashFlowStatementsForSymbol } from "@/lib/services/cash-flow-statements";
import { getHistoricalPricesForSymbol } from "@/lib/services/historical-prices";
import { getLatestGradesConsensus } from "@/lib/services/grades-consensus";
// getEarningsCalendar is a global fetch, not per-symbol, so it's handled separately

// --- Types ---
export interface SymbolResultDetails {
  profile: string;
  income: string;
  balance: string;
  cashflow: string;
  historicalprice: string;
  gradesconsensus: string;
}

export interface SymbolProcessingResult {
  symbol: string;
  status: "Success" | "Failed" | "Profile_Fetch_Failed";
  details: SymbolResultDetails;
  error?: string;
}

const STATEMENT_TYPES_ORDERED = [
  "income",
  "balance",
  "cashflow",
  "historicalprice",
  "gradesconsensus",
] as const;

// --- Helper Functions ---

/**
 * Processes a PromiseSettledResult and returns a status string.
 * @param result The PromiseSettledResult to process.
 * @param errorMessagePrefix Prefix for error messages.
 * @returns A string indicating "Success" or a formatted error message.
 */
function processSettledResult(
  result: PromiseSettledResult<unknown>,
  errorMessagePrefix: string = "Failed"
): string {
  if (result.status === "fulfilled") {
    return "Success";
  }
  // Handle rejected promise
  const reason = result.reason;
  if (reason instanceof Error) {
    return `${errorMessagePrefix}: ${reason.message}`;
  }
  if (typeof reason === "string") {
    return `${errorMessagePrefix}: ${reason}`;
  }
  // Attempt to stringify other types, with a fallback
  try {
    return `${errorMessagePrefix}: ${JSON.stringify(reason)}`;
  } catch {
    return `${errorMessagePrefix}: Non-serializable object reason`;
  }
}

/**
 * Fetches all unique symbols from the 'profile_symbols' view.
 * @param supabase Optional Supabase client instance.
 * @returns A promise that resolves to an array of symbol strings.
 */
export async function fetchAllSymbols(
  supabaseInstance?: SupabaseClient
): Promise<string[]> {
  const supabase = supabaseInstance || getSupabaseServerClient();
  const { data, error } = await supabase
    .from("profile_symbols")
    .select("symbol");

  if (error) {
    console.error(
      "[FetchAllDataSvc][fetchAllSymbols] Error fetching symbols:",
      error.message
    );
    throw new Error(`Failed to fetch symbols: ${error.message}`);
  }

  if (!data) {
    console.warn(
      "[FetchAllDataSvc][fetchAllSymbols] No data returned when fetching symbols."
    );
    return [];
  }

  return data
    .map((item: { symbol: string | null }) => item.symbol)
    .filter(
      (symbol): symbol is string =>
        typeof symbol === "string" && symbol.trim().length > 0
    );
}

// --- Core Service Function for a Single Symbol ---

/**
 * Fetches all relevant data (profile, statements, prices, consensus) for a single symbol.
 * @param symbol The stock symbol to process.
 * @param supabaseInstance Optional Supabase client instance.
 * @returns A promise that resolves to a SymbolProcessingResult.
 */
export async function processSymbolData(
  symbol: string
): Promise<SymbolProcessingResult> {
  const symbolUpper = symbol.toUpperCase();
  // Individual services (getProfile, etc.) will create their own Supabase clients if not passed.
  // This is acceptable as this function is per-symbol.

  const results: SymbolResultDetails = {
    profile: "Skipped",
    income: "Skipped",
    balance: "Skipped",
    cashflow: "Skipped",
    historicalprice: "Skipped",
    gradesconsensus: "Skipped",
  };
  let overallStatus: "Success" | "Failed" | "Profile_Fetch_Failed" = "Failed"; // Default to Failed
  let overallError: string | undefined = undefined;

  console.log(
    `[FetchAllDataSvc][processSymbolData] Processing ${symbolUpper}...`
  );

  // 1. Fetch Profile (critical path)
  try {
    await getProfile(symbolUpper); // Assumes getProfile handles its own Supabase client & upsert
    results.profile = "Success";
    console.log(
      `[FetchAllDataSvc][processSymbolData] Profile fetch complete for ${symbolUpper}.`
    );
  } catch (profileError: unknown) {
    const errorMsg =
      profileError instanceof Error
        ? profileError.message
        : String(profileError);
    results.profile = `Failed: ${errorMsg}`;
    overallError = `Profile fetch failed: ${errorMsg}. Subsequent data fetches skipped.`;
    console.error(
      `[FetchAllDataSvc][processSymbolData] Profile fetch for ${symbolUpper} failed, skipping other data. Error:`,
      profileError
    );
    return {
      symbol: symbolUpper,
      status: "Profile_Fetch_Failed",
      details: results,
      error: overallError,
    };
  }

  // 2. Fetch other data types in parallel if profile fetch was successful
  try {
    console.log(
      `[FetchAllDataSvc][processSymbolData] Fetching other data for ${symbolUpper}...`
    );
    const dataFetchPromises = [
      getIncomeStatementsForSymbol(symbolUpper),
      getBalanceSheetStatementsForSymbol(symbolUpper),
      getCashFlowStatementsForSymbol(symbolUpper),
      getHistoricalPricesForSymbol(symbolUpper),
      getLatestGradesConsensus(symbolUpper),
    ];

    const settledResults = await Promise.allSettled(dataFetchPromises);

    results.income = processSettledResult(
      settledResults[0],
      "Income fetch failed"
    );
    results.balance = processSettledResult(
      settledResults[1],
      "Balance fetch failed"
    );
    results.cashflow = processSettledResult(
      settledResults[2],
      "Cashflow fetch failed"
    );
    results.historicalprice = processSettledResult(
      settledResults[3],
      "Historical Price fetch failed"
    );
    results.gradesconsensus = processSettledResult(
      settledResults[4],
      "Grades Consensus fetch failed"
    );

    const allDataSucceeded = settledResults.every(
      (r) => r.status === "fulfilled"
    );

    if (allDataSucceeded) {
      overallStatus = "Success";
    } else {
      overallStatus = "Failed"; // Indicates one or more sub-fetches failed
      const failedDataMessages = settledResults
        .map((r, index) => ({
          result: r,
          name: STATEMENT_TYPES_ORDERED[index],
        }))
        .filter((item) => item.result.status === "rejected")
        .map((item) => `${item.name}: ${processSettledResult(item.result)}`)
        .join("; ");
      overallError = `One or more data fetches failed after profile success. Details: ${failedDataMessages}`;
    }
    console.log(
      `[FetchAllDataSvc][processSymbolData] Finished other data for ${symbolUpper}. Status: ${overallStatus}`
    );
  } catch (processingError: unknown) {
    // Catch unexpected errors during the Promise.allSettled phase
    const errorMsg =
      processingError instanceof Error
        ? processingError.message
        : String(processingError);
    overallStatus = "Failed";
    overallError = `Unexpected error during data processing for ${symbolUpper}: ${errorMsg}`;
    console.error(
      `[FetchAllDataSvc][processSymbolData] Unexpected error for ${symbolUpper}:`,
      processingError
    );
    // Mark any remaining "Skipped" as failed due to this unexpected error
    (Object.keys(results) as Array<keyof SymbolResultDetails>).forEach(
      (key) => {
        if (results[key] === "Skipped") {
          results[key] = `Failed (unexpected processing error: ${errorMsg})`;
        }
      }
    );
  }

  return {
    symbol: symbolUpper,
    status: overallStatus,
    details: results,
    error: overallError,
  };
}
