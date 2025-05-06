"use server";
/**
 * @fileOverview A market signal generation AI agent focusing on fundamental and technical metrics.
 *
 * - generateMarketSignals - A function that handles the signal generation process.
 * - GenerateMarketSignalsInput - The input type for the generateMarketSignals function.
 * - GenerateMarketSignalsOutput - The return type for the generateMarketSignals function.
 */

import { ai } from "@/ai/ai-instance";
import { z } from "genkit";

// Define Zod schemas for the tool
const StockStatusInputSchema = z.object({
  ticker: z
    .string()
    .describe(
      "The stock ticker symbol to get the status for (e.g., AAPL, GOOGL)."
    ),
});

const StockStatusOutputSchema = z.object({
  ticker: z.string().describe("The stock ticker symbol."),
  priceChangePercent: z
    .number()
    .describe("The simulated percentage price change today."),
  sentiment: z
    .enum(["positive", "negative", "neutral"])
    .describe("Simulated recent news sentiment."),
  headline: z
    .string()
    .describe("A brief simulated news headline related to the stock."),
  simulatedPE: z
    .number()
    .optional()
    .describe("A simulated Price-to-Earnings (P/E) ratio."),
  technicalOutlook: z
    .enum(["bullish", "bearish", "neutral"])
    .optional()
    .describe("A simulated technical outlook based on chart patterns."),
});

// Define the Genkit tool
const getStockStatus = ai.defineTool(
  {
    name: "getStockStatus",
    description:
      "Gets the current simulated status, recent news sentiment, and basic fundamental/technical metrics for a specific stock ticker.",
    inputSchema: StockStatusInputSchema,
    outputSchema: StockStatusOutputSchema,
  },
  async (input) => {
    console.log(`Tool: getStockStatus called for ${input.ticker}`);
    // Simulate fetching stock data - In a real app, call an API here
    await new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 200)
    ); // Simulate network delay

    // Simulated data based on ticker
    const tickerData: Record<
      string,
      Omit<z.infer<typeof StockStatusOutputSchema>, "ticker">
    > = {
      AAPL: {
        priceChangePercent:
          Math.random() > 0.4 ? Math.random() * 2 : -(Math.random() * 1.5),
        sentiment: Math.random() > 0.4 ? "positive" : "negative",
        headline: "Analysts optimistic about upcoming product launch.",
        simulatedPE: 25 + Math.random() * 10,
        technicalOutlook: Math.random() > 0.5 ? "bullish" : "neutral",
      },
      GOOGL: {
        priceChangePercent: Math.random() * 1.5 - 0.5,
        sentiment: Math.random() > 0.6 ? "positive" : "neutral",
        headline: "Cloud division shows steady growth amidst competition.",
        simulatedPE: 20 + Math.random() * 8,
        technicalOutlook: "neutral",
      },
      MSFT: {
        priceChangePercent: Math.random() * 2.5 - 0.8,
        sentiment: "positive",
        headline: "Strong earnings reported, AI integration praised.",
        simulatedPE: 30 + Math.random() * 12,
        technicalOutlook: "bullish",
      },
      TSLA: {
        priceChangePercent: Math.random() * 8 - 4,
        sentiment: Math.random() > 0.5 ? "positive" : "negative",
        headline:
          "Delivery numbers meet expectations, but face regulatory scrutiny.",
        simulatedPE: 50 + Math.random() * 20,
        technicalOutlook: Math.random() > 0.5 ? "neutral" : "bearish",
      },
      AMZN: {
        priceChangePercent: Math.random() * 1 - 0.3,
        sentiment: "neutral",
        headline: "E-commerce sales stable, AWS performance key focus.",
        simulatedPE: 40 + Math.random() * 15,
        technicalOutlook: "neutral",
      },
      NVDA: {
        priceChangePercent: Math.random() * 5 - 1,
        sentiment: "positive",
        headline: "AI chip demand continues to fuel growth.",
        simulatedPE: 60 + Math.random() * 25,
        technicalOutlook: "bullish",
      },
      META: {
        priceChangePercent: Math.random() * 3 - 1.5,
        sentiment: "neutral",
        headline: "Advertising revenue stable, Metaverse investments watched.",
        simulatedPE: 18 + Math.random() * 7,
        technicalOutlook: "neutral",
      },
      JPM: {
        priceChangePercent: Math.random() * 1 - 0.2,
        sentiment: "positive",
        headline:
          "Financial sector shows resilience, interest rate impact considered.",
        simulatedPE: 10 + Math.random() * 4,
        technicalOutlook: "neutral",
      },
      V: {
        priceChangePercent: Math.random() * 0.8 - 0.1,
        sentiment: "positive",
        headline: "Payment processing volume remains strong globally.",
        simulatedPE: 28 + Math.random() * 9,
        technicalOutlook: "bullish",
      },
      UNH: {
        priceChangePercent: Math.random() * 1.2 - 0.4,
        sentiment: "neutral",
        headline: "Healthcare sector navigates policy changes.",
        simulatedPE: 22 + Math.random() * 6,
        technicalOutlook: "neutral",
      },
      // Add more simulated data as needed
    };

    const defaultData: Omit<
      z.infer<typeof StockStatusOutputSchema>,
      "ticker"
    > = {
      priceChangePercent: Math.random() * 4 - 2, // Default random data
      sentiment: ["positive", "negative", "neutral"][
        Math.floor(Math.random() * 3)
      ] as "positive" | "negative" | "neutral",
      headline: "General market movements observed for this stock.",
      simulatedPE: 15 + Math.random() * 20,
      technicalOutlook: ["bullish", "bearish", "neutral"][
        Math.floor(Math.random() * 3)
      ] as "bullish" | "bearish" | "neutral",
    };

    // Introduce more randomness/defaults for tickers not explicitly defined
    const upperCaseTicker = input.ticker.toUpperCase();
    const data = tickerData[upperCaseTicker] || defaultData;

    // Ensure PE and Technical Outlook are sometimes omitted randomly for variety
    const finalData = { ...data };
    if (Math.random() < 0.2) delete finalData.simulatedPE;
    if (Math.random() < 0.15) delete finalData.technicalOutlook;

    return {
      ticker: upperCaseTicker,
      ...finalData,
    };
  }
);

// Define schemas for the main flow
const GenerateMarketSignalsInputSchema = z.object({
  industries: z
    .array(z.string())
    .describe(
      "The industries the user is interested in (e.g., Technology, Healthcare)."
    ),
  sectors: z
    .array(z.string())
    .describe(
      "The sectors the user is interested in (e.g., Software, Biotechnology)."
    ),
  portfolio: z
    .array(
      z.object({
        symbol: z.string(),
        name: z.string(),
      })
    )
    .describe("The stocks/crypto the user currently holds in their portfolio."),
});
export type GenerateMarketSignalsInput = z.infer<
  typeof GenerateMarketSignalsInputSchema
>;

const MarketSignalSchema = z.object({
  title: z
    .string()
    .describe("The concise title of the market signal (max 10 words)."),
  description: z
    .string()
    .describe(
      "A brief description elaborating on the market signal (max 30 words). Focus on fundamental or technical analysis points."
    ),
  timestamp: z
    .number()
    .describe(
      "The current timestamp when the signal was generated (use milliseconds since epoch)."
    ),
  // Optional: Add relevance score or source later if needed
});

const GenerateMarketSignalsOutputSchema = z
  .array(MarketSignalSchema)
  .describe(
    "An array of 20-25 generated market signals based on fundamental or technical analysis."
  ); // Updated description
export type GenerateMarketSignalsOutput = z.infer<
  typeof GenerateMarketSignalsOutputSchema
>;

// Define the prompt
const generateSignalsPrompt = ai.definePrompt({
  name: "generateSignalsPrompt",
  input: { schema: GenerateMarketSignalsInputSchema },
  output: { schema: GenerateMarketSignalsOutputSchema },
  tools: [getStockStatus], // Make the tool available to the LLM
  prompt: `You are MarketEcho, an expert financial AI assistant specializing in fundamental and technical analysis. Your task is to generate 20-25 relevant and diverse market signals for a user based on their preferences, focusing on actionable insights derived from financial metrics and chart patterns.

User Preferences:
- Interested Industries: {{#if industries}}{{#each industries}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None specified{{/if}}
- Interested Sectors: {{#if sectors}}{{#each sectors}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None specified{{/if}}
- Current Portfolio: {{#if portfolio}}{{#each portfolio}}{{{this.symbol}}} ({{this.name}}){{#unless @last}}, {{/unless}}{{/each}}{{else}}None specified{{/if}}

Instructions:
1.  **Generate 20-25 market signals.** Each signal should represent a specific insight based on fundamental or technical analysis. Ensure a good variety across different stocks, metrics, and signal types. Include stocks beyond the user's portfolio if needed to reach the target number, focusing on user's interested industries/sectors or general market trends.
2.  **Prioritize Relevance:** Focus on signals related to the user's specified industries, sectors, and portfolio holdings first.
3.  **Use the Tool:** For stocks in the user's portfolio ({{#if portfolio}}{{#each portfolio}}{{{this.symbol}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}), **and potentially for 2-3 additional stocks** related to their interests or market leaders (e.g., NVDA, META, JPM, V, UNH), use the 'getStockStatus' tool to get current simulated data (price change, sentiment, headline, P/E, technical outlook). Incorporate this information into relevant fundamental or technical signals. For example, mention if a stock's P/E seems high/low, or if the technical outlook is bullish/bearish.
4.  **Focus on Metrics & Patterns:** Generate signals related to:
    *   **Fundamental Analysis:** Valuation (e.g., P/E ratio comparison, high/low valuation), earnings trends, dividend news, sector fundamentals, debt levels, revenue growth.
    *   **Technical Analysis:** Trend analysis (e.g., moving average crossovers, support/resistance levels), momentum indicators (e.g., RSI overbought/oversold), chart patterns (e.g., potential breakout, consolidation, head and shoulders), volume analysis.
    *   **Market Sentiment:** Include at least two signals related to overall market sentiment indicators like the Fear & Greed Index (simulate a value like 'Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed' and explain its implication). Mention VIX levels if relevant.
    *   **Cryptocurrency:** Mention relevant crypto news (e.g., Bitcoin halving impact, Ethereum ETF news), technical levels (e.g., BTC resistance at $70k), or adoption trends if applicable to user interests (though the tool only provides stock data). Create 1-2 crypto signals.
5.  **Create Diversity:** Generate a mix of potentially positive (e.g., undervalued, bullish pattern, greed index), negative (e.g., overvalued, bearish pattern, fear index), and neutral (e.g., consolidation, watch zone, neutral index) signals. Cover different analysis types (fundamental, technical, sentiment). Aim for diverse tickers.
6.  **Format:** Ensure each signal has a 'title' (max 10 words), 'description' (max 30 words, focusing on the analysis point), and 'timestamp' (use the current time in milliseconds since epoch). Keep titles and descriptions concise and analysis-driven.

Generate the signals now based on the user's preferences and the fundamental/technical data obtained from the getStockStatus tool for their portfolio stocks and other relevant tickers, incorporating market sentiment signals like Fear & Greed and VIX, and crypto signals. Aim for 20-25 signals in total.`, // Updated count
});

// Define the flow
const generateMarketSignalsFlow = ai.defineFlow<
  typeof GenerateMarketSignalsInputSchema,
  typeof GenerateMarketSignalsOutputSchema
>(
  {
    name: "generateMarketSignalsFlow",
    inputSchema: GenerateMarketSignalsInputSchema,
    outputSchema: GenerateMarketSignalsOutputSchema,
  },
  async (input) => {
    console.log(
      "Generating market signals (fundamental/technical/sentiment focus) for:",
      input
    );
    const { output } = await generateSignalsPrompt(input);

    // Add current timestamp to each generated signal if missing (though the prompt asks for it)
    const signalsWithTimestamp = output!.map((signal) => ({
      ...signal,
      timestamp: signal.timestamp || Date.now(),
    }));

    console.log(`Generated ${signalsWithTimestamp.length} signals.`);
    // Ensure the output is always an array, even if the LLM fails partially
    return Array.isArray(signalsWithTimestamp) ? signalsWithTimestamp : [];
  }
);

// Export the wrapper function and types
export async function generateMarketSignals(
  input: GenerateMarketSignalsInput
): Promise<GenerateMarketSignalsOutput> {
  // Add input validation here if needed before calling the flow
  return generateMarketSignalsFlow(input);
}
