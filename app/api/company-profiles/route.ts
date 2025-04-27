import { NextResponse } from "next/server";
import { getCompanyProfiles, mapProfileToCompany, Company } from "./service";

export async function GET(): Promise<NextResponse<Company[]>> {
  const docs = await getCompanyProfiles();
  return NextResponse.json(docs.map(mapProfileToCompany), { status: 200 });
}
