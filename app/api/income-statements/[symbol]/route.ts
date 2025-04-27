// app/api/income-statements/[symbol]/route.ts
import { NextResponse } from "next/server";
import { getIncomeStatementsForSymbol } from "@/api/income-statements/service"; // adjust path

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const data = await getIncomeStatementsForSymbol(symbol.toUpperCase());
    return NextResponse.json(data);
  } catch (err) {
    console.error("income-statements error", err);
    return NextResponse.json(
      { error: "Could not load income statement" },
      { status: 500 }
    );
  }
}
