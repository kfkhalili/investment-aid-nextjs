/* ──────────────────────────────────────────────────────────────────────
 * src/api/profile/service/index.ts (Supabase Version)
 * Instantiates and exports the Supabase-based profile service methods.
 * ---------------------------------------------------------------------*/

// 1. Import the generic service creator function for SUPABASE
import { createGenericSupabaseService } from "@/api/common/supabase"; // Ensure this path is correct

// 2. Import the specific configuration for profiles (Supabase version)
import { profileConfig } from "./config";

// 3. Import specific types for Supabase (Raw, Row, and API types)
import type { Profile, ProfileRow, RawProfile } from "./types"; // Use ProfileRow, remove ProfileDoc

// --- Create the Profile Service Instance ---
// Instantiate the Supabase service with correct generic types
const profileService = createGenericSupabaseService<
  RawProfile, // Type for raw FMP data
  ProfileRow, // Type for the database row (from generated types)
  Profile // Conceptual API type (service returns Partial<Profile>)
>(profileConfig);

// --- Export Domain-Specific Service Methods ---

// Export 'getOne' as 'getProfile' (fetches single profile)
// Returns Promise<Partial<Profile> | null>
export const getProfile = profileService.getOne;

// Export 'getAll' as 'getAllProfiles' (fetches list of profiles)
// Returns Promise<Partial<Profile>[]>
export const getAllProfiles = profileService.getAll;

// Note: getCollection (MongoDB specific) is removed. Direct DB access uses the Supabase client directly if needed.

// --- Re-export Types ---
// Export types relevant for consumers using this service with Supabase
export type { Profile, ProfileRow };
