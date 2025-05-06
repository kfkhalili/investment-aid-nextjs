// app/api/signal-sma/[symbol]/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import type { Database } from "@/lib/supabase/database.types";
import { generateSmaSignals } from "@/lib/services/signal-sma/fetch"; // Assuming fetch.ts is in the parent sma directory
import type { ProcessingError } from "@/lib/services/signal-sma/types"; // Import the ProcessingError type from ../types.ts

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
): Promise<NextResponse> {
  const { symbol: symbolParam } = await params;
  const symbol = symbolParam?.toUpperCase();

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is missing." },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const dateParam: string | null = searchParams.get("date");

  // Validate date format if provided
  if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return NextResponse.json(
      { error: "Invalid date format. Please use YYYY-MM-DD." },
      { status: 400 }
    );
  }

  console.log(
    `[SMA SYMBOL] GET: Request received for symbol ${symbol} ${
      dateParam ? `for date ${dateParam}` : "for latest available data"
    }.`
  );

  // Call the service function
  const { generatedSignals, error: serviceProcessingError } =
    await generateSmaSignals(symbol, dateParam ?? undefined);

  // Prepare a list for processing errors, using the ProcessingError type
  const errorsList: ProcessingError[] = [];
  if (serviceProcessingError) {
    errorsList.push({ symbol, error: serviceProcessingError });
  }

  // Upsert signals if any were generated
  if (generatedSignals.length > 0) {
    console.log(
      `[SMA SYMBOL] GET: Attempting to upsert ${generatedSignals.length} signals for ${symbol}...`
    );
    const supabase = getSupabaseServerClient();
    const typedSignalsToInsert =
      generatedSignals as Database["public"]["Tables"]["signals"]["Insert"][];

    const { error: upsertError } = await supabase
      .from("signals")
      .upsert(typedSignalsToInsert, {
        onConflict: "symbol, signal_date, signal_code",
      });

    if (upsertError) {
      console.error(
        `[SMA SYMBOL] GET: Error upserting signals for ${symbol}:`,
        upsertError.message
      );
      return NextResponse.json(
        {
          message: `Signal generation for ${symbol} complete. FAILED to upsert some/all signals.`,
          symbol: symbol,
          signalsGeneratedCount: generatedSignals.length,
          processingErrors: errorsList.length > 0 ? errorsList : undefined,
          insertError: upsertError.message,
        },
        { status: 500 }
      );
    }
    console.log(
      `[SMA SYMBOL] GET: Successfully upserted ${generatedSignals.length} signals for ${symbol}.`
    );
  } else {
    console.log(
      `[SMA SYMBOL] GET: No signals generated to upsert for ${symbol}.`
    );
  }

  // Return the response
  console.log(
    `[SMA SYMBOL] GET: Processing finished for ${symbol}. Signals Generated: ${generatedSignals.length}. Errors: ${errorsList.length}.`
  );
  return NextResponse.json({
    message: `Signal processing for ${symbol} complete ${
      dateParam ? `for date ${dateParam}` : "for latest available date"
    }.`,
    symbol: symbol,
    signalsGeneratedCount: generatedSignals.length,
    processingErrors: errorsList.length > 0 ? errorsList : undefined,
  });
}
