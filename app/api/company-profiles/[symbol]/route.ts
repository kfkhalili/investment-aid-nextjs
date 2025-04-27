import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCompanyProfile } from "../service/cache";

export async function GET(
  _req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const data = await getCompanyProfile(params.symbol.toUpperCase());
    return NextResponse.json(data);
  } catch (err) {
    console.error("company-profile error", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
