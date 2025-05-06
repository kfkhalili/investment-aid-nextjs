// lib/services/signal-sma/fetch.ts
// This module provides services for generating SMA signals.

import { getSupabaseServerClient } from "@/lib/supabase/serverClient"; // Assuming this path is correct for server-side/service context
import type {
  PriceDataPoint,
  SignalInsert,
  MovingAverageValues,
} from "./types";

// --- Configuration and Constants ---
const SMAs_REQUIRED: number[] = [50, 200];
const LONGEST_MA_PERIOD: number = Math.max(...SMAs_REQUIRED);
// Need 1 extra point for T-1 calculation for moving averages
const REQUIRED_DATA_POINTS: number = LONGEST_MA_PERIOD + 1;
// ---

// --- Helper Functions (internal to this service) ---
function calculateSMAs(
  prices: PriceDataPoint[],
  periods: number[]
): MovingAverageValues {
  const calculatedMAs: MovingAverageValues = {};
  if (!prices || prices.length === 0) {
    return calculatedMAs;
  }
  for (const period of periods) {
    if (prices.length >= period) {
      const pricesForPeriod = prices.slice(0, period);
      const sum = pricesForPeriod.reduce(
        (acc: number, day: PriceDataPoint) => acc + (day.close ?? 0),
        0
      );
      if (period > 0) {
        calculatedMAs[period] = parseFloat((sum / period).toFixed(2));
      }
    }
  }
  return calculatedMAs;
}

function getPriceVsSmaRank(
  close: number | null | undefined,
  sma50: number | null | undefined,
  sma200: number | null | undefined
): number | null {
  if (close == null || sma50 == null || sma200 == null) {
    return null;
  }
  const priceAbove50: boolean = close > sma50;
  const priceAbove200: boolean = close > sma200;
  const sma50Above200: boolean = sma50 > sma200;

  if (priceAbove50 && sma50Above200) return 5;
  if (!priceAbove50 && !sma50Above200) return 1;
  if (
    (priceAbove50 && priceAbove200 && !sma50Above200) ||
    (!priceAbove50 && priceAbove200 && sma50Above200)
  )
    return 4;
  if (
    (priceAbove50 && !priceAbove200 && !sma50Above200) ||
    (!priceAbove50 && !priceAbove200 && sma50Above200)
  )
    return 2;
  if (
    (!priceAbove50 && priceAbove200 && !sma50Above200) ||
    (priceAbove50 && !priceAbove200 && sma50Above200)
  )
    return 3;

  console.warn(
    `[SMA Service] Unhandled rank condition: P=${close}, SMA50=${sma50}, SMA200=${sma200}`
  );
  return null;
}
// --- End Helper Functions ---

// --- Exported Service Functions ---

/**
 * Generates SMA signals for a single symbol, optionally for a specific target date.
 * @param symbol The stock symbol to process.
 * @param targetDate Optional. The specific date (YYYY-MM-DD) to generate signals for. If undefined, uses latest available data.
 * @returns A promise that resolves to an object containing generated signals and any error.
 */
export async function generateSmaSignals(
  symbol: string,
  targetDate?: string
): Promise<{ generatedSignals: SignalInsert[]; error: string | null }> {
  const supabase = getSupabaseServerClient();
  const signalsForSymbol: SignalInsert[] = [];

  try {
    let query = supabase
      .from("historical_prices")
      .select("date, close")
      .eq("symbol", symbol);

    if (targetDate) {
      query = query.lte("date", targetDate);
    }

    const { data: prices, error: dbError } = await query
      .order("date", { ascending: false })
      .limit(REQUIRED_DATA_POINTS);

    if (dbError) {
      throw new Error(`Supabase fetch error for ${symbol}: ${dbError.message}`);
    }

    if (!prices || prices.length === 0) {
      return {
        generatedSignals: [],
        error: `No historical price data found for ${symbol}${
          targetDate ? ` up to ${targetDate}` : ""
        }.`,
      };
    }

    const typedPrices = prices as PriceDataPoint[];

    if (targetDate) {
      if (typedPrices[0].date !== targetDate) {
        return {
          generatedSignals: [],
          error: `No data available for ${symbol} exactly on targetDate ${targetDate}. Latest available prior to or on target: ${typedPrices[0].date}.`,
        };
      }
    }

    if (typedPrices.length < 2) {
      return {
        generatedSignals: [],
        error: `Insufficient data (< 2 days) for ${symbol} to calculate signals for date ${typedPrices[0].date}. Found ${typedPrices.length} points.`,
      };
    }

    const dataT: PriceDataPoint = typedPrices[0];
    const dataTminus1: PriceDataPoint = typedPrices[1];
    const signalDateToUse: string = dataT.date;

    const closeT: number | null = dataT.close;
    const closeTminus1: number | null = dataTminus1.close;

    const smasT: MovingAverageValues = calculateSMAs(
      typedPrices,
      SMAs_REQUIRED
    );
    const smasTminus1: MovingAverageValues = calculateSMAs(
      typedPrices.slice(1),
      SMAs_REQUIRED
    );

    const rankT: number | null = getPriceVsSmaRank(
      closeT,
      smasT[50],
      smasT[200]
    );
    if (rankT !== null) {
      signalsForSymbol.push({
        signal_date: signalDateToUse,
        symbol: symbol,
        signal_category: "technical",
        signal_type: "state",
        signal_code: `PRICE_POS_RANK_${rankT}`,
        details: { close: closeT, sma50: smasT[50], sma200: smasT[200] },
      });
    }

    const sma50T: number | undefined = smasT[50];
    const sma50Tminus1: number | undefined = smasTminus1[50];
    if (
      closeT != null &&
      closeTminus1 != null &&
      sma50T != null &&
      sma50Tminus1 != null
    ) {
      let crossSignalCodeSMA50: string | null = null;
      if (closeT > sma50T && closeTminus1 < sma50Tminus1)
        crossSignalCodeSMA50 = "SMA50_CROSS_ABOVE";
      else if (closeT < sma50T && closeTminus1 > sma50Tminus1)
        crossSignalCodeSMA50 = "SMA50_CROSS_BELOW";
      if (crossSignalCodeSMA50) {
        signalsForSymbol.push({
          signal_date: signalDateToUse,
          symbol: symbol,
          signal_category: "technical",
          signal_type: "event",
          signal_code: crossSignalCodeSMA50,
          details: {
            close: closeT,
            sma50: sma50T,
            prev_close: closeTminus1,
            prev_sma50: sma50Tminus1,
          },
        });
      }
    }

    const sma200T: number | undefined = smasT[200];
    const sma200Tminus1: number | undefined = smasTminus1[200];
    if (
      closeT != null &&
      closeTminus1 != null &&
      sma200T != null &&
      sma200Tminus1 != null
    ) {
      let crossSignalCodeSMA200: string | null = null;
      if (closeT > sma200T && closeTminus1 < sma200Tminus1)
        crossSignalCodeSMA200 = "SMA200_CROSS_ABOVE";
      else if (closeT < sma200T && closeTminus1 > sma200Tminus1)
        crossSignalCodeSMA200 = "SMA200_CROSS_BELOW";
      if (crossSignalCodeSMA200) {
        signalsForSymbol.push({
          signal_date: signalDateToUse,
          symbol: symbol,
          signal_category: "technical",
          signal_type: "event",
          signal_code: crossSignalCodeSMA200,
          details: {
            close: closeT,
            sma200: sma200T,
            prev_close: closeTminus1,
            prev_sma200: sma200Tminus1,
          },
        });
      }
    }
    return { generatedSignals: signalsForSymbol, error: null };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : `Unknown processing error for symbol ${symbol}`;
    console.error(
      `[SMA Service] Error in generateSMASignals for ${symbol}${
        targetDate ? ` on ${targetDate}` : ""
      }:`,
      error
    );
    return { generatedSignals: [], error: errorMessage };
  }
}

/**
 * Generates SMA signals for all distinct symbols found in the 'profiles' table.
 * @param targetDate Optional. The specific date (YYYY-MM-DD) to generate signals for. If undefined, uses latest data.
 * @returns A promise that resolves to an object containing all generated signals and any processing errors.
 */
export async function generateAllSmaSignals(targetDate?: string): Promise<{
  allGeneratedSignals: SignalInsert[];
  errorsProcessing: { symbol: string; error: string }[];
}> {
  const supabase = getSupabaseServerClient();
  const allGeneratedSignals: SignalInsert[] = [];
  const errorsProcessing: { symbol: string; error: string }[] = [];

  const { data: profileSymbolsData, error: profilesError } = await supabase
    .from("profiles")
    .select("symbol");

  if (profilesError) {
    const errorMsg = `Failed to fetch symbols from profiles: ${profilesError.message}`;
    console.error("[SMA Service] generateAllSMASignals:", errorMsg);
    return {
      allGeneratedSignals: [],
      errorsProcessing: [{ symbol: "GLOBAL_SYMBOL_FETCH", error: errorMsg }],
    };
  }

  if (!profileSymbolsData) {
    const errorMsg =
      "Failed to retrieve symbols from profiles (no data returned).";
    console.warn("[SMA Service] generateAllSMASignals:", errorMsg);
    return {
      allGeneratedSignals: [],
      errorsProcessing: [{ symbol: "GLOBAL_SYMBOL_FETCH", error: errorMsg }],
    };
  }

  const symbolsToProcess: string[] = Array.from(
    new Set(
      profileSymbolsData
        .map((p: { symbol: string | null }) => p.symbol)
        .filter((s): s is string => typeof s === "string" && s.trim() !== "")
    )
  );

  if (symbolsToProcess.length === 0) {
    console.log(
      "[SMA Service] generateAllSMASignals: No valid symbols found in profiles table to process."
    );
    return { allGeneratedSignals: [], errorsProcessing: [] };
  }

  console.log(
    `[SMA Service] generateAllSMASignals: Starting processing for ${
      symbolsToProcess.length
    } symbols${targetDate ? ` for date ${targetDate}` : " (latest data)"}.`
  );

  for (const symbol of symbolsToProcess) {
    const result = await generateSmaSignals(symbol, targetDate);
    if (result.error) {
      errorsProcessing.push({ symbol, error: result.error });
    }
    if (result.generatedSignals.length > 0) {
      allGeneratedSignals.push(...result.generatedSignals);
    }
  }
  console.log(
    `[SMA Service] generateAllSMASignals: Finished processing. Generated ${allGeneratedSignals.length} signals. Encountered ${errorsProcessing.length} errors.`
  );
  return { allGeneratedSignals, errorsProcessing };
}
// --- End Exported Service Functions ---
