// lib/services/signals/formatting.ts
import type { SignalRow as DbSignalRow } from "./types"; // Assuming SignalRow is in ./types.ts
import type {
  Json, // For Json type from supabase types if not already included via DbSignalRow
} from "@/lib/supabase/database.types";

// --- Specific Detail Types ---
// These describe the 'details' field for different signal_codes
interface SmaCrossDetails {
  close: number;
  sma50?: number;
  sma200?: number;
  prev_close: number;
  prev_sma50?: number;
  prev_sma200?: number;
}

interface PricePosRankDetails {
  close: number;
  sma50: number;
  sma200: number;
}

interface AnalystConsensusChangeDetails {
  previous_consensus: string;
  current_consensus: string;
  previous_rank: number;
  current_rank: number;
  previous_date: string;
}

interface AnalystConsensusRankDetails {
  consensus: string;
  rank: number;
  strong_buy: number;
  buy: number;
  hold: number;
  sell: number;
  strong_sell: number;
}

interface EarningsUpcomingDetails {
  earnings_date: string;
  days_until: number;
}

interface EarningsReportedDetails {
  reported_date: string;
  eps_actual?: number | null;
  eps_estimated?: number | null;
  revenue_actual?: number | null;
  revenue_estimated?: number | null;
}

interface RsiStateDetails {
  rsi: number;
  close: number;
  threshold: number;
}

interface RsiEventDetails {
  rsi: number;
  prev_rsi: number;
  close: number;
  threshold: number;
}

interface MacdSignalCrossDetails {
  macd: number;
  signal: number;
  prev_macd: number;
  prev_signal: number;
}

interface MacdZeroCrossDetails {
  macd: number;
  prev_macd: number;
}

interface EmaCrossDetails {
  // Similar to SmaCrossDetails
  close: number;
  ema50?: number;
  ema200?: number;
  prev_close: number;
  prev_ema50?: number;
  prev_ema200?: number;
}

// Union type for all possible signal details
type SignalDetails =
  | SmaCrossDetails
  | PricePosRankDetails
  | AnalystConsensusChangeDetails
  | AnalystConsensusRankDetails
  | EarningsUpcomingDetails
  | EarningsReportedDetails
  | RsiStateDetails
  | RsiEventDetails
  | MacdSignalCrossDetails
  | MacdZeroCrossDetails
  | EmaCrossDetails
  | { [key: string]: Json | undefined } // Fallback for other generic JSON structures
  | null; // details can be null

// Define the MarketSignal type expected by the frontend
// This should be kept in sync with the frontend's expectation (e.g., app/page.tsx)
export interface MarketSignal {
  title: string;
  description: string;
  timestamp: number; // Unix timestamp (milliseconds)
  symbol?: string;
  signalCode?: string;
}

/**
 * Transforms a database SignalRow into a frontend-friendly MarketSignal.
 * @param signal The SignalRow from the database.
 * @returns A MarketSignal object.
 */
export function transformDbSignalToMarketSignal(
  signal: DbSignalRow
): MarketSignal {
  let title = `${signal.symbol}: ${signal.signal_code}`;
  let description = `Signal observed for ${signal.symbol} on ${signal.signal_date}.`;

  const details = signal.details as SignalDetails;

  // SMA Signals
  if (
    signal.signal_code.startsWith("SMA") &&
    signal.signal_code.includes("CROSS")
  ) {
    const smaDetails = details as SmaCrossDetails;
    const smaPeriod = signal.signal_code.includes("SMA50") ? 50 : 200;
    const direction = signal.signal_code.endsWith("ABOVE") ? "above" : "below";
    title = `${signal.symbol} Price Crosses ${direction} ${smaPeriod}-Day SMA`;
    description = `${signal.symbol} closing price (${
      smaDetails?.close
    }) crossed ${direction} its ${smaPeriod}-day SMA (${
      smaDetails?.[`sma${smaPeriod}` as keyof SmaCrossDetails]
    }) on ${signal.signal_date}. Prev Close: ${
      smaDetails?.prev_close
    }, Prev SMA: ${
      smaDetails?.[`prev_sma${smaPeriod}` as keyof SmaCrossDetails]
    }.`;
  } else if (signal.signal_code.startsWith("PRICE_POS_RANK_")) {
    const rankDetails = details as PricePosRankDetails;
    const rank = signal.signal_code.split("_").pop();
    title = `${signal.symbol} Market Position Rank: ${rank}`;
    description = `${signal.symbol} has a price vs SMA rank of ${rank}. Close: ${rankDetails?.close}, SMA50: ${rankDetails?.sma50}, SMA200: ${rankDetails?.sma200}. Date: ${signal.signal_date}.`;
  }
  // Analyst Consensus
  else if (
    signal.signal_code === "ANALYST_CONSENSUS_UPGRADE" ||
    signal.signal_code === "ANALYST_CONSENSUS_DOWNGRADE"
  ) {
    const consensusChangeDetails = details as AnalystConsensusChangeDetails;
    const changeType = signal.signal_code.endsWith("UPGRADE")
      ? "Upgrade"
      : "Downgrade";
    title = `${signal.symbol} Analyst Consensus ${changeType}`;
    description = `Analyst consensus for ${
      signal.symbol
    } ${changeType.toLowerCase()}d from ${
      consensusChangeDetails?.previous_consensus
    } (Rank: ${consensusChangeDetails?.previous_rank}) to ${
      consensusChangeDetails?.current_consensus
    } (Rank: ${consensusChangeDetails?.current_rank}) on ${
      signal.signal_date
    }.`;
  } else if (signal.signal_code.startsWith("ANALYST_CONSENSUS_RANK_")) {
    const consensusRankDetails = details as AnalystConsensusRankDetails;
    const rank = signal.signal_code.split("_").pop();
    title = `${signal.symbol} Analyst Consensus: ${consensusRankDetails?.consensus} (Rank ${rank})`;
    description = `Current analyst consensus for ${signal.symbol} is ${consensusRankDetails?.consensus} (Rank ${rank}). Strong Buy: ${consensusRankDetails?.strong_buy}, Buy: ${consensusRankDetails?.buy}, Hold: ${consensusRankDetails?.hold}, Sell: ${consensusRankDetails?.sell}, Strong Sell: ${consensusRankDetails?.strong_sell}. Date: ${signal.signal_date}.`;
  }
  // Earnings
  else if (signal.signal_code === "EARNINGS_UPCOMING") {
    const upcomingDetails = details as EarningsUpcomingDetails;
    title = `${signal.symbol} Upcoming Earnings: ${upcomingDetails?.earnings_date}`;
    description = `${signal.symbol} reports earnings on ${upcomingDetails?.earnings_date} (approx. ${upcomingDetails?.days_until} days). Signal generated on ${signal.signal_date}.`;
  } else if (
    signal.signal_code.includes("EARNINGS_BEAT_") ||
    signal.signal_code.includes("EARNINGS_MISS_") ||
    signal.signal_code.includes("EARNINGS_MEET_") ||
    signal.signal_code.includes("EARNINGS_REPORTED_")
  ) {
    const reportedDetails = details as EarningsReportedDetails;
    const type = signal.signal_code.includes("EPS") ? "EPS" : "Revenue";
    let outcome = "reported";
    const actualKey =
      `${type.toLowerCase()}_actual` as keyof EarningsReportedDetails;
    const estimatedKey =
      `${type.toLowerCase()}_estimated` as keyof EarningsReportedDetails;

    if (signal.signal_code.includes("BEAT"))
      outcome = `beat estimates (${type}: ${reportedDetails?.[actualKey]} vs est. ${reportedDetails?.[estimatedKey]})`;
    else if (signal.signal_code.includes("MISS"))
      outcome = `missed estimates (${type}: ${reportedDetails?.[actualKey]} vs est. ${reportedDetails?.[estimatedKey]})`;
    else if (signal.signal_code.includes("MEET"))
      outcome = `met estimates (${type}: ${reportedDetails?.[actualKey]} vs est. ${reportedDetails?.[estimatedKey]})`;
    else if (signal.signal_code.includes("REPORTED"))
      outcome = `reported ${type} of ${reportedDetails?.[actualKey]}`;

    title = `${signal.symbol} Earnings: ${type} ${outcome.split(" ")[0]}`;
    description = `${signal.symbol} ${outcome} for earnings reported on ${reportedDetails?.reported_date}. (Signal on ${signal.signal_date})`;
  }
  // RSI
  else if (signal.signal_code.startsWith("RSI_")) {
    if (
      signal.signal_code === "RSI_OVERBOUGHT" ||
      signal.signal_code === "RSI_OVERSOLD"
    ) {
      const rsiState = details as RsiStateDetails;
      const condition = signal.signal_code.split("_")[1].toLowerCase();
      title = `${signal.symbol} RSI ${condition}`;
      description = `${signal.symbol} RSI at ${rsiState?.rsi?.toFixed(
        2
      )} indicates ${condition} conditions (Threshold: ${
        rsiState?.threshold
      }). Date: ${signal.signal_date}.`;
    } else if (
      signal.signal_code.includes("ENTERED_") ||
      signal.signal_code.includes("EXITED_")
    ) {
      const rsiEvent = details as RsiEventDetails;
      const action = signal.signal_code.includes("ENTERED")
        ? "Entered"
        : "Exited";
      const zone = signal.signal_code.includes("OVERBOUGHT")
        ? "Overbought"
        : "Oversold";
      title = `${signal.symbol} RSI ${action} ${zone}`;
      description = `${signal.symbol} RSI (${rsiEvent?.rsi?.toFixed(
        2
      )}) ${action.toLowerCase()} ${zone} zone (Threshold: ${
        rsiEvent?.threshold
      }). Prev RSI: ${rsiEvent?.prev_rsi?.toFixed(2)}. Date: ${
        signal.signal_date
      }.`;
    }
  }
  // MACD
  else if (signal.signal_code.startsWith("MACD_")) {
    // Check for specific MACD signal codes first
    if (
      signal.signal_code === "MACD_CROSS_ABOVE" ||
      signal.signal_code === "MACD_CROSS_BELOW"
    ) {
      // These are MACD line vs Signal line crosses
      const macdCross = details as MacdSignalCrossDetails;
      const direction = signal.signal_code.endsWith("ABOVE")
        ? "Bullish Crossover"
        : "Bearish Crossover";
      title = `${signal.symbol} MACD ${direction}`;
      description = `MACD (${macdCross?.macd?.toFixed(2)}) crossed ${
        direction.includes("Bullish") ? "above" : "below"
      } Signal Line (${macdCross?.signal?.toFixed(2)}) for ${
        signal.symbol
      }. Prev MACD: ${macdCross?.prev_macd?.toFixed(
        2
      )}, Prev Signal: ${macdCross?.prev_signal?.toFixed(2)}. Date: ${
        signal.signal_date
      }.`;
    } else if (
      signal.signal_code === "MACD_ZERO_CROSS_ABOVE" ||
      signal.signal_code === "MACD_ZERO_CROSS_BELOW"
    ) {
      // MACD line vs Zero line crosses
      const macdZero = details as MacdZeroCrossDetails;
      const direction = signal.signal_code.endsWith("ABOVE")
        ? "Above Zero"
        : "Below Zero";
      title = `${signal.symbol} MACD Crosses ${direction}`;
      description = `MACD (${macdZero?.macd?.toFixed(
        2
      )}) crossed ${direction.toLowerCase()} for ${
        signal.symbol
      }. Prev MACD: ${macdZero?.prev_macd?.toFixed(2)}. Date: ${
        signal.signal_date
      }.`;
    }
    // Add more specific MACD signal codes if they exist, e.g., MACD_SIGNAL_CROSS_ABOVE
    // The original code had a generic .includes("SIGNAL_CROSS") which might be too broad
    // if you have other signal_codes that could match.
  }
  // EMA
  else if (
    signal.signal_code.startsWith("EMA") &&
    signal.signal_code.includes("CROSS")
  ) {
    const emaDetails = details as EmaCrossDetails;
    const emaPeriod = signal.signal_code.includes("EMA50") ? 50 : 200;
    const direction = signal.signal_code.endsWith("ABOVE") ? "above" : "below";
    title = `${signal.symbol} Price Crosses ${direction} ${emaPeriod}-Day EMA`;
    description = `${signal.symbol} closing price (${
      emaDetails?.close
    }) crossed ${direction} its ${emaPeriod}-day EMA (${
      emaDetails?.[`ema${emaPeriod}` as keyof EmaCrossDetails]
    }) on ${signal.signal_date}. Prev Close: ${
      emaDetails?.prev_close
    }, Prev EMA: ${
      emaDetails?.[`prev_ema${emaPeriod}` as keyof EmaCrossDetails]
    }.`;
  } else {
    if (
      details &&
      typeof details === "object" &&
      Object.keys(details).length > 0
    ) {
      description = `Details: ${JSON.stringify(details)}. Observed on ${
        signal.signal_date
      }. Category: ${signal.signal_category}, Type: ${signal.signal_type}.`;
    } else {
      description = `Signal observed for ${signal.symbol} on ${signal.signal_date}. Category: ${signal.signal_category}, Type: ${signal.signal_type}. No additional details provided.`;
    }
  }

  return {
    title,
    description,
    timestamp: new Date(signal.created_at).getTime(),
    symbol: signal.symbol,
    signalCode: signal.signal_code,
  };
}
