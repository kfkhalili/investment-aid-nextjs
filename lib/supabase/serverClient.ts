// /lib/supabase/serverClient.ts (example path)
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Import generated Database type (adjust path as needed)
// This provides strong typing for table/column names and query results.
import type { Database } from "./database.types";

// Module-level cache for the server-side Supabase client instance
let cachedSupabaseServerClient: SupabaseClient<Database> | null = null;

/**
 * Gets a singleton instance of the Supabase client configured for SERVER-SIDE
 * operations using the Service Role Key (elevated privileges).
 * Reads credentials from SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.
 * Includes generated database types for type safety.
 *
 * @returns {SupabaseClient<Database>} The Supabase client instance with database types.
 * @throws {Error} If Supabase environment variables are not set.
 */
export function getSupabaseServerClient(): SupabaseClient<Database> {
  if (cachedSupabaseServerClient) {
    // console.debug('Returning cached Supabase server client.'); // Optional
    return cachedSupabaseServerClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error(
      "Supabase URL or Service Role Key environment variable is not set."
    );
    throw new Error(
      "Supabase URL or Service Role Key environment variable is not set."
    );
  }

  console.log("Creating new server-side Supabase client instance.");

  // Create and cache the Supabase client using the Service Role Key.
  // Use generated types for DB interactions.
  // Auth options disable persistence for server-side usage.
  cachedSupabaseServerClient = createClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false, // Not relevant on server
      },
    }
  );

  return cachedSupabaseServerClient;
}
