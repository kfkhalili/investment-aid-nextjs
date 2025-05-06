"use client";

import { useState, useEffect, useRef } from "react"; // Import useRef
import type { GenerateMarketSignalsOutput } from "@/ai/flows/generate-market-signals"; // Updated import type
import { generateMarketSignals } from "@/ai/flows/generate-market-signals"; // Updated import
import SignalCard from "@/components/signal-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button"; // Import Button
import { Terminal } from "lucide-react";
import { cn } from "@/lib/utils"; // Import cn utility

// Placeholder user preferences - In a real app, these would come from auth/user profile
const placeholderUserPreferences = {
  industries: ["Technology", "Healthcare", "Finance", "Energy"], // Added Energy
  sectors: [
    "Software",
    "Biotechnology",
    "Cloud Computing",
    "AI",
    "Semiconductors",
    "Banking",
  ], // Added Semiconductors, Banking
  portfolio: [
    { symbol: "AAPL", name: "Apple Inc." },
    { symbol: "GOOGL", name: "Alphabet Inc." },
    { symbol: "MSFT", name: "Microsoft Corporation" },
    { symbol: "NVDA", name: "NVIDIA Corporation" }, // Added NVDA
    { symbol: "JPM", name: "JPMorgan Chase & Co." }, // Added JPM
    { symbol: "TSLA", name: "Tesla, Inc." },
    { symbol: "AMZN", name: "Amazon.com, Inc." },
    { symbol: "META", name: "Meta Platforms, Inc." },
    { symbol: "V", name: "Visa Inc." },
    { symbol: "UNH", name: "UnitedHealth Group Incorporated" },
    { symbol: "BTC-USD", name: "Bitcoin" }, // Added Bitcoin
    { symbol: "ETH-USD", name: "Ethereum" }, // Added Ethereum
  ],
};

// Define MarketSignal type locally matching the output schema element
interface MarketSignal {
  title: string;
  description: string;
  timestamp: number;
}

export default function Home() {
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"popular" | "trending">(
    "popular"
  ); // State for active filter
  const filterSectionRef = useRef<HTMLDivElement>(null); // Ref for the filter section

  useEffect(() => {
    const fetchSignals = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use placeholder preferences for now
        console.log(
          `Requesting signal generation for '${activeFilter}' with preferences:`,
          placeholderUserPreferences
        );
        // TODO: In a real app, use the activeFilter to fetch appropriate signals
        const generatedSignals: GenerateMarketSignalsOutput =
          await generateMarketSignals(placeholderUserPreferences); // Use new function
        console.log(
          `Received ${generatedSignals?.length ?? 0} generated signals:`,
          generatedSignals
        );
        // Ensure generatedSignals is always an array before setting state
        setSignals(Array.isArray(generatedSignals) ? generatedSignals : []);
      } catch (err) {
        console.error("Error generating signals:", err);
        setError("Failed to generate market signals. Please try again later.");
        // Provide some static fallback signals on error
        setSignals([
          {
            title: "Fallback: Market Volatility High",
            description: "Increased market volatility observed.",
            timestamp: Date.now(),
          },
          {
            title: "Fallback: Check Tech Stocks",
            description: "Monitor technology sector performance closely.",
            timestamp: Date.now() - 3600000,
          },
          {
            title: "Fallback: Interest Rates Steady",
            description: "Central bank indicates steady interest rates.",
            timestamp: Date.now() - 7200000,
          },
          {
            title: "Fallback: Oil Prices Fluctuate",
            description: "Geopolitical tensions cause oil price swings.",
            timestamp: Date.now() - 10800000,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignals();
  }, [activeFilter]); // Refetch signals when activeFilter changes

  // Function to handle filter change and scroll
  const handleFilterChange = (newFilter: "popular" | "trending") => {
    // Scroll the filter section into view
    if (filterSectionRef.current) {
      // Use block: 'start' to align the top of the element with the top of the scroll container (or just below sticky header)
      filterSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    // Update the active filter state *after* initiating the scroll
    setActiveFilter(newFilter);
  };

  return (
    <div>
      {" "}
      {/* Removed container mx-auto and padding from here */}
      {/* Header Section - Updated Text Styles */}
      <div className="container mx-auto px-4">
        {" "}
        {/* Added container/padding here */}
        <div className="flex flex-col items-center justify-center text-center min-h-[40vh] mb-12">
          {" "}
          {/* Reduced min-h from 50vh to 40vh */}
          <h1 className="text-5xl sm:text-6xl uppercase mb-0 font-bold font-['FaktCondensed',_AvenirNextCondensed-Medium,_'Segoe_UI',_sans-serif]">
            {" "}
            {/* Reduced mb */}
            Spot the Trends
          </h1>
          <h2 className="text-5xl sm:text-6xl uppercase underline decoration-primary decoration-[12px] underline-offset-8 mb-6 font-bold font-['FaktCondensed',_AvenirNextCondensed-Medium,_'Segoe_UI',_sans-serif] -mt-2">
            {" "}
            {/* Added negative mt */}
            See the Moves
          </h2>
          <p className="text-lg sm:text-xl text-foreground/80 max-w-2xl mb-8">
            Market Signals, Simplified
          </p>
          {/* Centered Sign Up Button */}
          <Button size="lg">Sign up</Button>
        </div>
      </div>
      {/* Error Alert (inside container) */}
      {error && (
        <div className="container mx-auto px-4">
          <Alert variant="destructive" className="mb-6">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
      {/* Filter Buttons Section - Made sticky */}
      {/* Use theme(spacing.14) which corresponds to h-14 of the header */}
      <div
        ref={filterSectionRef}
        id="filter-section"
        className="sticky top-[theme(spacing.14)] z-20 bg-background border-b mb-6"
      >
        {" "}
        {/* Added ref and id */}
        <div className="container mx-auto px-4 py-4">
          {" "}
          {/* Container for content alignment + padding */}
          <div className="flex justify-center sm:justify-start gap-4">
            <Button
              variant="ghost" // Use ghost for minimal styling
              onClick={() => handleFilterChange("popular")} // Use handler
              className={cn(
                "uppercase tracking-wider font-semibold hover:bg-transparent hover:text-primary focus-visible:ring-0 focus-visible:ring-offset-0", // Only change text color on hover, remove focus ring
                {
                  "text-primary": activeFilter === "popular", // Style for active button
                  "text-muted-foreground": activeFilter !== "popular", // Dimmer color for inactive
                }
              )}
            >
              Popular
            </Button>
            <Button
              variant="ghost" // Use ghost for minimal styling
              onClick={() => handleFilterChange("trending")} // Use handler
              className={cn(
                "uppercase tracking-wider font-semibold hover:bg-transparent hover:text-primary focus-visible:ring-0 focus-visible:ring-offset-0", // Only change text color on hover, remove focus ring
                {
                  "text-primary": activeFilter === "trending", // Style for active button
                  "text-muted-foreground": activeFilter !== "trending", // Dimmer color for inactive
                }
              )}
            >
              Trending
            </Button>
          </div>
        </div>
      </div>
      {/* Signal Cards Grid (inside container) */}
      <div className="container mx-auto px-4 pb-8">
        {" "}
        {/* Added container/padding here, added bottom padding */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 9 }).map(
                (
                  _,
                  index // Reduced skeleton count to 9
                ) => (
                  <Skeleton key={index} className="h-72 w-full rounded-lg" /> // Updated height to h-72
                )
              )
            : signals.map((signal, index) => (
                <SignalCard key={index} signal={signal} />
              ))}
          {!isLoading && signals.length === 0 && !error && (
            <div className="col-span-full text-center text-muted-foreground py-10">
              No relevant market signals found for the `{activeFilter}` filter.
              Try adjusting preferences or check back later.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
