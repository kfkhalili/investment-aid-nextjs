import { NextResponse } from "next/server";
import {
  getIncomeStatements,
  mapIncomeStatementDocToIncomeStatement,
  IncomeStatement,
} from "./service";

export async function GET(): Promise<NextResponse<IncomeStatement[]>> {
  const docs = await getIncomeStatements();
  return NextResponse.json(docs.map(mapIncomeStatementDocToIncomeStatement), {
    status: 200,
  });
}
