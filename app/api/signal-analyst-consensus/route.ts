// app/api/signal-analyst-consensus/route.ts

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import type { Database } from "@/lib/supabase/database.types";

// --- Types ---
type GradesConsensusRow =
  Database["public"]["Tables"]["grades_consensus"]["Row"];
// Define SignalInsert based on the final table structure with both columns
type SignalInsert = Omit<
  Database["public"]["Tables"]["signals"]["Insert"],
  "signal_category" | "signal_type"
> & {
  signal_category: "sentiment"; // *** CHANGED: Classify analyst signals as 'sentiment' ***
  signal_type: "event" | "state";
};

// --- Configuration ---
// TODO: Update symbol list
const ALL_SYMBOLS_TO_PROCESS: string[] = [
  "MSFT",
  "AAPL",
  "NVDA",
  "AMZN",
  "GOOGL",
  "META",
  "BRK-B",
  "AVGO",
  "TSLA",
  "LLY",
  "WMT",
  "JPM",
  "V",
  "MA",
  "NFLX",
  "XOM",
  "COST",
  "ORCL",
  "PG",
  "JNJ",
  "UNH",
  "HD",
  "ABBV",
  "KO",
  "BAC",
  "TSM",
  "TMUS",
  "PM",
  "CRM",
  "CVX",
  "WFC",
  "CSCO",
  "MCD",
  "ABT",
  "IBM",
  "GE",
  "MRK",
  "T",
  "NOW",
  "AXP",
  "PEP",
  "VZ",
  "MS",
  "ISRG",
  "GS",
  "INTU",
  "UBER",
  "RTX",
  "BKNG",
  "PGR",
];
// ---

// --- Helper: Map consensus string to rank ---
const consensusRankMap: { [key: string]: number } = {
  "Strong Buy": 5,
  Buy: 4,
  Hold: 3,
  Sell: 2,
  "Strong Sell": 1,
};
function getConsensusRank(consensus: string | null | undefined): number | null {
  if (!consensus) return null;
  return consensusRankMap[consensus] ?? null;
}

// --- Main Route Handler ---
export async function GET(): Promise<NextResponse> {
  console.log(
    `[Analyst Signal Top2] Starting consensus signal generation for ${ALL_SYMBOLS_TO_PROCESS.length} symbols.`
  );

  const supabase = getSupabaseServerClient();
  const signalsToInsert: SignalInsert[] = [];
  const errorsProcessing: { symbol: string; error: string }[] = [];

  // Process symbols
  for (const symbol of ALL_SYMBOLS_TO_PROCESS) {
    try {
      // 1. Fetch Top 2 most recent consensus records
      const { data: consensusHistory, error: dbError } = await supabase
        .from("grades_consensus")
        .select("*")
        .eq("symbol", symbol)
        .order("date", { ascending: false })
        .limit(2);

      if (dbError) {
        throw new Error(
          `Supabase fetch error for ${symbol}: ${dbError.message}`
        );
      }

      // Need at least one record for the state signal
      if (!consensusHistory || consensusHistory.length < 1) {
        console.log(
          `[Analyst Signal Top2] Skipping ${symbol}: No consensus records found.`
        );
        continue;
      }

      const currentData = consensusHistory[0] as GradesConsensusRow;
      const previousData =
        consensusHistory.length >= 2
          ? (consensusHistory[1] as GradesConsensusRow)
          : null;

      // --- Generate Signals ---
      const signalDate = currentData.date;

      // Signal 1: Current Consensus State (Rank)
      const currentRank = getConsensusRank(currentData.consensus);
      if (currentRank !== null) {
        signalsToInsert.push({
          signal_date: signalDate,
          symbol: symbol,
          signal_category: "sentiment", // *** CHANGED ***
          signal_type: "state",
          signal_code: `ANALYST_CONSENSUS_RANK_${currentRank}`,
          details: {
            consensus: currentData.consensus,
            rank: currentRank,
            strong_buy: currentData.strong_buy,
            buy: currentData.buy,
            hold: currentData.hold,
            sell: currentData.sell,
            strong_sell: currentData.strong_sell,
          },
        });
      }

      // Signal 2: Change Event (Upgrade/Downgrade) - Only if previous data exists
      if (
        previousData &&
        currentData.consensus &&
        previousData.consensus &&
        currentData.consensus !== previousData.consensus
      ) {
        const previousRank = getConsensusRank(previousData.consensus);

        if (
          currentRank !== null &&
          previousRank !== null &&
          currentRank !== previousRank
        ) {
          const signalCode =
            currentRank > previousRank
              ? "ANALYST_CONSENSUS_UPGRADE"
              : "ANALYST_CONSENSUS_DOWNGRADE";

          signalsToInsert.push({
            signal_date: signalDate,
            symbol: symbol,
            signal_category: "sentiment", // *** CHANGED ***
            signal_type: "event",
            signal_code: signalCode,
            details: {
              previous_consensus: previousData.consensus,
              current_consensus: currentData.consensus,
              previous_rank: previousRank,
              current_rank: currentRank,
              previous_date: previousData.date,
            },
          });
          console.log(
            `[Analyst Signal Top2] Staged ${signalCode} for ${symbol} (${previousData.consensus} -> ${currentData.consensus})`
          );
        }
      }
    } catch (error: unknown) {
      let errorMessage = "Unknown processing error";
      if (error instanceof Error) errorMessage = error.message;
      console.error(
        `[Analyst Signal Top2] Error processing symbol ${symbol}:`,
        error
      );
      errorsProcessing.push({ symbol, error: errorMessage });
    }
  } // End symbol loop

  // Bulk Insert Signals
  if (signalsToInsert.length > 0) {
    console.log(
      `[Analyst Signal Top2] Inserting ${signalsToInsert.length} signals...`
    );
    // Use explicit type assertion for upsert data
    const typedSignalsToInsert =
      signalsToInsert as Database["public"]["Tables"]["signals"]["Insert"][];
    const { error: signalInsertError } = await supabase
      .from("signals")
      .upsert(typedSignalsToInsert, {
        onConflict: "symbol, signal_date, signal_code",
      });

    if (signalInsertError) {
      console.error(
        "[Analyst Signal Top2] Error inserting signals:",
        signalInsertError
      );
      errorsProcessing.push({
        symbol: "BULK_SIGNAL_INSERT",
        error: signalInsertError.message,
      });
    }
  }

  // --- Return Response ---
  console.log(
    `[Analyst Signal Top2] Finished Run. Signals Generated: ${signalsToInsert.length}. Errors: ${errorsProcessing.length}`
  );
  return NextResponse.json({
    message: `Processed symbols: ${ALL_SYMBOLS_TO_PROCESS.length}. Signals generated: ${signalsToInsert.length}. Errors: ${errorsProcessing.length}`,
    errors: errorsProcessing,
  });
}
