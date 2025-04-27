// api/income-statements/service/types.ts
import { ObjectId } from "mongodb";

export interface IncomeStatementDoc {
  _id: ObjectId;
  date: string; // “2024-09-28”
  symbol: string; // “AAPL”
  reportedCurrency: string; // “USD”
  cik: string | null;
  fillingDate: string; // “2024-11-01”
  acceptedDate: string; // “2024-11-01 06:01:36”
  calendarYear: string; // “2024”
  period: "Q1" | "Q2" | "Q3" | "Q4" | "FY";
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  grossProfitRatio: number;
  researchAndDevelopmentExpenses: number;
  generalAndAdministrativeExpenses: number;
  sellingAndMarketingExpenses: number;
  sellingGeneralAndAdministrativeExpenses: number;
  otherExpenses: number;
  operatingExpenses: number;
  costAndExpenses: number;
  interestIncome: number;
  interestExpense: number;
  depreciationAndAmortization: number;
  ebitda: number;
  ebitdaratio: number;
  operatingIncome: number;
  operatingIncomeRatio: number;
  totalOtherIncomeExpensesNet: number;
  incomeBeforeTax: number;
  incomeBeforeTaxRatio: number;
  incomeTaxExpense: number;
  netIncome: number;
  netIncomeRatio: number;
  eps: number;
  epsdiluted: number;
  weightedAverageShsOut: number;
  weightedAverageShsOutDil: number;
  link: string;
  finalLink: string;
  modifiedAt: Date;
}

export interface IncomeStatement extends Omit<IncomeStatementDoc, "_id"> {
  _id: string;
}

export const mapIncomeStatementDocToIncomeStatement = (
  d: IncomeStatementDoc
): IncomeStatement => ({
  ...d,
  _id: d._id.toHexString(),
});
