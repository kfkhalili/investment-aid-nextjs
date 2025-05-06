/* ──────────────────────────────────────────────────────────────────────
 * app/api/signals/[symbol]/route.ts
 * Handler for GET requests to fetch signals for a specific symbol.
 * Applies additional filtering based on query parameters.
 * ---------------------------------------------------------------------*/
import { NextResponse } from "next/server";
import { getSignalsForSymbol } from "@/lib/services/signals"; // Adjust path if needed
import type { SignalRow, SignalQueryOptions } from "@/lib/services/signals"; // Adjust path if needed

/**
 * Handles GET requests to fetch signals for a specific symbol.
 * Supports filtering via query parameters: signalDate, signalCode, signalCategory, signalType.
 * Example: /api/signals/AAPL?signalDate=2025-05-01&signalCode=SMA50_CROSS
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
): Promise<NextResponse<SignalRow[] | { error: string }>> {
  // Access symbol directly from params, uppercase it
  const { symbol: symbolParam } = await params;
  const symbol = symbolParam?.toUpperCase();
  const { searchParams } = new URL(request.url);

  const routePath = `/api/signals/${symbol}`;
  console.log(`${routePath} called with query: ${searchParams.toString()}`);

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is missing or invalid." },
      { status: 400 }
    );
  }

  // Extract query parameters for filtering
  const queryOptions: Partial<SignalQueryOptions> = {
    symbol: symbol, // Symbol is from path, but good to have in options object
  };
  if (searchParams.has("signalDate"))
    queryOptions.signalDate = searchParams.get("signalDate") as string;
  if (searchParams.has("signalCode"))
    queryOptions.signalCode = searchParams.get("signalCode") as string;
  if (searchParams.has("signalCategory"))
    queryOptions.signalCategory = searchParams.get("signalCategory") as string;
  if (searchParams.has("signalType")) {
    const signalTypeParam = searchParams.get("signalType") as string;
    if (signalTypeParam === "event" || signalTypeParam === "state") {
      queryOptions.signalType = signalTypeParam;
    } else {
      return NextResponse.json(
        { error: "Invalid signalType. Must be 'event' or 'state'." },
        { status: 400 }
      );
    }
  }
  if (
    queryOptions.signalDate &&
    !/^\d{4}-\d{2}-\d{2}$/.test(queryOptions.signalDate)
  ) {
    return NextResponse.json(
      { error: "Invalid signalDate format. Please use YYYY-MM-DD." },
      { status: 400 }
    );
  }

  try {
    // The getSignalsForSymbol service handles cache checks and generation for the symbol.
    // It returns all signals for that symbol.
    let signals: SignalRow[] = await getSignalsForSymbol(symbol);

    // Apply additional filtering based on query parameters
    if (queryOptions.signalDate) {
      signals = signals.filter(
        (signal) => signal.signal_date === queryOptions.signalDate
      );
    }
    if (queryOptions.signalCode) {
      signals = signals.filter(
        (signal) =>
          signal.signal_code?.toLowerCase() ===
          queryOptions.signalCode?.toLowerCase()
      );
    }
    if (queryOptions.signalCategory) {
      signals = signals.filter(
        (signal) =>
          signal.signal_category?.toLowerCase() ===
          queryOptions.signalCategory?.toLowerCase()
      );
    }
    if (queryOptions.signalType) {
      signals = signals.filter(
        (signal) => signal.signal_type === queryOptions.signalType
      );
    }

    console.log(
      `[Route ${routePath}] Successfully retrieved and filtered ${signals.length} signals for ${symbol}.`
    );
    return NextResponse.json(signals, { status: 200 });
  } catch (error: unknown) {
    let errorMessage = `An unknown error occurred while fetching signals for ${symbol}.`;
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error(
      `[Route ${routePath}] Error for ${symbol}:`,
      errorMessage,
      error
    );
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
