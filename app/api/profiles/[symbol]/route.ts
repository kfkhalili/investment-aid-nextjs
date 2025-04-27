// app/api/profiles/[symbol]/route.ts
import { NextResponse } from "next/server";
import { getProfile } from "@/api/profiles/service"; // adjust path

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const data = await getProfile(symbol.toUpperCase());
    return NextResponse.json(data);
  } catch (err) {
    console.error("company-profile error", err);
    return NextResponse.json(
      { error: "Could not load company profile" },
      { status: 500 }
    );
  }
}
