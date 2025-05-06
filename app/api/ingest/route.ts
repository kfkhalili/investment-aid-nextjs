/* ──────────────────────────────────────────────────────────────────────
 * app/api/fetch/route.ts
 * Handler for GET requests to trigger data population for multiple symbols
 * (in batches with dynamically configurable size) and the earnings calendar (on batch 1).
 * Includes Bearer token authentication.
 * ---------------------------------------------------------------------*/
import { NextRequest, NextResponse } from "next/server";

import { getProfile } from "@/lib/services/profiles";
import { getIncomeStatementsForSymbol } from "@/lib/services/income-statements";
import { getBalanceSheetStatementsForSymbol } from "@/lib/services/balance-sheet-statements";
import { getCashFlowStatementsForSymbol } from "@/lib/services/cash-flow-statements";
import { getHistoricalPricesForSymbol } from "@/lib/services/historical-prices";
import { getLatestGradesConsensus } from "@/lib/services/grades-consensus";
import { getEarningsCalendar } from "@/lib/services/earnings-calendar";

import { getSupabaseServerClient } from "@/lib/supabase/serverClient";

interface SymbolResultDetails {
  profile: string;
  income: string;
  balance: string;
  cashflow: string;
  historicalprice: string;
  gradesconsensus: string;
}

interface SymbolProcessingResult {
  symbol: string;
  status: "Success" | "Failed";
  details: SymbolResultDetails;
  error?: string;
}

const STATEMENT_TYPES = [
  "income",
  "balance",
  "cashflow",
  "historicalprice",
  "gradesconsensus",
] as const;
type StatementType = (typeof STATEMENT_TYPES)[number];

async function fetchSymbols(): Promise<string[]> {
  const client = getSupabaseServerClient();
  const { data, error } = await client.from("profile_symbols").select("symbol");

  if (error) {
    console.error("Error fetching symbols from database:", error.message);
    throw new Error(`Failed to fetch symbols: ${error.message}`);
  }

  if (!data) {
    console.warn(
      "No data returned when fetching symbols, though no explicit error."
    );
    return [];
  }

  return data
    .map((item: { symbol: string | null }) => item.symbol)
    .filter(
      (symbol): symbol is string =>
        typeof symbol === "string" && symbol.length > 0
    );
}

function processSettledResult(
  result: PromiseSettledResult<unknown>,
  errorMessagePrefix: string = "Failed"
): string {
  if (result.status === "fulfilled") {
    return "Success";
  }
  const reason = result.reason;
  if (reason instanceof Error) {
    return `${errorMessagePrefix}: ${reason.message}`;
  }
  if (typeof reason === "string") {
    return `${errorMessagePrefix}: ${reason}`;
  }
  if (typeof reason === "object" && reason !== null) {
    try {
      return `${errorMessagePrefix}: ${JSON.stringify(reason)}`;
    } catch {
      return `${errorMessagePrefix}: Non-serializable object reason`;
    }
  }
  return `${errorMessagePrefix}: Unknown error reason type (${typeof reason})`;
}

function determineBatchSize(searchParams: URLSearchParams): number {
  const defaultHardcodedBatchSize = 5;

  // 1. Try query parameter 'size'
  const sizeParam = searchParams.get("size");
  if (sizeParam) {
    const parsedQuerySize = parseInt(sizeParam, 10);
    if (!isNaN(parsedQuerySize) && parsedQuerySize > 0) {
      console.log(
        `[Config] Batch size set from 'size' query parameter: ${parsedQuerySize}`
      );
      return parsedQuerySize;
    }
    console.warn(
      `[Config] Invalid 'size' query parameter: '${sizeParam}'. Falling back to ENV or default.`
    );
  }

  // 2. Try environment variable CRON_FETCH_BATCH_SIZE
  const envBatchSizeConfig = process.env.CRON_FETCH_BATCH_SIZE;
  if (envBatchSizeConfig) {
    const parsedEnvSize = parseInt(envBatchSizeConfig, 10);
    if (!isNaN(parsedEnvSize) && parsedEnvSize > 0) {
      console.log(
        `[Config] Batch size set from CRON_FETCH_BATCH_SIZE environment variable: ${parsedEnvSize}`
      );
      return parsedEnvSize;
    }
    console.warn(
      `[Config] Invalid CRON_FETCH_BATCH_SIZE: '${envBatchSizeConfig}'. Falling back to default.`
    );
  }

  // 3. Use hardcoded default
  console.log(
    `[Config] Batch size set to hardcoded default: ${defaultHardcodedBatchSize}`
  );
  return defaultHardcodedBatchSize;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // --- Authorization Check ---
  const authHeader = request.headers.get("authorization");
  const authToken = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  if (process.env.CRON_SECRET && authToken !== process.env.CRON_SECRET) {
    console.warn("[Auth] Unauthorized access attempt to /api/fetch endpoint.");
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid or missing Bearer token." },
      { status: 401 }
    );
  }
  // --- End Authorization Check ---

  const { searchParams } = new URL(request.url);
  const startTime = Date.now();

  // --- Batch Number Determination ---
  const batchParam = searchParams.get("batch");
  let batchNumber = 1; // Default to batch 1
  if (batchParam) {
    const parsedBatch = parseInt(batchParam, 10);
    if (isNaN(parsedBatch) || parsedBatch < 1) {
      return NextResponse.json(
        { error: "Invalid batch number provided. Must be a positive integer." },
        { status: 400 }
      );
    }
    batchNumber = parsedBatch;
  }

  // --- Batch Size Determination ---
  const BATCH_SIZE = determineBatchSize(searchParams);
  // --- End Batch Size Determination ---

  console.log(
    `GET /api/fetch called (authorized). Batch: ${batchNumber}, Size: ${BATCH_SIZE}`
  );

  let allSymbols: string[];
  try {
    allSymbols = await fetchSymbols();
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[Critical] Error fetching symbols:", errorMessage);
    return NextResponse.json(
      {
        message: `Population attempt failed: Could not fetch symbols. Error: ${errorMessage}`,
        batch: batchNumber,
        batchSize: BATCH_SIZE,
        durationMs: Date.now() - startTime,
        earningsCalendarStatus: "Not Attempted (symbol fetch failure)",
        details: [],
      },
      { status: 500 }
    );
  }

  const totalSymbolsAvailable = allSymbols.length;
  const offset = (batchNumber - 1) * BATCH_SIZE;
  const symbolsForThisBatch = allSymbols.slice(offset, offset + BATCH_SIZE);

  let nextBatch: number | null = null;
  if (offset + BATCH_SIZE < totalSymbolsAvailable) {
    nextBatch = batchNumber + 1;
  }

  let symbolProcessingResults: SymbolProcessingResult[] = [];

  if (symbolsForThisBatch.length > 0) {
    console.log(
      `[Ingest] Batch ${batchNumber}: Processing ${symbolsForThisBatch.length} symbols (offset ${offset}, total available ${totalSymbolsAvailable}).`
    );
    const populationPromises = symbolsForThisBatch.map(
      async (symbol): Promise<SymbolProcessingResult> => {
        const symbolUpper = symbol.toUpperCase();
        const results: SymbolResultDetails = {
          profile: "Skipped",
          income: "Skipped",
          balance: "Skipped",
          cashflow: "Skipped",
          historicalprice: "Skipped",
          gradesconsensus: "Skipped",
        };
        let overallStatus: "Success" | "Failed" = "Failed";
        let overallError: string | undefined = undefined;

        console.log(
          `[ingest] Processing ${symbolUpper} for batch ${batchNumber}...`
        );

        try {
          await getProfile(symbolUpper);
          results.profile = "Success";
          console.log(`[ingest] Profile fetch complete for ${symbolUpper}.`);
        } catch (profileError: unknown) {
          const errorMsg =
            profileError instanceof Error
              ? profileError.message
              : String(profileError);
          results.profile = `Failed: ${errorMsg}`;
          overallError = `Profile fetch failed: ${errorMsg}. Statements skipped.`;
          console.error(
            `[Ingest] Profile fetch for ${symbolUpper} failed, skipping statements. Error:`,
            profileError
          );
          return {
            symbol: symbolUpper,
            status: "Failed",
            details: results,
            error: overallError,
          };
        }

        try {
          console.log(`[Ingest] Fetching statements for ${symbolUpper}...`);
          const statementPromises = [
            getIncomeStatementsForSymbol(symbolUpper),
            getBalanceSheetStatementsForSymbol(symbolUpper),
            getCashFlowStatementsForSymbol(symbolUpper),
            getHistoricalPricesForSymbol(symbolUpper),
            getLatestGradesConsensus(symbolUpper),
          ];
          const settledResults = await Promise.allSettled(statementPromises);

          results.income = processSettledResult(settledResults[0]);
          results.balance = processSettledResult(settledResults[1]);
          results.cashflow = processSettledResult(settledResults[2]);
          results.historicalprice = processSettledResult(settledResults[3]);
          results.gradesconsensus = processSettledResult(settledResults[4]);

          const allStatementsSucceeded = settledResults.every(
            (r) => r.status === "fulfilled"
          );

          if (allStatementsSucceeded) {
            overallStatus = "Success";
          } else {
            overallStatus = "Failed";
            const failedStatementMessages = settledResults
              .map((r, index) => ({ result: r, name: STATEMENT_TYPES[index] }))
              .filter((item) => item.result.status === "rejected")
              .map(
                (item) => `${item.name}: ${processSettledResult(item.result)}`
              )
              .join("; ");
            overallError = `One or more statement fetches failed. Details: ${failedStatementMessages}`;
          }
          console.log(
            `[Ingest] Finished statements for ${symbolUpper}. Status: ${overallStatus}`
          );
        } catch (processingError: unknown) {
          const errorMsg =
            processingError instanceof Error
              ? processingError.message
              : String(processingError);
          overallStatus = "Failed";
          overallError = `Unexpected error during statement processing for ${symbolUpper}: ${errorMsg}`;
          console.error(
            `[Ingest] Unexpected error for ${symbolUpper}:`,
            processingError
          );
          STATEMENT_TYPES.forEach((type: StatementType) => {
            if (results[type] === "Skipped")
              results[
                type
              ] = `Failed (unexpected processing error: ${errorMsg})`;
          });
        }
        return {
          symbol: symbolUpper,
          status: overallStatus,
          details: results,
          error: overallError,
        };
      }
    );
    symbolProcessingResults = await Promise.all(populationPromises);
  } else {
    console.log(
      `[Ingest] Batch ${batchNumber}: No symbols to process for this batch range (offset ${offset}, total available ${totalSymbolsAvailable}).`
    );
  }

  let earningsCalendarStatus: string = "Skipped (processed only on batch 1)";
  if (batchNumber === 1) {
    try {
      console.log("[Ingest] Batch 1: Fetching earnings calendar...");
      await getEarningsCalendar();
      earningsCalendarStatus = "Success";
      console.log("[Ingest] Earnings calendar fetched successfully.");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      earningsCalendarStatus = `Failed: ${errorMsg}`;
      console.error(
        "[Ingest] Error getting earnings calendar:",
        errorMsg,
        error
      );
    }
  }

  const endTime = Date.now();
  const durationMs = endTime - startTime;

  const successCount = symbolProcessingResults.filter(
    (r) => r.status === "Success"
  ).length;
  const failedCount = symbolProcessingResults.length - successCount;

  let batchMessage: string;
  if (symbolsForThisBatch.length > 0) {
    batchMessage = `Batch ${batchNumber} (size ${BATCH_SIZE}) processed. Symbols attempted: ${symbolsForThisBatch.length}. Success: ${successCount}, Failed: ${failedCount}.`;
  } else {
    if (batchNumber === 1 && totalSymbolsAvailable === 0) {
      batchMessage = "No symbols found in the system to process at all.";
    } else {
      batchMessage = `Batch ${batchNumber} (size ${BATCH_SIZE}): No symbols in this batch range. Total symbols available: ${totalSymbolsAvailable}.`;
    }
  }

  console.log(
    `Batch ${batchNumber} (size ${BATCH_SIZE}) processing finished in ${durationMs}ms. Symbols: ${successCount} success, ${failedCount} failed. Earnings Calendar: ${earningsCalendarStatus}`
  );

  return NextResponse.json(
    {
      message: batchMessage,
      batch: batchNumber,
      batchSize: BATCH_SIZE,
      symbolsAttemptedInBatch: symbolsForThisBatch.length,
      symbolsProcessedInBatch: symbolProcessingResults.length,
      totalSymbolsAvailable: totalSymbolsAvailable,
      nextBatch: nextBatch,
      durationMs: durationMs,
      earningsCalendarStatus: earningsCalendarStatus,
      details: symbolProcessingResults,
    },
    { status: 200 }
  );
}
