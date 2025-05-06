// app/api/fetch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import {
  fetchAllSymbols,
  processSymbolData,
  type SymbolProcessingResult,
} from "@/lib/services/ingest";
import { getEarningsCalendar } from "@/lib/services/earnings-calendar"; // For global earnings calendar

/**
 * Determines the batch size based on query parameters, environment variables, or a default.
 * @param searchParams URLSearchParams from the request.
 * @returns The determined batch size.
 */
function determineBatchSize(searchParams: URLSearchParams): number {
  const defaultHardcodedBatchSize = 5; // Default if no other config is found

  const sizeParam = searchParams.get("size");
  if (sizeParam) {
    const parsedQuerySize = parseInt(sizeParam, 10);
    if (!isNaN(parsedQuerySize) && parsedQuerySize > 0) {
      console.log(
        `[API FetchData ALL][Config] Batch size from 'size' query: ${parsedQuerySize}`
      );
      return parsedQuerySize;
    }
    console.warn(
      `[API FetchData ALL][Config] Invalid 'size' query: '${sizeParam}'. Falling back.`
    );
  }

  const envBatchSizeConfig = process.env.CRON_FETCH_BATCH_SIZE;
  if (envBatchSizeConfig) {
    const parsedEnvSize = parseInt(envBatchSizeConfig, 10);
    if (!isNaN(parsedEnvSize) && parsedEnvSize > 0) {
      console.log(
        `[API FetchData ALL][Config] Batch size from CRON_FETCH_BATCH_SIZE env: ${parsedEnvSize}`
      );
      return parsedEnvSize;
    }
    console.warn(
      `[API FetchData ALL][Config] Invalid CRON_FETCH_BATCH_SIZE: '${envBatchSizeConfig}'. Falling back.`
    );
  }

  console.log(
    `[API FetchData ALL][Config] Batch size set to default: ${defaultHardcodedBatchSize}`
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
    console.warn("[API FetchData ALL][Auth] Unauthorized access attempt.");
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid or missing Bearer token." },
      { status: 401 }
    );
  }
  // --- End Authorization Check ---

  const { searchParams } = new URL(request.url);
  const startTime = Date.now();
  const supabase = getSupabaseServerClient(); // Client for fetching all symbols

  // --- Batch Number Determination ---
  const batchParam = searchParams.get("batch");
  let batchNumber = 1;
  if (batchParam) {
    const parsedBatch = parseInt(batchParam, 10);
    if (isNaN(parsedBatch) || parsedBatch < 1) {
      return NextResponse.json(
        { error: "Invalid batch number. Must be a positive integer." },
        { status: 400 }
      );
    }
    batchNumber = parsedBatch;
  }

  // --- Batch Size Determination ---
  const BATCH_SIZE = determineBatchSize(searchParams);

  console.log(
    `[API FetchData ALL] GET request authorized. Batch: ${batchNumber}, Size: ${BATCH_SIZE}`
  );

  let allSymbols: string[];
  try {
    allSymbols = await fetchAllSymbols(supabase); // Use the service function
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(
      "[API FetchData ALL][Critical] Error fetching symbols:",
      errorMessage
    );
    return NextResponse.json(
      {
        message: `Data fetch attempt failed: Could not fetch symbols. Error: ${errorMessage}`,
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
      `[API FetchData ALL] Batch ${batchNumber}: Processing ${symbolsForThisBatch.length} symbols (offset ${offset}, total ${totalSymbolsAvailable}).`
    );

    // Process symbols in parallel for the current batch
    const processingPromises = symbolsForThisBatch.map((symbol) =>
      processSymbolData(
        symbol /*, supabase - optional if underlying services handle their own client */
      )
    );
    // Using Promise.all to collect results, assuming individual processSymbolData handles its errors gracefully
    // and returns a SymbolProcessingResult even on failure within its scope.
    try {
      symbolProcessingResults = await Promise.all(processingPromises);
    } catch (batchProcessingError) {
      // This catch is for errors if Promise.all itself fails, which shouldn't happen if processSymbolData always resolves.
      // Individual errors are within SymbolProcessingResult.error
      console.error(
        `[API FetchData ALL] Unexpected error processing batch ${batchNumber}:`,
        batchProcessingError
      );
      // Potentially add a global error to the response here if needed
    }
  } else {
    console.log(
      `[API FetchData ALL] Batch ${batchNumber}: No symbols to process for this batch range.`
    );
  }

  let earningsCalendarStatus: string =
    "Skipped (not batch 1 or no symbols in batch 1)";
  if (batchNumber === 1) {
    // Fetch earnings calendar only on the first batch run
    try {
      console.log(
        "[API FetchData ALL] Batch 1: Attempting to fetch earnings calendar..."
      );
      await getEarningsCalendar(); // Assumes this function handles its own client and upsert
      earningsCalendarStatus = "Success";
      console.log(
        "[API FetchData ALL] Earnings calendar fetched successfully."
      );
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      earningsCalendarStatus = `Failed: ${errorMsg}`;
      console.error(
        "[API FetchData ALL] Error fetching earnings calendar:",
        errorMsg
      );
    }
  }

  const endTime = Date.now();
  const durationMs = endTime - startTime;

  const successCount = symbolProcessingResults.filter(
    (r) => r.status === "Success"
  ).length;
  const profileFailedCount = symbolProcessingResults.filter(
    (r) => r.status === "Profile_Fetch_Failed"
  ).length;
  const otherFailedCount = symbolProcessingResults.filter(
    (r) => r.status === "Failed"
  ).length;

  let batchMessage: string;
  if (symbolsForThisBatch.length > 0) {
    batchMessage = `Batch ${batchNumber} (size ${BATCH_SIZE}) processed. Symbols attempted: ${symbolsForThisBatch.length}. Success: ${successCount}, Profile Failures: ${profileFailedCount}, Other Failures: ${otherFailedCount}.`;
  } else {
    batchMessage =
      batchNumber === 1 && totalSymbolsAvailable === 0
        ? "No symbols found in the system to process."
        : `Batch ${batchNumber} (size ${BATCH_SIZE}): No symbols in this batch range. Total available: ${totalSymbolsAvailable}.`;
  }

  console.log(
    `[API FetchData ALL] Batch ${batchNumber} finished in ${durationMs}ms. ${batchMessage} Earnings Calendar: ${earningsCalendarStatus}`
  );

  return NextResponse.json(
    {
      message: batchMessage,
      batch: batchNumber,
      batchSize: BATCH_SIZE,
      symbolsAttemptedInBatch: symbolsForThisBatch.length,
      symbolsProcessedInBatch: symbolProcessingResults.length, // Count of results returned
      totalSymbolsAvailable,
      nextBatch,
      durationMs,
      earningsCalendarStatus,
      details: symbolProcessingResults, // Array of SymbolProcessingResult
    },
    { status: 200 }
  );
}
