// app/api/income-statements/service/fetch.ts
import { ensureCollection } from "@/api/ensureCollection";
import {
  IncomeStatementDoc,
  IncomeStatement,
  mapIncomeStatementDocToIncomeStatement,
} from "./types";

export interface RawIncomeStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string | null;
  fillingDate: string;
  acceptedDate: string;
  calendarYear: string;
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
}

const URL = (s: string) =>
  `https://financialmodelingprep.com/api/v3/income-statement/${s}?period=annual&apikey=${process
    .env.FMP_API_KEY!}`;

export async function fetchAndUpsertIncomeStatements(
  symbol: string
): Promise<IncomeStatement> {
  /* 1 . grab every filing FMP has for this symbol */
  const raws = (await fetch(URL(symbol), { cache: "no-store" }).then((r) =>
    r.json()
  )) as RawIncomeStatement[];

  if (!raws.length) throw new Error(`Income statement not found for ${symbol}`);

  /* 2 . convert each row into a Mongo-shaped document (no _id, Mongo adds it) */
  const replacements: Omit<IncomeStatementDoc, "_id">[] = raws.map((raw) => ({
    date: raw.date,
    symbol: raw.symbol,
    reportedCurrency: raw.reportedCurrency,
    cik: raw.cik,
    fillingDate: raw.fillingDate,
    acceptedDate: raw.acceptedDate,
    calendarYear: raw.calendarYear,
    period: raw.period,
    revenue: Number(raw.revenue),
    costOfRevenue: Number(raw.costOfRevenue),
    grossProfit: Number(raw.grossProfit),
    grossProfitRatio: Number(raw.grossProfitRatio),
    researchAndDevelopmentExpenses: Number(raw.researchAndDevelopmentExpenses),
    generalAndAdministrativeExpenses: Number(
      raw.generalAndAdministrativeExpenses
    ),
    sellingAndMarketingExpenses: Number(raw.sellingAndMarketingExpenses),
    sellingGeneralAndAdministrativeExpenses: Number(
      raw.sellingGeneralAndAdministrativeExpenses
    ),
    otherExpenses: Number(raw.otherExpenses),
    operatingExpenses: Number(raw.operatingExpenses),
    costAndExpenses: Number(raw.costAndExpenses),
    interestIncome: Number(raw.interestIncome),
    interestExpense: Number(raw.interestExpense),
    depreciationAndAmortization: Number(raw.depreciationAndAmortization),
    ebitda: Number(raw.ebitda),
    ebitdaratio: Number(raw.ebitdaratio),
    operatingIncome: Number(raw.operatingIncome),
    operatingIncomeRatio: Number(raw.operatingIncomeRatio),
    totalOtherIncomeExpensesNet: Number(raw.totalOtherIncomeExpensesNet),
    incomeBeforeTax: Number(raw.incomeBeforeTax),
    incomeBeforeTaxRatio: Number(raw.incomeBeforeTaxRatio),
    incomeTaxExpense: Number(raw.incomeTaxExpense),
    netIncome: Number(raw.netIncome),
    netIncomeRatio: Number(raw.netIncomeRatio),
    eps: Number(raw.eps),
    epsdiluted: Number(raw.epsdiluted),
    weightedAverageShsOut: Number(raw.weightedAverageShsOut),
    weightedAverageShsOutDil: Number(raw.weightedAverageShsOutDil),
    link: raw.link,
    finalLink: raw.finalLink,
    modifiedAt: new Date(),
  }));

  /* 3 . bulk-upsert (key = symbol + date) */
  const col = await ensureCollection<IncomeStatementDoc>("income_statements", {
    symbol: 1,
    date: 1, // unique pair
  });

  const bulk = col.initializeUnorderedBulkOp();
  for (const rep of replacements) {
    bulk.find({ symbol: rep.symbol, date: rep.date }).upsert().replaceOne(rep);
  }
  await bulk.execute();

  /* 4 . return the **latest** statement to the caller */
  const latest = await col.find({ symbol }).sort({ date: -1 }).limit(1).next();

  return mapIncomeStatementDocToIncomeStatement(latest!);
}
