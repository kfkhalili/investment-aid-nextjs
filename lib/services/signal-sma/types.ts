// lib/services/signal-sma/types.ts
import type { Database } from "@/lib/supabase/database.types";

export type HistoricalPrice =
  Database["public"]["Tables"]["historical_prices"]["Row"];
export type PriceDataPoint = Pick<HistoricalPrice, "date" | "close">;

export type SignalInsert = Omit<
  Database["public"]["Tables"]["signals"]["Insert"],
  "signal_category" | "signal_type"
> & {
  signal_category: "technical";
  signal_type: "event" | "state";
};

export type MovingAverageValues = { [period: number]: number | undefined };

// New type for processing errors
export type ProcessingError = {
  symbol: string;
  error: string;
};
