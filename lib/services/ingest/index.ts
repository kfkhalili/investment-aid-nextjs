// lib/services/ingest/index.ts

/**
 * This barrel file re-exports the primary functions and types
 * related to data ingestion services.
 */

// Re-export functions and types from the main symbol data ingestion service
// Assuming the content of 'fetch-all-data/service.ts' is now effectively
// in 'lib/services/ingest/service.ts' or a similarly named file within this module.
export {
  processSymbolData,
  fetchAllSymbols,
  type SymbolProcessingResult, // Exporting type used by the route
  type SymbolResultDetails, // Exporting type used within SymbolProcessingResult
} from "./service"; // This path assumes 'service.ts' is in the same 'ingest' directory

// Re-export the earnings calendar fetching function
// This assumes getEarningsCalendar is exported from '@lib/services/earnings-calendar'
// (e.g., from lib/services/earnings-calendar/index.ts or lib/services/earnings-calendar.ts)
export { getEarningsCalendar } from "../earnings-calendar";
