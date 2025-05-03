import { BalanceSheetStatement } from "./types";

/** how long we trust a snapshot (1 week) */
export const CACHE_TTL_MS = 60 * 24 * 7 * 60 * 1_000;

/**
 * Defines the desired order and selection of keys for the Balance Sheet API response.
 * This will be used in config.ts for the 'apiFieldOrder' property.
 * Corresponds to the keys in the BalanceSheetStatement API type.
 */
export const balanceSheetKeyOrder: ReadonlyArray<keyof BalanceSheetStatement> =
  [
    "symbol",
    "date",
    "reportedCurrency",
    "cik",
    "fillingDate",
    "acceptedDate",
    "calendarYear",
    "period",
    "cashAndCashEquivalents",
    "shortTermInvestments",
    "cashAndShortTermInvestments",
    "netReceivables",
    "inventory",
    "otherCurrentAssets",
    "totalCurrentAssets",
    "propertyPlantEquipmentNet",
    "goodwill",
    "intangibleAssets",
    "goodwillAndIntangibleAssets",
    "longTermInvestments",
    "taxAssets",
    "otherNonCurrentAssets",
    "totalNonCurrentAssets",
    "otherAssets",
    "totalAssets",
    "accountPayables",
    "shortTermDebt",
    "taxPayables",
    "deferredRevenue",
    "otherCurrentLiabilities",
    "totalCurrentLiabilities",
    "longTermDebt",
    "deferredRevenueNonCurrent",
    "deferredTaxLiabilitiesNonCurrent",
    "otherNonCurrentLiabilities",
    "totalNonCurrentLiabilities",
    "otherLiabilities",
    "capitalLeaseObligations",
    "totalLiabilities",
    "preferredStock",
    "commonStock",
    "retainedEarnings",
    "accumulatedOtherComprehensiveIncomeLoss",
    "othertotalStockholdersEquity",
    "totalStockholdersEquity",
    "totalEquity",
    "totalLiabilitiesAndStockholdersEquity",
    "minorityInterest",
    "totalLiabilitiesAndTotalEquity",
    "totalInvestments",
    "totalDebt",
    "netDebt",
    "link",
    "finalLink",
  ];
