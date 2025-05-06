"use client";

import { useState, useEffect, useRef, useCallback } from "react"; // Added useCallback
import SignalCard from "@/components/SignalCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { StyledSignUpButton } from "./components/StyledClerk";
import { SignedOut, useAuth } from "@clerk/nextjs";

interface MarketSignal {
  title: string;
  description: string;
  timestamp: number;
  symbol?: string;
  signalCode?: string;
}

const TOP_SYMBOLS_TO_PROCESS: string[] = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "NVDA",
  "TSLA",
  "META",
  "JPM",
  "V",
  "JNJ",
  // "XOM", "WMT", "UNH", "LLY", "AVGO", "PG", "HD", "MA", "CVX", "MRK",
  // "PEP", "COST", "KO", "ADBE", "BAC", "CSCO", "CRM", "MCD", "PFE", "ABBV",
];

export default function Home() {
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] =
    useState<string>("Initializing...");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "popular" | "trending"
  >("all");
  const filterSectionRef = useRef<HTMLDivElement>(null);
  const { isSignedIn } = useAuth();

  // useCallback to memoize fetchAndProcessAllSymbols to prevent re-creation on every render
  // unless its own dependencies change (which are none in this case, as TOP_SYMBOLS_TO_PROCESS is constant).
  const fetchAndProcessAllSymbols = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSignals([]);

    let overallErrorMessage: string | null = null;
    let ingestedSymbolsCount = 0;

    try {
      // Phase 1: Ingest data
      setLoadingMessage(
        `Ingesting data for ${TOP_SYMBOLS_TO_PROCESS.length} symbols...`
      );
      const ingestPromises = TOP_SYMBOLS_TO_PROCESS.map(async (symbol) => {
        try {
          const response = await fetch(`/api/ingest/${symbol}`);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Graceful JSON parsing
            console.warn(
              `Ingestion failed for ${symbol}: ${
                errorData.error || response.statusText || response.status
              }`
            );
            return {
              symbol,
              status: "ingest_failed",
              error: errorData.error || `HTTP ${response.status}`,
            };
          }
          ingestedSymbolsCount++;
          return { symbol, status: "ingest_success" };
        } catch (ingestErr: unknown) {
          const errorMessage =
            ingestErr instanceof Error
              ? ingestErr.message
              : "Unknown ingest error";
          console.warn(`Ingestion error for ${symbol}: ${errorMessage}`);
          return { symbol, status: "ingest_error", error: errorMessage };
        }
      });

      const ingestResults = await Promise.allSettled(ingestPromises);
      const ingestFailures = ingestResults.filter(
        (r) =>
          r.status === "rejected" ||
          (r.status === "fulfilled" && r.value.status !== "ingest_success")
      ).length;

      ingestResults.forEach((result) => {
        if (
          result.status === "fulfilled" &&
          result.value.status !== "ingest_success"
        ) {
          console.log(
            `Ingestion issue for ${result.value.symbol}: ${
              result.value.error || result.value.status
            }`
          );
        } else if (result.status === "rejected") {
          console.error(
            `Critical ingestion promise rejection: `,
            result.reason
          );
        }
      });
      console.log(
        `Ingestion attempts completed. Success: ${ingestedSymbolsCount}, Failures/Issues: ${ingestFailures}`
      );
      if (
        ingestFailures > 0 &&
        ingestFailures === TOP_SYMBOLS_TO_PROCESS.length
      ) {
        overallErrorMessage =
          "Data ingestion failed for all symbols. Signals may be outdated or unavailable.";
      } else if (ingestFailures > 0) {
        overallErrorMessage =
          "Some data ingestion tasks failed. Displayed signals might be based on partially updated data.";
      }

      // Phase 2: Fetch signals
      setLoadingMessage(
        `Fetching signals for ${TOP_SYMBOLS_TO_PROCESS.length} symbols...`
      );
      let allFetchedSignals: MarketSignal[] = [];
      const signalFetchPromises = TOP_SYMBOLS_TO_PROCESS.map(async (symbol) => {
        try {
          const response = await fetch(`/api/signals/${symbol}`);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.warn(
              `Signal fetch failed for ${symbol}: ${
                errorData.error || response.statusText || response.status
              }`
            );
            return [];
          }
          const fetchedSignalsForSymbol: MarketSignal[] = await response.json();
          return fetchedSignalsForSymbol;
        } catch (signalErr: unknown) {
          const errorMessage =
            signalErr instanceof Error
              ? signalErr.message
              : "Unknown signal fetch error";
          console.warn(`Signal fetch error for ${symbol}: ${errorMessage}`);
          return [];
        }
      });

      const signalResults = await Promise.allSettled(signalFetchPromises);
      let signalFetchRejections = 0;
      signalResults.forEach((result) => {
        if (result.status === "fulfilled" && Array.isArray(result.value)) {
          allFetchedSignals = allFetchedSignals.concat(result.value);
        } else if (result.status === "rejected") {
          console.error(
            `Critical signal fetch promise rejection: `,
            result.reason
          );
          signalFetchRejections++;
        }
      });

      allFetchedSignals.sort((a, b) => b.timestamp - a.timestamp);
      console.log(
        `Signal fetching completed. Total signals retrieved: ${allFetchedSignals.length}. Rejections: ${signalFetchRejections}`
      );
      setSignals(allFetchedSignals);

      if (signalFetchRejections > 0 && !overallErrorMessage) {
        overallErrorMessage =
          "Some signals could not be fetched. The displayed list may be incomplete.";
      }

      if (allFetchedSignals.length === 0 && !overallErrorMessage) {
        if (ingestFailures === TOP_SYMBOLS_TO_PROCESS.length) {
          overallErrorMessage =
            "No signals available due to data ingestion failures.";
        } else {
          // This message will be shown by the UI component itself if filteredSignals is empty
          // overallErrorMessage = "No market signals found after processing.";
        }
      }

      if (overallErrorMessage) {
        setError(overallErrorMessage);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unknown error occurred during setup";
      console.error("Overall error in fetchAndProcessAllSymbols:", err);
      setError(`Failed to process market signals. ${errorMessage}`);
      setSignals([
        {
          title: "Fallback: System Error",
          description:
            "An error occurred while preparing market signals. Please try again later.",
          timestamp: Date.now(),
          symbol: "SYSTEM",
          signalCode: "PROCESS_ERROR",
        },
      ]);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: fetch data once on mount.
  // activeFilter will apply client-side. If API filtering is added, activeFilter should be a dependency.

  useEffect(() => {
    fetchAndProcessAllSymbols();
  }, [fetchAndProcessAllSymbols]); // Run fetchAndProcessAllSymbols when it (or its dependencies) change. Since it's memoized and has no deps, this runs once.

  const handleFilterChange = (newFilter: "all" | "popular" | "trending") => {
    if (filterSectionRef.current) {
      filterSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    setActiveFilter(newFilter);
  };

  const filteredSignals = signals.filter(() => {
    if (activeFilter === "all") return true;
    if (activeFilter === "popular") {
      // Placeholder: Implement actual popularity logic
      // e.g., return ["AAPL", "TSLA", "NVDA"].includes(signal.symbol || "") || signal.signalCode?.includes("CROSS_ABOVE");
      return true;
    }
    if (activeFilter === "trending") {
      // Placeholder: Implement actual trending logic
      // e.g., const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000; return signal.timestamp > oneDayAgo;
      return true;
    }
    return true;
  });

  return (
    <div>
      {!isSignedIn && (
        <SignedOut>
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-center text-center min-h-[40vh] mb-12">
              <h1 className="text-5xl sm:text-6xl uppercase mb-0 font-bold font-['FaktCondensed',_AvenirNextCondensed-Medium,_'Segoe_UI',_sans-serif]">
                Spot the Trends
              </h1>
              <h2 className="text-5xl sm:text-6xl uppercase underline decoration-primary decoration-[12px] underline-offset-8 mb-6 font-bold font-['FaktCondensed',_AvenirNextCondensed-Medium,_'Segoe_UI',_sans-serif] -mt-2">
                See the Moves
              </h2>
              <p className="text-lg sm:text-xl text-foreground/80 max-w-2xl mb-8">
                Market Signals, Simplified
              </p>
              <StyledSignUpButton>
                <Button size="lg">Sign up</Button>
              </StyledSignUpButton>
            </div>
          </div>
        </SignedOut>
      )}

      {error && !isLoading && (
        <div className="container mx-auto px-4">
          <Alert variant="destructive" className="mb-6">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Signal Processing Issue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <div
        ref={filterSectionRef}
        id="filter-section"
        className="sticky top-[56px] sm:top-[theme(spacing.14)] z-20 bg-background border-b mb-6"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-center sm:justify-start gap-2 sm:gap-4">
            {(["all", "popular", "trending"] as const).map((filter) => (
              <Button
                key={filter}
                variant="ghost"
                onClick={() => handleFilterChange(filter)}
                className={cn(
                  "uppercase tracking-wider font-semibold hover:bg-transparent hover:text-primary focus-visible:ring-0 focus-visible:ring-offset-0 px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base",
                  {
                    "text-primary": activeFilter === filter,
                    "text-muted-foreground": activeFilter !== filter,
                  }
                )}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-8">
        {isLoading && (
          <div className="text-center py-4 text-muted-foreground">
            {loadingMessage}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({
                length:
                  TOP_SYMBOLS_TO_PROCESS.length > 6
                    ? 6
                    : TOP_SYMBOLS_TO_PROCESS.length || 3,
              }).map((_, index) => (
                <Skeleton key={index} className="h-72 w-full rounded-lg" />
              ))
            : filteredSignals.map((signal, index) => (
                <SignalCard
                  key={`${signal.timestamp}-${signal.symbol || "unknown"}-${
                    signal.signalCode || index
                  }`}
                  signal={signal}
                />
              ))}
          {!isLoading && filteredSignals.length === 0 && !error && (
            <div className="col-span-full text-center text-muted-foreground py-10">
              No market signals found for the `{activeFilter}` filter after
              processing {TOP_SYMBOLS_TO_PROCESS.length} symbols.
            </div>
          )}
          {!isLoading &&
            filteredSignals.length === 0 &&
            error && ( // Show this if there was an error and no signals are displayed
              <div className="col-span-full text-center text-muted-foreground py-10">
                Signal display unavailable due to processing issues. Please see
                error above.
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
