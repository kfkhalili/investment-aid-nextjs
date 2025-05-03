/* ──────────────────────────────────────────────────────────────────────
 * src/api/profile/service/types.ts // <-- Updated path/purpose
 * Type definitions and mappers for Company Profile data.
 * ---------------------------------------------------------------------*/
import { BaseDoc } from "@/api/common/"; // Adjust import path as needed

// 1. Interface for Raw Data from FMP API
// Based on the provided example JSON structure for company profiles
export interface RawProfile {
  symbol: string;
  price: number | null; // Price can sometimes be null for delisted/new symbols
  marketCap: number | null;
  beta: number | null;
  lastDividend: number | null; // Use number | null for numeric fields that might be absent
  range: string | null;
  change: number | null;
  changePercentage: number | null;
  volume: number | null;
  averageVolume: number | null; // Renamed from avgVolume if API uses that
  companyName: string | null;
  currency: string | null;
  cik: string | null;
  isin: string | null;
  cusip: string | null;
  exchangeFullName: string | null;
  exchange: string | null;
  industry: string | null;
  website: string | null;
  description: string | null;
  ceo: string | null;
  sector: string | null;
  country: string | null;
  fullTimeEmployees: string | null; // API sends as string, handle conversion in mapper
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  image: string | null;
  ipoDate: string | null; // Keep as string
  defaultImage: boolean | null;
  isEtf: boolean | null;
  isActivelyTrading: boolean | null;
  isAdr: boolean | null;
  isFund: boolean | null;
}

// 2. Interface for MongoDB Document Structure
// Extends BaseDoc to include _id, symbol, modifiedAt
// Note: Profile data typically doesn't have a 'date' field like statements
export interface ProfileDoc extends BaseDoc {
  // Inherits _id (ObjectId), symbol (string), modifiedAt (Date)
  // Add fields specific to Profile data
  price: number | null;
  marketCap: number | null;
  beta: number | null;
  lastDividend: number | null;
  range: string | null;
  change: number | null;
  changePercentage: number | null;
  volume: number | null;
  averageVolume: number | null;
  companyName: string | null;
  currency: string | null;
  cik: string | null;
  isin: string | null;
  cusip: string | null;
  exchangeFullName: string | null;
  exchange: string | null;
  industry: string | null;
  website: string | null;
  description: string | null;
  ceo: string | null;
  sector: string | null;
  country: string | null;
  fullTimeEmployees: number | null; // Store as number in DB
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  image: string | null;
  ipoDate: string | null;
  defaultImage: boolean | null;
  isEtf: boolean | null;
  isActivelyTrading: boolean | null;
  isAdr: boolean | null;
  isFund: boolean | null;
}

// 3. Interface for API Response Shape (Conceptual Full Type)
// Defines the structure expected by GenericServiceConfig<..., ..., ApiType>.
// The actual service methods will return Partial<Profile>.
export interface Profile extends Omit<ProfileDoc, "_id" | "modifiedAt"> {
  _id: string; // Required string ID for the conceptual full API type
}

// --- Mapping Function (Raw -> Doc Structure) ---

/**
 * Maps the raw FMP API profile data structure to the structure needed for MongoDB storage
 * (excluding _id and modifiedAt). Handles type conversion (e.g., string employees to number)
 * and provides defaults for missing/null values.
 */
export const mapRawProfileToDoc = (
  raw: RawProfile
): Omit<ProfileDoc, "_id" | "modifiedAt"> => {
  // Helper function to safely parse employee string to number
  const parseEmployees = (employees: string | null): number | null => {
    if (employees === null || employees === undefined || employees === "") {
      return null;
    }
    const num = parseInt(employees, 10);
    return isNaN(num) ? null : num; // Return null if parsing fails
  };

  return {
    // Ensure all fields from ProfileDoc (except _id, modifiedAt) are mapped
    // symbol is inherited via BaseDoc but needs to be mapped from raw
    symbol: raw.symbol,
    // Use ?? null for potentially missing/null numbers/strings from API
    price: raw.price ?? null,
    marketCap: raw.marketCap ?? null,
    beta: raw.beta ?? null,
    lastDividend: raw.lastDividend ?? null,
    range: raw.range ?? null,
    change: raw.change ?? null,
    changePercentage: raw.changePercentage ?? null,
    volume: raw.volume ?? null,
    averageVolume: raw.averageVolume ?? null,
    companyName: raw.companyName ?? null,
    currency: raw.currency ?? null,
    cik: raw.cik ?? null,
    isin: raw.isin ?? null,
    cusip: raw.cusip ?? null,
    exchangeFullName: raw.exchangeFullName ?? null,
    exchange: raw.exchange ?? null,
    industry: raw.industry ?? null,
    website: raw.website ?? null,
    description: raw.description ?? null,
    ceo: raw.ceo ?? null,
    sector: raw.sector ?? null,
    country: raw.country ?? null,
    fullTimeEmployees: parseEmployees(raw.fullTimeEmployees), // Convert string to number
    phone: raw.phone ?? null,
    address: raw.address ?? null,
    city: raw.city ?? null,
    state: raw.state ?? null,
    zip: raw.zip ?? null,
    image: raw.image ?? null,
    ipoDate: raw.ipoDate ?? null,
    // Use ?? false for booleans if you prefer false over null, or ?? null if null is okay
    defaultImage: raw.defaultImage ?? false,
    isEtf: raw.isEtf ?? false,
    isActivelyTrading: raw.isActivelyTrading ?? true, // Default to true if potentially missing? Or false?
    isAdr: raw.isAdr ?? false,
    isFund: raw.isFund ?? false,
    // modifiedAt is added by the generic service
  };
};

// Note: No mapDocToApi function is defined here, as the common
// mapDocToPartialApi from common/service/mappers.ts will be used
// in the service configuration (config.ts).
