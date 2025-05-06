// app/api/signal-rsi/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import {
  processRsiSignalsForSymbol,
  type RsiProcessingResult,
} from "@/lib/services/signal-rsi/service";

export async function GET(): Promise<NextResponse> {
  console.log(
    "[API RsiSignal ALL] Received request to process all symbols for RSI signals."
  );
  const supabase = getSupabaseServerClient();

  // 1. Fetch symbols from the profile_symbols view
  let symbolsToProcess: string[] = [];
  try {
    const { data: symbolsData, error: symbolsError } = await supabase
      .from("profile_symbols")
      .select("symbol");

    if (symbolsError) {
      console.error(
        "[API RsiSignal ALL] Error fetching symbols from profile_symbols:",
        symbolsError.message
      );
      return NextResponse.json(
        {
          message: "Error fetching symbol list from profile_symbols.",
          error: symbolsError.message,
        },
        { status: 500 }
      );
    }

    if (!symbolsData || symbolsData.length === 0) {
      console.log(
        "[API RsiSignal ALL] No symbols found in profile_symbols view."
      );
      return NextResponse.json(
        { message: "No symbols found in profile_symbols view to process." },
        { status: 200 }
      );
    }

    symbolsToProcess = symbolsData
      .map((s: { symbol: string | null }) => s.symbol)
      .filter((s): s is string => typeof s === "string" && s.trim() !== "");

    if (symbolsToProcess.length === 0) {
      console.log(
        "[API RsiSignal ALL] No valid symbols to process after filtering."
      );
      return NextResponse.json(
        { message: "No valid symbols found to process." },
        { status: 200 }
      );
    }
    console.log(
      `[API RsiSignal ALL] Found ${symbolsToProcess.length} symbols to process.`
    );
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error(
      "[API RsiSignal ALL] Unexpected error fetching symbols:",
      errorMessage
    );
    return NextResponse.json(
      {
        message: "An unexpected error occurred while fetching symbols.",
        error: errorMessage,
      },
      { status: 500 }
    );
  }

  // 2. Process each symbol
  const allResults: RsiProcessingResult[] = [];
  for (const symbol of symbolsToProcess) {
    const result = await processRsiSignalsForSymbol(symbol, supabase);
    allResults.push(result);
  }

  // 3. Aggregate results and respond
  let totalSignalsGenerated: number = 0;
  let successfullyProcessedCount: number = 0;
  let skippedFreshCount: number = 0;
  let noDataForGenerationCount: number = 0;
  let errorCount: number = 0;

  for (const res of allResults) {
    totalSignalsGenerated += res.signalsGenerated;
    switch (res.status) {
      case "processed":
        successfullyProcessedCount++;
        break;
      case "skipped_fresh":
        skippedFreshCount++;
        break;
      case "no_data_for_generation":
        noDataForGenerationCount++;
        break;
      case "error":
        errorCount++;
        break;
    }
  }

  const responseSummary = {
    message: `RSI signals processing complete for all ${symbolsToProcess.length} attempted symbols.`,
    totalSymbolsAttempted: symbolsToProcess.length,
    successfullyProcessedCount,
    skippedFreshCount,
    noDataForGenerationCount,
    errorCount,
    totalSignalsGenerated,
    results: allResults,
  };

  console.log(
    `[API RsiSignal ALL] Processing finished. Generated ${totalSignalsGenerated} signals. Errors: ${errorCount}.`
  );

  return NextResponse.json(responseSummary, { status: 200 });
}
