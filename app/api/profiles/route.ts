/* ──────────────────────────────────────────────────────────────────────
 * app/api/profile/route.ts
 * Handler for GET requests to /api/profile
 * Retrieves a list view of all company profiles.
 * ---------------------------------------------------------------------*/
import { NextResponse } from "next/server";

import { getAllProfiles } from "@/lib/services/profiles";
import type { Profile } from "@/lib/services/profiles";

/**
 * Handles GET requests to fetch a list of all company profiles.
 * Uses the underlying service which returns projected data based on configuration.
 */
export async function GET(): Promise<
  NextResponse<Partial<Profile>[] | { error: string }>
> {
  console.log("GET /api/profile called"); // Optional: Logging

  try {
    // Call the service function to get the data.
    // Service now returns Partial<Profile>[]
    const data: Partial<Profile>[] = await getAllProfiles();

    // Return the data as JSON response
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    // Log the error for server-side debugging
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching profile list:", errorMessage, error);

    // Return a generic error response to the client
    return NextResponse.json(
      { error: "Could not load profiles list." },
      { status: 500 } // Internal Server Error
    );
  }
}
