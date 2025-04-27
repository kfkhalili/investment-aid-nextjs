import { NextResponse } from "next/server";
import { getProfiles, mapProfileDocToProfile, Profile } from "./service";

export async function GET(): Promise<NextResponse<Profile[]>> {
  const docs = await getProfiles();
  return NextResponse.json(docs.map(mapProfileDocToProfile), {
    status: 200,
  });
}
