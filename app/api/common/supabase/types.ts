/* ──────────────────────────────────────────────────────────────────────
 * src/api/common/supabase/types.ts
 * Common type definitions for the generic Supabase service.
 * ---------------------------------------------------------------------*/

// FetchMode enum remains the same
export enum FetchMode {
  BySymbol = "bySymbol",
  FullCollection = "fullCollection",
}

// BaseRow interface remains the same
export interface BaseRow {
  id: string;
  symbol: string;
  modified_at: string;
  // created_at?: string;
}

// PartialApiRepresentation remains the same
export type PartialApiRepresentation<TRow extends BaseRow> = Partial<
  Omit<TRow, "id" | "modified_at" | "created_at">
> & {
  id?: string;
};

/**
 * Configuration object for the generic Supabase caching service.
 *
 * @template RawType The raw data structure received from the FMP API.
 * @template RowType The data structure (row) stored in the Supabase/Postgres table (must extend BaseRow).
 * @template ApiType The conceptual "full" data structure for API responses (service actually returns Partial<ApiType>).
 */
export interface GenericSupabaseServiceConfig<
  RawType,
  RowType extends BaseRow,
  ApiType extends { id?: string }
> {
  // --- Core Identification & Storage ---
  tableName: string;

  // --- FMP API Fetching ---
  fetchMode: FetchMode;
  fmpBasePath?: "v3" | "stable" | string; // Default: 'v3' used in service if omitted
  fmpPath: string;

  // --- ADD THIS PROPERTY ---
  /**
   * Specifies how the 'symbol' should be included in the FMP URL
   * when fetchMode is 'BySymbol'. Defaults to 'path' in the service if omitted.
   * - 'path': Append symbol to the path (e.g., /api/v3/income-statement/AAPL).
   * - 'param': Add symbol as a query parameter (e.g., /api/stable/profile?symbol=AAPL).
   */
  fmpSymbolLocation?: "path" | "param";
  // -----------------------

  fmpParams?: Record<string, string | number | boolean>;

  // --- Caching ---
  cacheTtlMs: number;

  // --- Data Structure, Uniqueness & Mapping ---
  uniqueKeyColumns: ReadonlyArray<keyof RowType>;
  mapRawToRow: (
    raw: RawType
  ) => Omit<RowType, "id" | "created_at" | "modified_at">;
  mapRowToApi: (row: RowType | Partial<RowType>) => Partial<ApiType>;
  apiFieldOrder?: ReadonlyArray<keyof ApiType>;

  // --- Behavior Modifiers ---
  isSingleRecordPerSymbol?: boolean;
  sortByFieldForLatest?: keyof RowType;

  // --- Optional Callbacks ---
  validateRawData?: (data: unknown) => data is RawType[] | RawType;
  processRawDataArray?: (rawData: RawType[]) => RawType[];
}
