/* ──────────────────────────────────────────────────────────────────────
 * src/api/profile/service/constants.ts (Supabase Version)
 * Constants for the Profile service.
 * ---------------------------------------------------------------------*/

// Import the Profile API type definition (Supabase version)
import type { Profile } from "./types";

/** Cache Time-To-Live: How long fetched data is considered fresh before re-fetching. */
// Example: 24 hours (adjust as needed)
export const CACHE_TTL_MS = 1000 * 60 * 60 * 24;

// Define desired API response key order using keys from the Supabase 'Profile' type.
// Keys should match the Profile interface properties (likely snake_case from DB Row).
// The common service uses this array to both select DB columns (projection)
// and order/filter the final API response.
export const profileKeyOrder: ReadonlyArray<keyof Profile> = [
  // Start with ID and core identifiers
  "id", // Added by mapper (string)
  "symbol",

  // Key financial/trading data
  "price",
  "change", // Often shown together
  "change_percentage",
  "market_cap",
  "volume",
  "average_volume",
  "beta",
  "last_dividend",
  "range",

  // Company Information
  "company_name",
  "image", // Logo often useful early
  "sector",
  "industry",
  "website",
  "description", // Usually longer, maybe lower down
  "ceo",
  "full_time_employees",

  // Location / Contact
  "country",
  "address",
  "city",
  "state",
  "zip",
  "phone",

  // Exchange / Classification
  "exchange",
  "exchange_full_name",
  "currency",
  "ipo_date",
  "isin",
  "cusip",
  "cik",

  // Flags
  "is_actively_trading",
  "is_etf",
  "is_adr",
  "is_fund",
  "default_image",

  // 'created_at' and 'modified_at' from BaseRow are typically excluded by the mapper.
];
