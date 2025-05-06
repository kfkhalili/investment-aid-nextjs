// app/api/signal-sma/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import type { Database } from "@/lib/supabase/database.types";
import { generateAllSmaSignals } from "@/lib/services/signal-sma/fetch";

export async function GET(request: NextRequest): Promise<NextResponse> {
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
    `[SMA ALL] GET: Request received ${
      dateParam ? `for date ${dateParam}` : "for latest available data"
    }.`
  );

  // Call the service function
  // generateAllSMASignals already returns errorsProcessing with the correct structure
  const { allGeneratedSignals, errorsProcessing } = await generateAllSmaSignals(
    dateParam ?? undefined
  );

  // Upsert signals if any were generated
  if (allGeneratedSignals.length > 0) {
    console.log(
      `[SMA ALL] GET: Attempting to upsert ${allGeneratedSignals.length} signals...`
    );
    const supabase = getSupabaseServerClient(); // Get client for upsert
    const typedSignalsToInsert =
      allGeneratedSignals as Database["public"]["Tables"]["signals"]["Insert"][];

    const { error: upsertError } = await supabase
      .from("signals")
      .upsert(typedSignalsToInsert, {
        onConflict: "symbol, signal_date, signal_code",
      });

    if (upsertError) {
      console.error(
        "[SMA ALL] GET: Error upserting signals:",
        upsertError.message
      );
      return NextResponse.json(
        {
          message: `Signal generation run complete. FAILED to upsert some/all signals.`,
          signalsGeneratedCount: allGeneratedSignals.length,
          processingErrorCount: errorsProcessing.length,
          processingErrors: errorsProcessing, // This now matches ProcessingError[]
          insertError: upsertError.message,
        },
        { status: 500 }
      );
    }
    console.log(
      `[SMA ALL] GET: Successfully upserted ${allGeneratedSignals.length} signals.`
    );
  } else {
    console.log("[SMA ALL] GET: No signals generated to upsert.");
  }

  // Return the response
  console.log(
    `[SMA ALL] GET: Processing finished. Signals Generated: ${allGeneratedSignals.length}. Errors during processing: ${errorsProcessing.length}.`
  );
  return NextResponse.json({
    message: `Signal processing run complete ${
      dateParam ? `for date ${dateParam}` : "for latest available dates"
    }.`,
    signalsGeneratedCount: allGeneratedSignals.length,
    processingErrorCount: errorsProcessing.length,
    errors: errorsProcessing, // This now matches ProcessingError[]
  });
}
