// app/api/signal/earnings/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import type { Database, Json } from "@/lib/supabase/database.types";

// --- Types ---
type EarningsCalendarRow =
  Database["public"]["Tables"]["earnings_calendar"]["Row"];
// Define SignalInsert based on the final table structure
type SignalInsert = Omit<
  Database["public"]["Tables"]["signals"]["Insert"],
  "signal_category" | "signal_type"
> & {
  signal_category: "fundamental";
  signal_type: "event";
};
type ProcessingError = {
  symbol: string;
  error: string;
  earnings_date?: string | null;
};

// --- Configuration ---
// TODO: Use a shared symbol list
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
  "GME",
];
const LOOKBACK_DAYS = 90; // How far back to fetch earnings data
const UPCOMING_EARNINGS_CODE = "EARNINGS_UPCOMING";
// ---

// --- Main Route Handler ---
export async function GET(request: NextRequest): Promise<NextResponse> {
  // --- Security Check ---
  const authToken = (request.headers.get("authorization") || "")
    .split("Bearer ")
    .at(1);
  if (process.env.CRON_SECRET && authToken !== process.env.CRON_SECRET) {
    console.warn("[Earnings Signal] Unauthorized attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ---

  console.log(`[Earnings Signal] Starting earnings signal generation.`);

  const supabase = getSupabaseServerClient();
  // Use a Map to ensure uniqueness of generated signals *within this run*
  const uniqueSignalsMap = new Map<string, SignalInsert>();
  const errorsProcessing: ProcessingError[] = [];
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  try {
    // 1. Define Date Range (Look back N days from today)
    const lookbackDate = new Date(today);
    lookbackDate.setDate(today.getDate() - LOOKBACK_DAYS);
    const lookbackDateStr = lookbackDate.toISOString().split("T")[0];

    // 2. Fetch relevant earnings calendar data within the lookback window
    // We fetch all records from lookback date onwards to catch any future dates already in the DB
    console.log(
      `[Earnings Signal] Fetching calendar data from ${lookbackDateStr} onwards`
    );
    const { data: calendarData, error: calendarError } = await supabase
      .from("earnings_calendar")
      // *** Select revenue fields ***
      .select(
        "symbol, date, eps_actual, eps_estimated, revenue_actual, revenue_estimated"
      )
      .in("symbol", ALL_SYMBOLS_TO_PROCESS)
      .gte("date", lookbackDateStr); // Fetch all from lookback date

    if (calendarError) {
      throw new Error(
        `Failed to fetch earnings calendar data: ${calendarError.message}`
      );
    }
    if (!calendarData || calendarData.length === 0) {
      console.log(
        "[Earnings Signal] No relevant earnings calendar data found in the specified range."
      );
      return NextResponse.json({
        message: "No relevant earnings calendar data found.",
      });
    }

    // 3. Process fetched calendar data and stage signals for insertion
    console.log(
      `[Earnings Signal] Processing ${calendarData.length} calendar entries.`
    );
    for (const earning of calendarData) {
      try {
        // Define the expected shape including revenue
        const typedEarning = earning as Pick<
          EarningsCalendarRow,
          | "symbol"
          | "date"
          | "eps_actual"
          | "eps_estimated"
          | "revenue_actual"
          | "revenue_estimated"
        >;
        if (!typedEarning.symbol || !typedEarning.date) continue;

        const {
          symbol,
          date: earningsDate,
          eps_actual,
          eps_estimated,
          revenue_actual, // Include revenue
          revenue_estimated,
        } = typedEarning;
        // Determine if reported based on either actual being present
        const isReported = eps_actual !== null || revenue_actual !== null;
        // Determine if upcoming based on date and *not* being reported
        const isConsideredUpcoming = !isReported && earningsDate >= todayStr;

        // Use a Map to stage signals for the current earning record
        const signalsForThisEarning = new Map<string, SignalInsert>();
        // Signal date is always today
        const signalDateForDb = todayStr;

        // --- Process Reported Earnings ---
        if (isReported) {
          let epsSignalCode: string | null = null;
          let revSignalCode: string | null = null;

          // Determine EPS Signal Code
          if (eps_actual !== null) {
            if (eps_estimated !== null) {
              if (eps_actual > eps_estimated)
                epsSignalCode = "EARNINGS_BEAT_EPS";
              else if (eps_actual < eps_estimated)
                epsSignalCode = "EARNINGS_MISS_EPS";
              else epsSignalCode = "EARNINGS_MEET_EPS";
            } else {
              epsSignalCode = "EARNINGS_REPORTED_EPS"; // Actual reported, no estimate
            }
          }

          // Determine Revenue Signal Code
          if (revenue_actual !== null) {
            if (revenue_estimated !== null) {
              if (revenue_actual > revenue_estimated)
                revSignalCode = "EARNINGS_BEAT_REVENUE";
              else if (revenue_actual < revenue_estimated)
                revSignalCode = "EARNINGS_MISS_REVENUE";
              else revSignalCode = "EARNINGS_MEET_REVENUE";
            } else {
              revSignalCode = "EARNINGS_REPORTED_REVENUE"; // Actual reported, no estimate
            }
          }

          // Stage EPS Signal if applicable
          if (epsSignalCode) {
            const signalKey = `${symbol}-${signalDateForDb}-${epsSignalCode}`;
            signalsForThisEarning.set(signalKey, {
              signal_date: signalDateForDb,
              symbol: symbol,
              signal_category: "fundamental",
              signal_type: "event",
              signal_code: epsSignalCode,
              details: {
                reported_date: earningsDate,
                eps_actual,
                eps_estimated,
              },
            });
          }

          // Stage Revenue Signal if applicable
          if (revSignalCode) {
            const signalKey = `${symbol}-${signalDateForDb}-${revSignalCode}`;
            signalsForThisEarning.set(signalKey, {
              signal_date: signalDateForDb,
              symbol: symbol,
              signal_category: "fundamental",
              signal_type: "event",
              signal_code: revSignalCode,
              details: {
                reported_date: earningsDate,
                revenue_actual,
                revenue_estimated,
              },
            });
          }
        }
        // --- Process Upcoming Earnings ---
        else if (isConsideredUpcoming) {
          const signalCode = UPCOMING_EARNINGS_CODE; // Use constant
          const signalDetails: Json = {
            earnings_date: earningsDate,
            days_until: Math.round(
              (new Date(earningsDate + "T00:00:00Z").getTime() -
                today.getTime()) /
                (1000 * 60 * 60 * 24)
            ),
          };
          // Add upcoming signal to the map for this earning event
          const signalKey = `${symbol}-${signalDateForDb}-${signalCode}`;
          signalsForThisEarning.set(signalKey, {
            signal_date: signalDateForDb, // Signal generated today
            symbol: symbol,
            signal_category: "fundamental",
            signal_type: "event",
            signal_code: signalCode,
            details: signalDetails,
          });
        }

        // Add potentially generated signals from this earning record to the main map
        signalsForThisEarning.forEach((signalData, signalKey) => {
          uniqueSignalsMap.set(signalKey, signalData);
        });
      } catch (innerError: unknown) {
        let errorMessage = "Unknown processing error for single earning record";
        if (innerError instanceof Error) errorMessage = innerError.message;
        console.error(
          `[Earnings Signal] Error processing earning record ${JSON.stringify(
            earning
          )}:`,
          innerError
        );
        errorsProcessing.push({
          symbol: earning.symbol ?? "Unknown",
          error: errorMessage,
          earnings_date: earning.date,
        });
      }
    } // End processing loop

    // Convert Map values to array for insertion
    const signalsToInsert = Array.from(uniqueSignalsMap.values());

    // 4. Bulk Upsert UNIQUE signals - let the DB handle conflicts with existing rows
    if (signalsToInsert.length > 0) {
      console.log(
        `[Earnings Signal] Attempting to upsert ${signalsToInsert.length} unique potential earnings signals...`
      );
      const typedSignalsToInsert =
        signalsToInsert as Database["public"]["Tables"]["signals"]["Insert"][];
      const { error: signalInsertError } = await supabase
        .from("signals")
        .upsert(typedSignalsToInsert, {
          onConflict: "symbol, signal_date, signal_code",
          ignoreDuplicates: true, // Explicitly ignore duplicates
        });

      if (signalInsertError) {
        console.error(
          "[Earnings Signal] Error upserting signals:",
          signalInsertError
        );
        errorsProcessing.push({
          symbol: "BULK_EARNINGS_SIGNAL_INSERT",
          error: signalInsertError.message,
        });
      }
    }
  } catch (error: unknown) {
    let errorMessage = "Unknown processing error in main block";
    if (error instanceof Error) errorMessage = error.message;
    console.error(`[Earnings Signal] Error during processing:`, error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }

  // --- Return Response ---
  console.log(
    `[Earnings Signal] Finished Run. Signals Staged for Upsert: ${uniqueSignalsMap.size}. Errors during processing: ${errorsProcessing.length}`
  );
  return NextResponse.json({
    message: `Processed earnings calendar. Signals staged for upsert: ${uniqueSignalsMap.size}. Processing errors: ${errorsProcessing.length}`,
    errors: errorsProcessing,
  });
}
