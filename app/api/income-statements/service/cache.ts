/* ──────────────────────────────────────────────────────────────────────
 * api/income-statements/service/cache.ts
 * ---------------------------------------------------------------------*/

import { ensureCollection } from "@/api/ensureCollection";
import { CACHE_TTL_MS } from "./constants";
import {
  IncomeStatementDoc,
  IncomeStatement,
  mapIncomeStatementDocToIncomeStatement,
} from "./types";
import { fetchAndUpsertIncomeStatements } from "./fetch";

/** Projection that’s handy for list / grid views */
const LIST_PROJECTION = {
  symbol: 1,
  revenue: 1,
  netIncome: 1,
  calendarYear: 1,
  period: 1,
  modifiedAt: 1,
} as const;

/** collection accessor (creates it + index once) */
async function incomeCol() {
  return ensureCollection<IncomeStatementDoc>("income_statements", {
    symbol: 1,
  });
}

/*────────────────────────  public API  ─────────────────────────*/

/** All filings in the DB (light projection, capped at 1 000) */
export async function getIncomeStatements(): Promise<IncomeStatementDoc[]> {
  const col = await incomeCol();

  return col.find({}, { projection: LIST_PROJECTION }).limit(1_000).toArray();
}

/** Latest filing for one symbol (auto-refreshes when stale) */
export async function getIncomeStatement(
  symbol: string
): Promise<IncomeStatement> {
  const col = await incomeCol();

  const latest = await col
    .find({ symbol })
    .sort({ date: -1 }) // newest filing first
    .limit(1)
    .next();

  const freshEnough =
    latest && Date.now() - latest.modifiedAt.getTime() < CACHE_TTL_MS;

  if (freshEnough) return mapIncomeStatementDocToIncomeStatement(latest);

  // pull fresh data (this will upsert every returned filing)
  return fetchAndUpsertIncomeStatements(symbol);
}

/** Every stored filing for the symbol (newest-first).
 *  Calls `getIncomeStatement` first so the cache is refreshed if stale. */
export async function getIncomeStatementsForSymbol(
  symbol: string
): Promise<IncomeStatement[]> {
  // ensure we have a fresh snapshot
  await getIncomeStatement(symbol);

  const col = await incomeCol();
  const docs = await col.find({ symbol }).sort({ date: -1 }).toArray();

  return docs.map(mapIncomeStatementDocToIncomeStatement);
}
