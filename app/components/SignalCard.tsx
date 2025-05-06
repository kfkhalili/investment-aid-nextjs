import type { FC } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter, // Import CardFooter
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Zap,
  TrendingUp,
  Newspaper,
  HelpCircle,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  BarChart3,
  CandlestickChart,
  Scale,
  Gauge,
  AreaChart,
  FileText,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
} from "lucide-react"; // Added social icons
import { formatDistanceToNow } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils"; // Import cn

// Use a locally defined interface consistent with page.tsx and the flow output
interface MarketSignal {
  title: string;
  description: string;
  timestamp: number;
}

interface SignalCardProps {
  signal: MarketSignal;
}

const getIconForSignal = (title: string, description: string) => {
  const lowerTitle = title.toLowerCase();
  const lowerDesc = description.toLowerCase();
  const combinedLower = lowerTitle + " " + lowerDesc;

  // --- Sentiment Keywords (High Priority) ---
  if (
    combinedLower.includes("fear") ||
    combinedLower.includes("greed") ||
    combinedLower.includes("sentiment") ||
    combinedLower.includes("index")
  ) {
    return <Gauge className="h-6 w-6 text-inherit" />; // Use Gauge for sentiment indices, inherit color
  }

  // --- Technical Analysis Keywords ---
  if (
    combinedLower.includes("breakout") ||
    combinedLower.includes("bullish") ||
    combinedLower.includes("uptrend") ||
    combinedLower.includes("support holds") ||
    (combinedLower.includes("moving average cross") &&
      !combinedLower.includes("death cross"))
  ) {
    return <TrendingUp className="h-6 w-6 text-inherit" />; // Inherit color
  }
  if (
    combinedLower.includes("breakdown") ||
    combinedLower.includes("bearish") ||
    combinedLower.includes("downtrend") ||
    combinedLower.includes("resistance holds") ||
    combinedLower.includes("death cross")
  ) {
    return <TrendingDown className="h-6 w-6 text-inherit" />; // Inherit color
  }
  if (
    combinedLower.includes("rsi") ||
    combinedLower.includes("indicator") ||
    combinedLower.includes("technical") ||
    combinedLower.includes("chart pattern") ||
    combinedLower.includes("momentum")
  ) {
    return <CandlestickChart className="h-6 w-6 text-inherit" />; // Inherit color
  }
  if (
    combinedLower.includes("consolidation") ||
    combinedLower.includes("sideways") ||
    combinedLower.includes("range bound") ||
    combinedLower.includes("neutral outlook")
  ) {
    return <HelpCircle className="h-6 w-6 text-inherit" />; // Use HelpCircle for neutral technicals too, inherit color
  }

  // --- Fundamental Analysis Keywords ---
  if (
    combinedLower.includes("undervalued") ||
    combinedLower.includes("strong earnings") ||
    combinedLower.includes("buy rating") ||
    combinedLower.includes("growth potential") ||
    combinedLower.includes("low p/e")
  ) {
    return <CheckCircle className="h-6 w-6 text-inherit" />; // Inherit color
  }
  if (
    combinedLower.includes("overvalued") ||
    combinedLower.includes("weak earnings") ||
    combinedLower.includes("sell rating") ||
    combinedLower.includes("high p/e") ||
    combinedLower.includes("fundamental risk")
  ) {
    return <AlertCircle className="h-6 w-6 text-inherit" />; // Inherit color
  }
  if (
    combinedLower.includes("valuation") ||
    combinedLower.includes("p/e ratio") ||
    combinedLower.includes("fundamental") ||
    combinedLower.includes("metric") ||
    combinedLower.includes("fair value")
  ) {
    return <Scale className="h-6 w-6 text-inherit" />; // Inherit color
  }
  if (
    combinedLower.includes("earnings") ||
    combinedLower.includes("revenue") ||
    combinedLower.includes("dividend")
  ) {
    return <BarChart3 className="h-6 w-6 text-inherit" />; // Inherit color
  }

  // --- General Sentiment/News (Lower Priority than specific indices) ---
  if (
    lowerTitle.includes("down") ||
    lowerDesc.includes("drop") ||
    lowerDesc.includes("fall") ||
    lowerDesc.includes("negative") ||
    lowerTitle.includes("warning") ||
    lowerDesc.includes("risk") ||
    lowerDesc.includes("concern")
  ) {
    return <TrendingDown className="h-6 w-6 text-inherit" />; // Inherit color
  }
  if (
    lowerTitle.includes("alert") ||
    lowerTitle.includes("issue") ||
    lowerTitle.includes("scrutiny")
  ) {
    return <AlertCircle className="h-6 w-6 text-inherit" />; // Inherit color
  }
  if (
    lowerTitle.includes("up") ||
    lowerDesc.includes("rise") ||
    lowerDesc.includes("boost") ||
    lowerDesc.includes("positive") ||
    lowerTitle.includes("upgrade") ||
    lowerDesc.includes("strong buy") ||
    lowerDesc.includes("growth")
  ) {
    return <TrendingUp className="h-6 w-6 text-inherit" />; // Inherit color
  }
  if (
    lowerDesc.includes("optimistic") ||
    lowerDesc.includes("approved") ||
    lowerDesc.includes("exceed") ||
    lowerTitle.includes("good")
  ) {
    return <CheckCircle className="h-6 w-6 text-inherit" />; // Inherit color
  }
  if (
    lowerTitle.includes("fed") ||
    lowerTitle.includes("news") ||
    lowerTitle.includes("report") ||
    lowerTitle.includes("data") ||
    lowerTitle.includes("update")
  ) {
    return <Newspaper className="h-6 w-6 text-inherit" />; // Inherit color
  }
  if (
    lowerTitle.includes("index") ||
    lowerTitle.includes("trend") ||
    lowerTitle.includes("potential") ||
    lowerTitle.includes("market") ||
    lowerTitle.includes("sector") ||
    lowerTitle.includes("outlook")
  ) {
    return <TrendingUp className="h-6 w-6 text-inherit" />; // Inherit color
  }

  // Check if any specific keyword matched before resorting to Zap
  const specificKeywords = [
    "fear",
    "greed",
    "sentiment",
    "breakout",
    "bullish",
    "uptrend",
    "support holds",
    "moving average",
    "breakdown",
    "bearish",
    "downtrend",
    "resistance holds",
    "death cross",
    "rsi",
    "indicator",
    "technical",
    "chart pattern",
    "momentum",
    "consolidation",
    "sideways",
    "range bound",
    "neutral outlook",
    "undervalued",
    "strong earnings",
    "buy rating",
    "growth potential",
    "low p/e",
    "overvalued",
    "weak earnings",
    "sell rating",
    "high p/e",
    "fundamental risk",
    "valuation",
    "p/e ratio",
    "fundamental",
    "metric",
    "fair value",
    "earnings",
    "revenue",
    "dividend",
    "news",
    "report",
    "data",
    "update",
    "index",
    "trend",
    "potential",
    "market",
    "sector",
    "outlook",
  ];
  const hasSpecificKeyword = specificKeywords.some((keyword) =>
    combinedLower.includes(keyword)
  );

  // Only use Zap if no specific icon was matched and the title/desc mentions stock/crypto etc.
  if (
    !hasSpecificKeyword &&
    (lowerTitle.includes("stock") ||
      lowerTitle.includes("crypto") ||
      lowerTitle.includes("buy") ||
      lowerTitle.includes("sell") ||
      lowerTitle.includes("holding") ||
      lowerDesc.includes("stock") ||
      lowerDesc.includes("portfolio"))
  ) {
    return <Zap className="h-6 w-6 text-inherit" />; // Inherit color
  }

  return <HelpCircle className="h-6 w-6 text-inherit" />; // Fallback icon, inherit color
};

const SignalCard: FC<SignalCardProps> = ({ signal }) => {
  const timeAgo = formatDistanceToNow(new Date(signal.timestamp), {
    addSuffix: true,
  });
  const IconComponent = getIconForSignal(signal.title, signal.description);

  return (
    <Dialog>
      {/* The DialogTrigger with asChild requires exactly one direct child element. */}
      <DialogTrigger asChild>
        <Card
          className={cn(
            "flex flex-col h-72", // Kept height h-72 for grid consistency
            "transition-shadow duration-300 hover:shadow-lg cursor-pointer",
            "text-foreground" // Ensure text color inherits correctly
          )}
        >
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="flex-1 pr-2">
              {" "}
              {/* Added padding right */}
              <CardTitle className="text-base font-semibold line-clamp-2">
                {signal.title}
              </CardTitle>{" "}
              {/* Adjusted size and line clamp */}
              <CardDescription className="text-xs text-muted-foreground pt-1">
                {timeAgo}
              </CardDescription>
            </div>
            <div className="p-2 rounded-md bg-secondary flex-shrink-0 text-foreground">
              {" "}
              {/* Added text-foreground */}
              {IconComponent}
            </div>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden pt-0 pb-2">
            {" "}
            {/* Reduced bottom padding */}
            <p className="text-sm line-clamp-5">{signal.description}</p>{" "}
            {/* Reduced line clamp to 5 */}
          </CardContent>
          {/* Added CardFooter for social actions */}
          <CardFooter className="p-0 pt-2 pb-2 border-t mt-auto">
            <div className="flex justify-around items-center w-full">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:bg-primary hover:text-primary-foreground h-8 w-8"
              >
                {" "}
                {/* Updated hover effect */}
                <Heart className="h-4 w-4" />
                <span className="sr-only">Like</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:bg-primary hover:text-primary-foreground h-8 w-8"
              >
                {" "}
                {/* Updated hover effect */}
                <MessageCircle className="h-4 w-4" />
                <span className="sr-only">Comment</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:bg-primary hover:text-primary-foreground h-8 w-8"
              >
                {" "}
                {/* Updated hover effect */}
                <Bookmark className="h-4 w-4" />
                <span className="sr-only">Save</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:bg-primary hover:text-primary-foreground h-8 w-8"
              >
                {" "}
                {/* Updated hover effect */}
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Share</span>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        {" "}
        {/* Slightly wider dialog */}
        <DialogHeader>
          <DialogTitle>{signal.title}</DialogTitle>
          <DialogDescription>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </DialogDescription>
        </DialogHeader>
        <Separator className="my-4" /> {/* Added Separator */}
        <div className="grid gap-4 py-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Description</h3>
            <p className="text-sm text-foreground">{signal.description}</p>
          </div>

          <Separator className="my-2" />

          {/* Placeholder for Chart */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <AreaChart className="h-4 w-4 mr-2 text-primary" /> Chart
            </h3>
            <div className="flex items-center justify-center h-32 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                (Chart placeholder)
              </p>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Placeholder for Related News */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Newspaper className="h-4 w-4 mr-2 text-accent" /> Related News
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>(Related news article 1 placeholder)</li>
              <li>(Related news article 2 placeholder)</li>
            </ul>
          </div>

          <Separator className="my-2" />

          {/* Placeholder for Deeper Analysis */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-secondary-foreground" />{" "}
              Deeper Analysis
            </h3>
            <p className="text-sm text-muted-foreground">
              (Placeholder for more detailed analysis, potential impacts, or
              expert commentary.)
            </p>
          </div>
        </div>
        <Separator className="mt-4" /> {/* Added Separator before footer */}
        <DialogFooter className="pt-4">
          {" "}
          {/* Added padding top */}
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignalCard;
