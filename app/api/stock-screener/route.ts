import { NextResponse } from "next/server";
import { getStockScreener, mapScreenerToUi, StockScreener } from "./service";

export async function GET(): Promise<NextResponse<StockScreener[]>> {
  const docs = await getStockScreener();
  return NextResponse.json(docs.map(mapScreenerToUi), { status: 200 });
}
