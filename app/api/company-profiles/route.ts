import { NextResponse } from "next/server";
import {
  getCompanyProfiles,
  mapCompanyProfileDocToCompanyProfile,
  CompanyProfile,
} from "./service";

export async function GET(): Promise<NextResponse<CompanyProfile[]>> {
  const docs = await getCompanyProfiles();
  return NextResponse.json(docs.map(mapCompanyProfileDocToCompanyProfile), {
    status: 200,
  });
}
