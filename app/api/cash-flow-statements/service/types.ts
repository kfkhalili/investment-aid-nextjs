/* ──────────────────────────────────────────────────────────────────────
 * src/api/cash-flow-statements/service/types.ts
 * Type definitions and mappers for Cash Flow Statement data.
 * ---------------------------------------------------------------------*/
import { BaseDoc } from "@/api/common"; // Adjust import path as needed

// 1. Interface for Raw Data from FMP API
// Based on the provided example JSON structure
export interface RawCashFlowStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string | null; // Assuming potentially null based on other FMP patterns
  fillingDate: string;
  acceptedDate: string;
  calendarYear: string;
  period: string; // e.g., "FY", "Q1"
  netIncome: number;
  depreciationAndAmortization: number;
  deferredIncomeTax: number;
  stockBasedCompensation: number;
  changeInWorkingCapital: number;
  accountsReceivables: number;
  inventory: number;
  accountsPayables: number;
  otherWorkingCapital: number;
  otherNonCashItems: number;
  netCashProvidedByOperatingActivities: number;
  investmentsInPropertyPlantAndEquipment: number;
  acquisitionsNet: number;
  purchasesOfInvestments: number;
  salesMaturitiesOfInvestments: number;
  otherInvestingActivites: number;
  netCashUsedForInvestingActivites: number; // Note: API name uses "Activites"
  debtRepayment: number;
  commonStockIssued: number;
  commonStockRepurchased: number;
  dividendsPaid: number;
  otherFinancingActivites: number; // Note: API name uses "Activites"
  netCashUsedProvidedByFinancingActivities: number;
  effectOfForexChangesOnCash: number;
  netChangeInCash: number;
  cashAtEndOfPeriod: number;
  cashAtBeginningOfPeriod: number;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
  link: string | null; // Assuming potentially null
  finalLink: string | null; // Assuming potentially null
}

// 2. Interface for MongoDB Document Structure
// Extends BaseDoc to include _id, symbol, modifiedAt
export interface CashFlowStatementDoc extends BaseDoc {
  // Inherits _id (ObjectId), symbol (string), modifiedAt (Date)
  date: string; // Include key date field for potential sorting/uniqueness
  reportedCurrency: string;
  cik: string | null;
  fillingDate: string;
  acceptedDate: string;
  calendarYear: string;
  period: string;
  netIncome: number;
  depreciationAndAmortization: number;
  deferredIncomeTax: number;
  stockBasedCompensation: number;
  changeInWorkingCapital: number;
  accountsReceivables: number;
  inventory: number;
  accountsPayables: number;
  otherWorkingCapital: number;
  otherNonCashItems: number;
  netCashProvidedByOperatingActivities: number;
  investmentsInPropertyPlantAndEquipment: number;
  acquisitionsNet: number;
  purchasesOfInvestments: number;
  salesMaturitiesOfInvestments: number;
  otherInvestingActivites: number;
  netCashUsedForInvestingActivites: number;
  debtRepayment: number;
  commonStockIssued: number;
  commonStockRepurchased: number;
  dividendsPaid: number;
  otherFinancingActivites: number;
  netCashUsedProvidedByFinancingActivities: number;
  effectOfForexChangesOnCash: number;
  netChangeInCash: number;
  cashAtEndOfPeriod: number;
  cashAtBeginningOfPeriod: number;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
  link: string | null;
  finalLink: string | null;
}

// 3. Interface for API Response Shape (Conceptual Full Type)
// Defines the structure expected by GenericServiceConfig<..., ..., ApiType>.
// The actual service methods will return Partial<CashFlowStatement>.
// Omits DB-specific fields (_id as ObjectId, modifiedAt) and defines _id as string.
export interface CashFlowStatement
  extends Omit<CashFlowStatementDoc, "_id" | "modifiedAt"> {
  _id: string; // Required string ID for the conceptual full API type
}

// --- Mapping Function (Raw -> Doc Structure) ---

/**
 * Maps the raw FMP API data structure (RawCashFlowStatement) to the
 * structure needed for MongoDB storage (excluding _id and modifiedAt).
 * Applies defaults (0 for numbers, null for nullable strings) for potentially
 * missing fields using nullish coalescing.
 */
export const mapRawCashFlowStatementToDoc = (
  raw: RawCashFlowStatement
): Omit<CashFlowStatementDoc, "_id" | "modifiedAt"> => ({
  // Ensure all fields from DocType (except _id, modifiedAt, symbol [from BaseDoc]) are mapped
  date: raw.date,
  symbol: raw.symbol, // Map symbol from raw data
  reportedCurrency: raw.reportedCurrency,
  cik: raw.cik ?? null,
  fillingDate: raw.fillingDate,
  acceptedDate: raw.acceptedDate,
  calendarYear: raw.calendarYear,
  period: raw.period,
  // Use nullish coalescing (??) to default potentially missing numeric fields to 0
  netIncome: raw.netIncome ?? 0,
  depreciationAndAmortization: raw.depreciationAndAmortization ?? 0,
  deferredIncomeTax: raw.deferredIncomeTax ?? 0,
  stockBasedCompensation: raw.stockBasedCompensation ?? 0,
  changeInWorkingCapital: raw.changeInWorkingCapital ?? 0,
  accountsReceivables: raw.accountsReceivables ?? 0,
  inventory: raw.inventory ?? 0,
  accountsPayables: raw.accountsPayables ?? 0,
  otherWorkingCapital: raw.otherWorkingCapital ?? 0,
  otherNonCashItems: raw.otherNonCashItems ?? 0,
  netCashProvidedByOperatingActivities:
    raw.netCashProvidedByOperatingActivities ?? 0,
  investmentsInPropertyPlantAndEquipment:
    raw.investmentsInPropertyPlantAndEquipment ?? 0,
  acquisitionsNet: raw.acquisitionsNet ?? 0,
  purchasesOfInvestments: raw.purchasesOfInvestments ?? 0,
  salesMaturitiesOfInvestments: raw.salesMaturitiesOfInvestments ?? 0,
  otherInvestingActivites: raw.otherInvestingActivites ?? 0,
  netCashUsedForInvestingActivites: raw.netCashUsedForInvestingActivites ?? 0,
  debtRepayment: raw.debtRepayment ?? 0,
  commonStockIssued: raw.commonStockIssued ?? 0,
  commonStockRepurchased: raw.commonStockRepurchased ?? 0,
  dividendsPaid: raw.dividendsPaid ?? 0,
  otherFinancingActivites: raw.otherFinancingActivites ?? 0,
  netCashUsedProvidedByFinancingActivities:
    raw.netCashUsedProvidedByFinancingActivities ?? 0,
  effectOfForexChangesOnCash: raw.effectOfForexChangesOnCash ?? 0,
  netChangeInCash: raw.netChangeInCash ?? 0,
  cashAtEndOfPeriod: raw.cashAtEndOfPeriod ?? 0,
  cashAtBeginningOfPeriod: raw.cashAtBeginningOfPeriod ?? 0,
  operatingCashFlow: raw.operatingCashFlow ?? 0,
  capitalExpenditure: raw.capitalExpenditure ?? 0,
  freeCashFlow: raw.freeCashFlow ?? 0,
  link: raw.link ?? null,
  finalLink: raw.finalLink ?? null,
  // _id and modifiedAt are handled by the database/BaseDoc
});
