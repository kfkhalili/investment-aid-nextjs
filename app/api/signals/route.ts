/* ──────────────────────────────────────────────────────────────────────
 * app/api/signals/route.ts
 * Handler for GET requests to process and fetch signals for all distinct symbols,
 * transforming them for frontend display using a dedicated formatting service.
 * ---------------------------------------------------------------------*/
import { NextResponse } from "next/server";
import { ensureAndGetAllSignals } from "@/lib/services/signals"; // Your existing service to get raw signals
import type { SignalRow as DbSignalRow } from "@/lib/services/signals"; // Type from your signals service
import {
  transformDbSignalToMarketSignal,
  type MarketSignal, // Import the transformation function and MarketSignal type
} from "@/lib/services/signals/formatting"; // Path to the new formatting service

/**
 * Handles GET requests. It ensures signals are up-to-date for all distinct symbols,
 * then fetches and transforms these signals for frontend display.
 */
export async function GET(): Promise<
  NextResponse<MarketSignal[] | { error: string; details?: string }>
> {
  const routePath = "/api/signals";
  console.log(
    `GET ${routePath} called. This will process all distinct symbols and transform data.`
  );

  try {
    // Step 1: Ensure all signals are up-to-date and get the raw data.
    // ensureAndGetAllSignals is expected to call the orchestrator getSignalsBySymbol for each symbol.
    const rawSignals: DbSignalRow[] = await ensureAndGetAllSignals();

    if (!rawSignals) {
      console.warn(
        `[Route ${routePath}] ensureAndGetAllSignals returned null or undefined.`
      );
      // Return empty array if ensureAndGetAllSignals can return null/undefined
      // If it always returns an array (even empty), this check might not be strictly needed
      return NextResponse.json([], { status: 200 });
    }

    // Step 2: Transform the raw signals into the MarketSignal format for the frontend.
    const marketSignals: MarketSignal[] = rawSignals.map(
      transformDbSignalToMarketSignal
    );

    console.log(
      `[Route ${routePath}] Successfully processed and transformed signals. Total market signals: ${marketSignals.length}.`
    );
    return NextResponse.json(marketSignals, { status: 200 });
  } catch (error: unknown) {
    let errorMessage =
      "An unknown error occurred while processing and fetching signals.";
    let errorDetails: string | undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      // Storing full stack in JSON response might be too verbose for client,
      // but good for server logs.
      errorDetails =
        process.env.NODE_ENV === "development" ? error.stack : undefined;
    }

    console.error(
      `[Route ${routePath}] Critical error:`,
      errorMessage,
      // Log the full error object on the server for better debugging
      error
    );
    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails || "Check server logs for more information.",
      },
      { status: 500 }
    );
  }
}
