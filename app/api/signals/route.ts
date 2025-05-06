/* ──────────────────────────────────────────────────────────────────────
 * app/api/signals/route.ts
 * Handler for GET requests to process and fetch signals for all distinct symbols.
 * ---------------------------------------------------------------------*/
import { NextResponse } from "next/server";
import { ensureAndGetAllSignals } from "@/lib/services/signals"; // Adjust path if needed
import type { SignalRow } from "@/lib/services/signals"; // Adjust path if needed

/**
 * Handles GET requests to ensure signals are up-to-date for all distinct symbols
 * and returns an aggregated list of all signals.
 * This can be a long-running operation depending on the number of symbols
 * and the signal generation logic.
 * Example: /api/signals
 */
export async function GET(): Promise<
  NextResponse<SignalRow[] | { error: string; details?: string }>
> {
  const routePath = "/api/signals";
  console.log(
    `GET ${routePath} called. This will process all distinct symbols.`
  );

  try {
    // The ensureAndGetAllSignals service handles fetching distinct symbols,
    // then for each symbol, checks cache/generates signals, and collects all results.
    const allSignals: SignalRow[] = await ensureAndGetAllSignals();

    console.log(
      `[Route ${routePath}] Successfully processed all symbols. Total signals retrieved: ${allSignals.length}.`
    );
    return NextResponse.json(allSignals, { status: 200 });
  } catch (error: unknown) {
    let errorMessage =
      "An unknown error occurred while processing signals for all symbols.";
    let errorDetails: string | undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack; // Optionally include stack for server-side logging
    }

    console.error(
      `[Route ${routePath}] Critical error:`,
      errorMessage,
      errorDetails,
      error
    );
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
