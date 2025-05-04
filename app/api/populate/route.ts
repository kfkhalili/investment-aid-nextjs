/* ──────────────────────────────────────────────────────────────────────
 * app/api/populate/route.ts
 * Handler for GET requests to trigger data population for multiple symbols.
 * Fetches profile first, then statement data.
 * ---------------------------------------------------------------------*/
import { NextResponse } from "next/server";

// 1. Import service methods for Profile AND all statement types
import { getProfile } from "@/api/profiles/service"; // Adjust path
import { getIncomeStatementsForSymbol } from "@/api/income-statements/service"; // Adjust path
import { getBalanceSheetStatementsForSymbol } from "@/api/balance-sheet-statements/service"; // Adjust path
import { getCashFlowStatementsForSymbol } from "@/api/cash-flow-statements/service"; // Adjust path

// 2. Define the symbols you want to populate/update
const SYMBOLS_TO_POPULATE: ReadonlyArray<string> = [
  "MSFT", // Microsoft Corp.
  "AAPL", // Apple Inc.
  "NVDA", // NVIDIA Corp.
  "AMZN", // Amazon.com Inc.
  "GOOGL", // Alphabet Inc. Class A
  "META", // Meta Platforms, Inc.
  "BRK-B", // Berkshire Hathaway Inc. Class B
  "AVGO", // Broadcom Inc.
  "TSLA", // Tesla, Inc.
  "LLY", // Eli Lilly and Company
  "WMT", // Walmart Inc.
  "JPM", // JPMorgan Chase & Co.
  "V", // Visa Inc.
  "MA", // Mastercard Incorporated
  "NFLX", // Netflix, Inc.
  "XOM", // Exxon Mobil Corporation
  "COST", // Costco Wholesale Corp.
  "ORCL", // Oracle Corp.
  "PG", // Procter & Gamble Company
  "JNJ", // Johnson & Johnson
  "UNH", // UnitedHealth Group Inc.
  "HD", // The Home Depot, Inc.
  "ABBV", // AbbVie Inc.
  "KO", // The Coca-Cola Company
  "BAC", // Bank of America Corporation
  "TSM", // Taiwan Semiconductor Manufacturing Company Ltd. (ADR)
  "TMUS", // T-Mobile US, Inc.
  "PM", // Philip Morris International Inc.
  "CRM", // Salesforce, Inc.
  "CVX", // Chevron Corporation
  "WFC", // Wells Fargo & Co.
  "CSCO", // Cisco Systems, Inc.
  "MCD", // McDonald's Corporation
  "ABT", // Abbott Laboratories
  "IBM", // International Business Machines Corporation
  "GE", // General Electric Company / GE Aerospace
  "MRK", // Merck & Co., Inc.
  "T", // AT&T Inc.
  "NOW", // ServiceNow, Inc.
  "AXP", // American Express Company
  "PEP", // PepsiCo, Inc.
  "VZ", // Verizon Communications Inc.
  "MS", // Morgan Stanley
  "ISRG", // Intuitive Surgical, Inc.
  "GS", // The Goldman Sachs Group, Inc.
  "INTU", // Intuit Inc.
  "UBER", // Uber Technologies, Inc.
  "RTX", // RTX Corporation
  "BKNG", // Booking Holdings Inc.
  "PGR", // The Progressive Corporation
];

/**
 * Handles GET requests to trigger data population for a predefined list of symbols.
 * Explicitly fetches Profile first, then Income Statements, Balance Sheets,
 * and Cash Flow Statements concurrently for each symbol.
 */
export async function GET() {
  const startTime = Date.now();
  console.log(
    `GET /api/populate called. Processing ${SYMBOLS_TO_POPULATE.length} symbols.`
  );

  const populationPromises = SYMBOLS_TO_POPULATE.map(async (symbol) => {
    const symbolUpper = symbol.toUpperCase();
    // Include profile status in results
    const results = {
      profile: "Skipped",
      income: "Skipped",
      balance: "Skipped",
      cashflow: "Skipped",
    };
    let overallStatus: "Success" | "Failed" = "Failed"; // Assume failure
    let overallError: string | undefined = undefined;

    try {
      console.log(`[Populate] Processing ${symbolUpper}...`);

      // --- Step 1: Fetch/Ensure Profile Exists ---
      try {
        await getProfile(symbolUpper); // Await profile fetch/cache check
        results.profile = "Success";
        console.log(
          `[Populate] Profile check/fetch complete for ${symbolUpper}.`
        );
      } catch (profileError: unknown) {
        // If profile fails, we cannot proceed with statements due to FK constraints
        results.profile = `Failed: ${
          profileError instanceof Error
            ? profileError.message
            : String(profileError)
        }`;
        overallError = `Profile fetch failed: ${results.profile}`;
        console.error(
          `[Populate] Profile fetch failed for ${symbolUpper}, skipping statements. Error:`,
          profileError
        );
        // Skip statements by throwing to the outer catch or returning early
        throw new Error(overallError); // Throw to outer catch to mark symbol as failed
      }

      // --- Step 2: Fetch Statements Concurrently (only if profile succeeded) ---
      console.log(`[Populate] Fetching statements for ${symbolUpper}...`);
      const [incomeResult, balanceResult, cashFlowResult] =
        await Promise.allSettled([
          getIncomeStatementsForSymbol(symbolUpper),
          getBalanceSheetStatementsForSymbol(symbolUpper),
          getCashFlowStatementsForSymbol(symbolUpper),
        ]);

      // Update status based on promise results
      results.income =
        incomeResult.status === "fulfilled"
          ? "Success"
          : `Failed: ${
              (incomeResult.reason as Error)?.message ??
              String(incomeResult.reason)
            }`;
      results.balance =
        balanceResult.status === "fulfilled"
          ? "Success"
          : `Failed: ${
              (balanceResult.reason as Error)?.message ??
              String(balanceResult.reason)
            }`;
      results.cashflow =
        cashFlowResult.status === "fulfilled"
          ? "Success"
          : `Failed: ${
              (cashFlowResult.reason as Error)?.message ??
              String(cashFlowResult.reason)
            }`;

      // Determine overall success only if profile AND ALL statements succeeded
      if (
        results.profile === "Success" &&
        incomeResult.status === "fulfilled" &&
        balanceResult.status === "fulfilled" &&
        cashFlowResult.status === "fulfilled"
      ) {
        overallStatus = "Success";
      } else if (results.profile === "Success") {
        // Profile succeeded, but one or more statements failed
        overallError = "One or more statement fetches failed. See details.";
        overallStatus = "Failed";
      }
      // If profile failed, status remains 'Failed' from the earlier catch/throw

      console.log(
        `[Populate] Finished statements for ${symbolUpper}. Status: ${overallStatus}`
      );
    } catch (error: unknown) {
      // Catch errors from profile fetch or unexpected issues
      let message: string;
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === "string") {
        message = error;
      } else {
        try {
          message = JSON.stringify(error);
        } catch {
          message = "Unknown processing error.";
        }
      }

      overallError = message; // Capture the error message
      overallStatus = "Failed"; // Ensure status is failed
      console.error(
        `[Populate] Error processing ${symbolUpper}:`,
        overallError,
        error
      );

      // Update results if they were skipped due to the error
      results.profile =
        results.profile === "Skipped"
          ? `Failed: ${overallError}`
          : results.profile;
      results.income =
        results.income === "Skipped"
          ? `Failed: ${overallError}`
          : results.income;
      results.balance =
        results.balance === "Skipped"
          ? `Failed: ${overallError}`
          : results.balance;
      results.cashflow =
        results.cashflow === "Skipped"
          ? `Failed: ${overallError}`
          : results.cashflow;
    }
    return {
      symbol: symbolUpper,
      status: overallStatus,
      details: results,
      error: overallError, // Include error message if failed
    };
  });

  // Wait for all symbols to be processed
  const allResults = await Promise.all(populationPromises);

  const endTime = Date.now();
  console.log(`Population process finished in ${endTime - startTime}ms.`);

  // Summarize results
  const successCount = allResults.filter((r) => r.status === "Success").length;
  const failedCount = allResults.length - successCount;

  return NextResponse.json(
    {
      message: `Population attempt finished. Symbols processed: ${allResults.length}. Success: ${successCount}, Failed: ${failedCount}.`,
      durationMs: endTime - startTime,
      details: allResults,
    },
    { status: 200 }
  );
}
