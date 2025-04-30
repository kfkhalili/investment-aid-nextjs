/* ──────────────────────────────────────────────────────────────────────
 * src/api/balance-sheet-statement/service/types.ts
 * ---------------------------------------------------------------------*/
import { BaseDoc } from "@/api/common/";

// 1. Interface for Raw Data from FMP API
// Based on the provided example JSON structure
export interface RawBalanceSheetStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string | null; // Assuming CIK can be null
  fillingDate: string;
  acceptedDate: string;
  calendarYear: string;
  period: string; // e.g., "FY", might include "Q1", "Q2" etc. if params change
  cashAndCashEquivalents: number;
  shortTermInvestments: number;
  cashAndShortTermInvestments: number;
  netReceivables: number;
  inventory: number;
  otherCurrentAssets: number;
  totalCurrentAssets: number;
  propertyPlantEquipmentNet: number;
  goodwill: number;
  intangibleAssets: number;
  goodwillAndIntangibleAssets: number;
  longTermInvestments: number;
  taxAssets: number;
  otherNonCurrentAssets: number;
  totalNonCurrentAssets: number;
  otherAssets: number;
  totalAssets: number;
  accountPayables: number;
  shortTermDebt: number;
  taxPayables: number;
  deferredRevenue: number;
  otherCurrentLiabilities: number;
  totalCurrentLiabilities: number;
  longTermDebt: number;
  deferredRevenueNonCurrent: number;
  deferredTaxLiabilitiesNonCurrent: number;
  otherNonCurrentLiabilities: number;
  totalNonCurrentLiabilities: number;
  otherLiabilities: number;
  capitalLeaseObligations?: number; // Marked optional as it might not always be present
  totalLiabilities: number;
  preferredStock: number;
  commonStock: number;
  retainedEarnings: number;
  accumulatedOtherComprehensiveIncomeLoss: number;
  othertotalStockholdersEquity: number;
  totalStockholdersEquity: number;
  totalEquity: number;
  totalLiabilitiesAndStockholdersEquity: number;
  minorityInterest: number;
  totalLiabilitiesAndTotalEquity: number;
  totalInvestments: number;
  totalDebt: number;
  netDebt: number;
  link: string | null; // Assuming links can be null
  finalLink: string | null;
}

// 2. Interface for MongoDB Document Structure
// Extends BaseDoc to include _id, symbol, modifiedAt
export interface BalanceSheetStatementDoc extends BaseDoc {
  // Inherits _id, symbol, modifiedAt
  date: string; // Ensure date is here, required by BaseDoc potentially via uniqueKeyFields
  reportedCurrency: string;
  cik: string | null;
  fillingDate: string;
  acceptedDate: string;
  calendarYear: string;
  period: string;
  cashAndCashEquivalents: number;
  shortTermInvestments: number;
  cashAndShortTermInvestments: number;
  netReceivables: number;
  inventory: number;
  otherCurrentAssets: number;
  totalCurrentAssets: number;
  propertyPlantEquipmentNet: number;
  goodwill: number;
  intangibleAssets: number;
  goodwillAndIntangibleAssets: number;
  longTermInvestments: number;
  taxAssets: number;
  otherNonCurrentAssets: number;
  totalNonCurrentAssets: number;
  otherAssets: number;
  totalAssets: number;
  accountPayables: number;
  shortTermDebt: number;
  taxPayables: number;
  deferredRevenue: number;
  otherCurrentLiabilities: number;
  totalCurrentLiabilities: number;
  longTermDebt: number;
  deferredRevenueNonCurrent: number;
  deferredTaxLiabilitiesNonCurrent: number;
  otherNonCurrentLiabilities: number;
  totalNonCurrentLiabilities: number;
  otherLiabilities: number;
  capitalLeaseObligations?: number;
  totalLiabilities: number;
  preferredStock: number;
  commonStock: number;
  retainedEarnings: number;
  accumulatedOtherComprehensiveIncomeLoss: number;
  othertotalStockholdersEquity: number;
  totalStockholdersEquity: number;
  totalEquity: number;
  totalLiabilitiesAndStockholdersEquity: number;
  minorityInterest: number;
  totalLiabilitiesAndTotalEquity: number;
  totalInvestments: number;
  totalDebt: number;
  netDebt: number;
  link: string | null;
  finalLink: string | null;
}

// 3. Interface for API Response Shape (if different from Doc)
// Often converts _id to string and might omit fields like modifiedAt
export interface BalanceSheetStatement
  extends Omit<BalanceSheetStatementDoc, "_id" | "modifiedAt"> {
  _id: string; // Override _id to be string type for API consumers
}

// --- Mapping Functions ---

/**
 * Maps the raw FMP API data structure to the structure needed for MongoDB storage
 * (excluding _id and modifiedAt, which are handled elsewhere).
 * Performs necessary type conversions (e.g., string to number if needed, though FMP often sends numbers).
 */
export const mapRawBalanceSheetToDoc = (
  raw: RawBalanceSheetStatement
): Omit<BalanceSheetStatementDoc, "_id" | "modifiedAt"> => ({
  // Ensure all fields from DocType (except _id, modifiedAt) are mapped
  date: raw.date,
  symbol: raw.symbol,
  reportedCurrency: raw.reportedCurrency,
  cik: raw.cik,
  fillingDate: raw.fillingDate,
  acceptedDate: raw.acceptedDate,
  calendarYear: raw.calendarYear,
  period: raw.period,
  // Assuming FMP provides numbers directly; add Number() conversion if they might be strings
  cashAndCashEquivalents: raw.cashAndCashEquivalents ?? 0,
  shortTermInvestments: raw.shortTermInvestments ?? 0,
  cashAndShortTermInvestments: raw.cashAndShortTermInvestments ?? 0,
  netReceivables: raw.netReceivables ?? 0,
  inventory: raw.inventory ?? 0,
  otherCurrentAssets: raw.otherCurrentAssets ?? 0,
  totalCurrentAssets: raw.totalCurrentAssets ?? 0,
  propertyPlantEquipmentNet: raw.propertyPlantEquipmentNet ?? 0,
  goodwill: raw.goodwill ?? 0,
  intangibleAssets: raw.intangibleAssets ?? 0,
  goodwillAndIntangibleAssets: raw.goodwillAndIntangibleAssets ?? 0,
  longTermInvestments: raw.longTermInvestments ?? 0,
  taxAssets: raw.taxAssets ?? 0,
  otherNonCurrentAssets: raw.otherNonCurrentAssets ?? 0,
  totalNonCurrentAssets: raw.totalNonCurrentAssets ?? 0,
  otherAssets: raw.otherAssets ?? 0,
  totalAssets: raw.totalAssets ?? 0,
  accountPayables: raw.accountPayables ?? 0,
  shortTermDebt: raw.shortTermDebt ?? 0,
  taxPayables: raw.taxPayables ?? 0,
  deferredRevenue: raw.deferredRevenue ?? 0,
  otherCurrentLiabilities: raw.otherCurrentLiabilities ?? 0,
  totalCurrentLiabilities: raw.totalCurrentLiabilities ?? 0,
  longTermDebt: raw.longTermDebt ?? 0,
  deferredRevenueNonCurrent: raw.deferredRevenueNonCurrent ?? 0,
  deferredTaxLiabilitiesNonCurrent: raw.deferredTaxLiabilitiesNonCurrent ?? 0,
  otherNonCurrentLiabilities: raw.otherNonCurrentLiabilities ?? 0,
  totalNonCurrentLiabilities: raw.totalNonCurrentLiabilities ?? 0,
  otherLiabilities: raw.otherLiabilities ?? 0,
  capitalLeaseObligations: raw.capitalLeaseObligations, // Keep optional possibly undefined
  totalLiabilities: raw.totalLiabilities ?? 0,
  preferredStock: raw.preferredStock ?? 0,
  commonStock: raw.commonStock ?? 0,
  retainedEarnings: raw.retainedEarnings ?? 0,
  accumulatedOtherComprehensiveIncomeLoss:
    raw.accumulatedOtherComprehensiveIncomeLoss ?? 0,
  othertotalStockholdersEquity: raw.othertotalStockholdersEquity ?? 0,
  totalStockholdersEquity: raw.totalStockholdersEquity ?? 0,
  totalEquity: raw.totalEquity ?? 0,
  totalLiabilitiesAndStockholdersEquity:
    raw.totalLiabilitiesAndStockholdersEquity ?? 0,
  minorityInterest: raw.minorityInterest ?? 0,
  totalLiabilitiesAndTotalEquity: raw.totalLiabilitiesAndTotalEquity ?? 0,
  totalInvestments: raw.totalInvestments ?? 0,
  totalDebt: raw.totalDebt ?? 0,
  netDebt: raw.netDebt ?? 0,
  link: raw.link,
  finalLink: raw.finalLink,
  // modifiedAt is added by the generic service
});

/**
 * Maps the MongoDB document structure (`BalanceSheetStatementDoc`) to the
 * API response shape (`BalanceSheetStatement`). Converts _id, omits modifiedAt.
 */
export const mapBalanceSheetDocToApi = (
  // Accept potentially partial doc if listProjection is used
  doc: BalanceSheetStatementDoc | Partial<BalanceSheetStatementDoc>
): BalanceSheetStatement => {
  // Handle potentially missing _id if doc is Partial
  const idString = doc._id ? doc._id.toHexString() : "";

  // Create the new object, explicitly selecting properties from doc
  // and skipping modifiedAt. Apply defaults for potentially missing fields.
  const apiObject: BalanceSheetStatement = {
    _id: idString,
    symbol: doc.symbol ?? "", // Use nullish coalescing for defaults
    date: doc.date ?? "",
    reportedCurrency: doc.reportedCurrency ?? "",
    cik: doc.cik ?? null,
    fillingDate: doc.fillingDate ?? "",
    acceptedDate: doc.acceptedDate ?? "",
    calendarYear: doc.calendarYear ?? "",
    period: doc.period ?? "",
    cashAndCashEquivalents: doc.cashAndCashEquivalents ?? 0,
    shortTermInvestments: doc.shortTermInvestments ?? 0,
    cashAndShortTermInvestments: doc.cashAndShortTermInvestments ?? 0,
    netReceivables: doc.netReceivables ?? 0,
    inventory: doc.inventory ?? 0,
    otherCurrentAssets: doc.otherCurrentAssets ?? 0,
    totalCurrentAssets: doc.totalCurrentAssets ?? 0,
    propertyPlantEquipmentNet: doc.propertyPlantEquipmentNet ?? 0,
    goodwill: doc.goodwill ?? 0,
    intangibleAssets: doc.intangibleAssets ?? 0,
    goodwillAndIntangibleAssets: doc.goodwillAndIntangibleAssets ?? 0,
    longTermInvestments: doc.longTermInvestments ?? 0,
    taxAssets: doc.taxAssets ?? 0,
    otherNonCurrentAssets: doc.otherNonCurrentAssets ?? 0,
    totalNonCurrentAssets: doc.totalNonCurrentAssets ?? 0,
    otherAssets: doc.otherAssets ?? 0,
    totalAssets: doc.totalAssets ?? 0,
    accountPayables: doc.accountPayables ?? 0,
    shortTermDebt: doc.shortTermDebt ?? 0,
    taxPayables: doc.taxPayables ?? 0,
    deferredRevenue: doc.deferredRevenue ?? 0,
    otherCurrentLiabilities: doc.otherCurrentLiabilities ?? 0,
    totalCurrentLiabilities: doc.totalCurrentLiabilities ?? 0,
    longTermDebt: doc.longTermDebt ?? 0,
    deferredRevenueNonCurrent: doc.deferredRevenueNonCurrent ?? 0,
    deferredTaxLiabilitiesNonCurrent: doc.deferredTaxLiabilitiesNonCurrent ?? 0,
    otherNonCurrentLiabilities: doc.otherNonCurrentLiabilities ?? 0,
    totalNonCurrentLiabilities: doc.totalNonCurrentLiabilities ?? 0,
    otherLiabilities: doc.otherLiabilities ?? 0,
    capitalLeaseObligations: doc.capitalLeaseObligations, // Keep optional field as is
    totalLiabilities: doc.totalLiabilities ?? 0,
    preferredStock: doc.preferredStock ?? 0,
    commonStock: doc.commonStock ?? 0,
    retainedEarnings: doc.retainedEarnings ?? 0,
    accumulatedOtherComprehensiveIncomeLoss:
      doc.accumulatedOtherComprehensiveIncomeLoss ?? 0,
    othertotalStockholdersEquity: doc.othertotalStockholdersEquity ?? 0,
    totalStockholdersEquity: doc.totalStockholdersEquity ?? 0,
    totalEquity: doc.totalEquity ?? 0,
    totalLiabilitiesAndStockholdersEquity:
      doc.totalLiabilitiesAndStockholdersEquity ?? 0,
    minorityInterest: doc.minorityInterest ?? 0,
    totalLiabilitiesAndTotalEquity: doc.totalLiabilitiesAndTotalEquity ?? 0,
    totalInvestments: doc.totalInvestments ?? 0,
    totalDebt: doc.totalDebt ?? 0,
    netDebt: doc.netDebt ?? 0,
    link: doc.link ?? null,
    finalLink: doc.finalLink ?? null,
    // Note: modifiedAt is intentionally omitted
  };

  return apiObject;
};
