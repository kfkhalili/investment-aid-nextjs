/* ──────────────────────────────────────────────────────────────────────
 * src/api/profile/service/index.ts
 * Instantiates and exports the profile service methods.
 * ---------------------------------------------------------------------*/

// 1. Import the generic service creator function
import { createGenericService } from "@/api/common";

// 2. Import the specific configuration for profiles
import { profileConfig } from "./config";

// 3. Import specific types (optional, but good for re-export)
import type { Profile, ProfileDoc } from "./types";

// --- Create the Profile Service Instance ---
const profileService = createGenericService(profileConfig);

// --- Export Domain-Specific Service Methods ---

// Export 'getOne' as 'getProfile'
export const getProfile = profileService.getOne;

// Export 'getAll' as 'getAllProfiles' - needed for the list route
export const getAllProfiles = profileService.getAll;

// --- Re-export Types ---
export type { Profile, ProfileDoc };
