/* ──────────────────────────────────────────────────────────────────────
 * src/api/common/supabase/genericService.ts
 * Implementation of the generic service creator function for Supabase/Postgres.
 * Uses apiFieldOrder config for both DB projection and API response shaping.
 * Uses fmpSymbolLocation config for FMP URL structure.
 * Includes explicit casts on Supabase calls to guide TS inference.
 * ---------------------------------------------------------------------*/
import { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
// Import the Supabase client getter you created
import { getSupabaseServerClient } from "@/lib/supabase/serverClient"; // Adjust path as needed
// Import common types and helpers for Supabase
import { BaseRow, GenericSupabaseServiceConfig, FetchMode } from "./types";
// Import the FILTERING version of the reordering helper
import { reorderAndFilterObjectKeys } from "./mappers"; // Adjust path if needed

// Helper function to safely get the FMP API key
function getFmpApiKey(): string {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    throw new Error("FMP_API_KEY environment variable is not set.");
  }
  return apiKey;
}

/**
 * Creates a generic service for fetching FMP data, caching in Supabase (Postgres), and retrieving it.
 */
export function createGenericSupabaseService<
  RawType,
  RowType extends BaseRow,
  // Constrain ApiType for keyof usage and structure compatibility (optional id)
  ApiType extends Record<string, unknown> & { id?: string }
>(config: GenericSupabaseServiceConfig<RawType, RowType, ApiType>) {
  // --- Config Destructuring & Defaults ---
  const {
    tableName,
    fetchMode,
    fmpBasePath = "v3", // Default base path
    fmpPath,
    fmpSymbolLocation = "path", // Default symbol location to path segment
    fmpParams = {},
    cacheTtlMs,
    uniqueKeyColumns,
    mapRawToRow,
    mapRowToApi, // This is the configured mapper function (e.g., mapRowToPartialApi)
    apiFieldOrder, // Optional array for projection, ordering, filtering
    isSingleRecordPerSymbol = fetchMode === FetchMode.BySymbol,
    sortByFieldForLatest, // Should be keyof RowType
    validateRawData,
    processRawDataArray,
  } = config;

  // --- Configuration Validation ---
  if (
    fetchMode === FetchMode.BySymbol &&
    !isSingleRecordPerSymbol &&
    !sortByFieldForLatest
  ) {
    throw new Error(
      `Config Error (${tableName}): sortByFieldForLatest must be provided when fetchMode='bySymbol' and !isSingleRecordPerSymbol.`
    );
  }
  if (!uniqueKeyColumns || uniqueKeyColumns.length === 0) {
    throw new Error(
      `Config Error (${tableName}): uniqueKeyColumns array cannot be empty.`
    );
  }
  // Migrations handle table/index creation

  // --- Supabase Client ---
  // Using Service Role Client to bypass RLS for service operations
  const supabase: SupabaseClient = getSupabaseServerClient();

  // --- Internal Helper to Apply Ordering & Filtering ---
  // Applies key ordering and filtering based on apiFieldOrder config
  function applyOrderAndFilter(data: Partial<ApiType>): Partial<ApiType>;
  function applyOrderAndFilter(data: Partial<ApiType>[]): Partial<ApiType>[];
  function applyOrderAndFilter(data: null): null;
  function applyOrderAndFilter(
    data: Partial<ApiType> | Partial<ApiType>[] | null
  ): Partial<ApiType> | Partial<ApiType>[] | null {
    if (!apiFieldOrder || !data) {
      // No order specified or no data
      return data;
    }
    if (Array.isArray(data)) {
      // Use the FILTERING helper on each item
      return data.map((item) =>
        reorderAndFilterObjectKeys(item, apiFieldOrder)
      );
    } else {
      // Use the FILTERING helper on the single item
      return reorderAndFilterObjectKeys(data, apiFieldOrder);
    }
  }

  // --- Internal Helper: Generate Supabase Select String ---
  // Creates the select string for Supabase queries based on apiFieldOrder
  function generateSelectString(order?: ReadonlyArray<keyof ApiType>): string {
    // Base fields potentially needed for mapping or caching logic, even if not in final API order
    const alwaysSelect: (keyof BaseRow)[] = ["id", "symbol", "modified_at"];
    if (!order || order.length === 0) {
      return "*"; // Select all columns if no specific field list provided
    }
    // Filter out non-string keys (e.g., symbols if ApiType uses them)
    const apiKeys = order.filter((k) => typeof k === "string") as string[];
    // Combine base fields and requested API fields, ensuring uniqueness
    // Assumes ApiType keys largely map to RowType column names
    const columnsToSelect = [...new Set([...alwaysSelect, ...apiKeys])];
    return columnsToSelect.join(", ");
  }

  // --- Internal Helper: Map Row(s) to API Shape and Apply Order/Filter ---
  // Consistently applies mapping and shaping before returning from service methods
  function mapAndShape(
    data: RowType | Partial<RowType> | null
  ): Partial<ApiType> | null;
  function mapAndShape(
    data: (RowType | Partial<RowType>)[]
  ): Partial<ApiType>[];
  function mapAndShape(
    data: (RowType | Partial<RowType>) | (RowType | Partial<RowType>)[] | null
  ): Partial<ApiType> | Partial<ApiType>[] | null {
    if (!data) return null;
    if (Array.isArray(data)) {
      // Use the mapper function provided in the config (e.g., mapRowToPartialApi)
      const mapped = data.map((row) => mapRowToApi(row));
      // Apply ordering and filtering based on apiFieldOrder config
      return applyOrderAndFilter(mapped);
    } else {
      // Handle single object
      const mapped = mapRowToApi(data);
      return applyOrderAndFilter(mapped);
    }
  }

  // --- Internal Fetch & Upsert Logic ---
  async function internalFetchAndUpsert(
    symbol?: string
  ): Promise<Partial<ApiType> | Partial<ApiType>[]> {
    // 1. Fetch from FMP API
    const apiKey = getFmpApiKey();
    const baseQueryParams = { ...fmpParams, apikey: apiKey };
    let actualUrl: string;
    let baseUrl: string;
    // Use configured base path, handle 'stable' exception
    if (fmpBasePath === "stable") {
      baseUrl = `https://financialmodelingprep.com/${fmpBasePath}/${fmpPath}`;
    } else {
      baseUrl = `https://financialmodelingprep.com/api/${fmpBasePath}/${fmpPath}`;
    }
    // Construct URL using configured symbol location
    if (fetchMode === FetchMode.BySymbol) {
      if (!symbol)
        throw new Error(`Workspace Error (${tableName}): Symbol required.`);
      if (fmpSymbolLocation === "param") {
        const queryParams = new URLSearchParams({
          ...baseQueryParams,
          symbol,
        }).toString();
        actualUrl = `${baseUrl}?${queryParams}`;
      } else {
        const queryParams = new URLSearchParams(baseQueryParams).toString();
        actualUrl = `${baseUrl}/${symbol}?${queryParams}`;
      }
    } else {
      const queryParams = new URLSearchParams(baseQueryParams).toString();
      actualUrl = `${baseUrl}?${queryParams}`;
    }
    console.log(
      `Workspaceing from FMP [${fetchMode}]: ${actualUrl.replace(
        apiKey,
        "***"
      )}`
    );
    const response = await fetch(actualUrl, { cache: "no-store" });
    // Handle FMP Response / Errors
    if (!response.ok) {
      let eBody = `(Status ${response.status})`;
      try {
        eBody = await response.text();
      } catch {}
      console.error(
        `FMP Error Body (${response.status}) for ${actualUrl.replace(
          apiKey,
          "***"
        )}: ${eBody}`
      );
      throw new Error(`FMP request failed (${response.status}).`);
    }
    const rawJsonData: unknown = await response.json();
    // Validate Raw Data
    if (validateRawData && !validateRawData(rawJsonData)) {
      console.error("Raw data validation failed:", rawJsonData);
      throw new Error(`Invalid data from FMP.`);
    }
    // Standardize to Array
    let rawArray: RawType[];
    if (Array.isArray(rawJsonData)) {
      rawArray = rawJsonData as RawType[];
    } else if (rawJsonData && typeof rawJsonData === "object") {
      rawArray = [rawJsonData as RawType];
    } else {
      throw new Error(`Unexpected raw data format from FMP.`);
    }
    // Process Array
    if (processRawDataArray) {
      try {
        rawArray = processRawDataArray(rawArray);
      } catch (e) {
        console.error(`Error processing raw data: ${e}`);
        throw e;
      }
    }
    if (rawArray.length === 0) {
      console.warn(
        `No data after processing from FMP for ${fetchMode}${
          symbol ? ` for ${symbol}` : ""
        }`
      );
      if (fetchMode === FetchMode.BySymbol)
        throw new Error(`No data found for symbol ${symbol}.`);
      return [];
    }

    // 2. Map Raw data to Rows for DB
    const now = new Date().toISOString();
    const rowsToUpsert = rawArray.map((raw) => {
      const mapped = mapRawToRow(raw); // Uses config.mapRawToRow
      // Asserting type after adding timestamp for upsert compatibility
      return { ...mapped, modified_at: now } as Omit<
        RowType,
        "id" | "created_at"
      >;
    });
    if (rowsToUpsert.length === 0) {
      console.warn(`No rows generated for upsert in ${tableName}`);
      return [];
    }

    // 3. Perform Supabase Upsert
    const conflictColumns = uniqueKeyColumns.join(",");
    const selectString = generateSelectString(apiFieldOrder); // Generate select based on config
    console.log(
      `Upserting ${rowsToUpsert.length} rows to ${tableName} on conflict (${conflictColumns}), selecting: ${selectString}`
    );

    // Apply explicit cast to the Supabase call result to fix type inference issues
    const { data: upsertedData, error: upsertError } = (await supabase
      .from(tableName)
      .upsert(rowsToUpsert, { onConflict: conflictColumns })
      .select(selectString)) as {
      data: RowType[] | null;
      error: PostgrestError | null;
    }; // Explicit Cast

    if (upsertError) {
      console.error(
        `Supabase upsert error on table ${tableName}:`,
        upsertError
      );
      throw new Error(
        `Database upsert failed: ${upsertError.message} (Code: ${upsertError.code})`
      );
    }
    if (!upsertedData) {
      console.warn(`Supabase upsert to ${tableName} returned null data.`);
      return [];
    } // Return empty if upsert returned null
    if (
      upsertedData.length !== rowsToUpsert.length &&
      fetchMode === FetchMode.FullCollection
    ) {
      console.warn(
        `Upsert returned ${upsertedData.length} rows, expected based on input ${rowsToUpsert.length}.`
      );
    }

    // 4. Map DB rows to API shape and apply final ordering/filtering
    const finalResult = mapAndShape(upsertedData); // Use helper, handles null/array

    // 5. Return single or array based on fetch mode and config
    if (fetchMode === FetchMode.BySymbol) {
      if (isSingleRecordPerSymbol) {
        return finalResult[0] ?? null; // Returns Partial<ApiType> | null
      } else {
        // History: return latest based on sort field
        if (!sortByFieldForLatest)
          throw new Error(
            "sortByFieldForLatest required for multi-record symbol fetch."
          );
        // Sort the final shaped results
        const sorted = [...finalResult].sort((a, b) => {
          const key = sortByFieldForLatest as keyof ApiType;
          const valA = a[key] ?? ""; // Use nullish coalescing for safer comparison
          const valB = b[key] ?? "";
          // Basic descending sort (adjust if numeric/date specific needed)
          if (valA < valB) return 1;
          if (valA > valB) return -1;
          return 0;
        });
        return sorted[0] ?? null; // Return latest Partial<ApiType> or null
      }
    } else {
      // FullCollection
      return finalResult; // Returns Partial<ApiType>[]
    }
  } // End of internalFetchAndUpsert

  // --- Service Method: Get Single/Latest Record by Symbol ---
  async function getOne(symbol: string): Promise<Partial<ApiType> | null> {
    const filter = { symbol: symbol };
    const selectString = generateSelectString(apiFieldOrder); // Generate select string

    if (fetchMode === FetchMode.FullCollection) {
      console.log(
        `getOne(${symbol}) reading table (${tableName}, fullCollection mode).`
      );
      // Add explicit cast
      const { data: doc, error } = (await supabase
        .from(tableName)
        .select(selectString)
        .match(filter)
        .maybeSingle()) as {
        data: RowType | null;
        error: PostgrestError | null;
      };

      if (error) {
        console.error(
          `Supabase error fetching single row [FullCollection]:`,
          error
        );
        throw new Error(`Database fetch failed: ${error.message}`);
      }
      return mapAndShape(doc); // mapAndShape handles null
    } else {
      // FetchMode.BySymbol (Caching Logic)
      // Select minimal fields needed for cache check
      const selectForCacheCheck = [
        ...new Set(["id", "symbol", "modified_at"]),
      ].join(",");
      const sortColumn = sortByFieldForLatest ?? "modified_at";

      // Find the most recently modified document matching the symbol for cache check
      // Add explicit cast
      const { data: latestDocInDb, error: findError } = (await supabase
        .from(tableName)
        .select(selectForCacheCheck)
        .match(filter)
        .order(sortColumn as string, { ascending: false })
        .limit(1)
        .maybeSingle()) as {
        data:
          | (Pick<RowType, "id" | "symbol" | "modified_at"> & Partial<RowType>)
          | null;
        error: PostgrestError | null;
      };

      if (findError) {
        console.error(
          `Supabase error finding latest in ${tableName}:`,
          findError
        );
        throw new Error(`Database find failed: ${findError.message}`);
      }

      const isFresh =
        latestDocInDb &&
        Date.now() - new Date(latestDocInDb.modified_at).getTime() < cacheTtlMs;

      if (isFresh) {
        console.log(`Cache hit for ${symbol} (${tableName})`);
        if (!latestDocInDb?.id) {
          console.error(`Cache hit for ${symbol}, but ID missing!`);
          throw new Error(`Cache inconsistency for ${symbol}.`);
        }

        // Fetch the specific fresh document again by ID using the full projection/selectString
        // Add explicit cast
        const { data: freshDoc, error: freshFindError } = (await supabase
          .from(tableName)
          .select(selectString)
          .match({ id: latestDocInDb.id })
          .single()) as { data: RowType | null; error: PostgrestError | null };

        if (freshFindError) {
          console.error(
            `Error fetching fresh doc by ID ${latestDocInDb.id} after cache hit ${tableName}:`,
            freshFindError
          );
          throw freshFindError;
        }
        return mapAndShape(freshDoc); // mapAndShape handles null
      } else {
        // Cache Miss or Stale
        console.log(
          `Cache ${
            latestDocInDb ? "stale" : "miss"
          } for ${symbol} (${tableName}). Fetching...`
        );
        try {
          const result = await internalFetchAndUpsert(symbol); // Already mapped/ordered/filtered
          if (Array.isArray(result))
            throw new Error(
              "Internal Error: Expected single result for BySymbol fetch."
            );
          return result; // Return the single Partial<ApiType> | null result
        } catch (fetchError) {
          const errorMessage =
            fetchError instanceof Error
              ? fetchError.message
              : String(fetchError);
          console.error(
            `Error fetching ${symbol} for ${tableName}: ${errorMessage}`
          );
          // Attempt to return stale data if available
          if (latestDocInDb?.id) {
            console.warn(
              `Returning stale data for ${symbol} (${tableName}) due to fetch error.`
            );
            // Fetch the specific stale doc by ID with the correct projection
            // Add explicit cast
            const { data: staleDoc, error: staleFindError } = (await supabase
              .from(tableName)
              .select(selectString)
              .match({ id: latestDocInDb.id })
              .single()) as {
              data: RowType | null;
              error: PostgrestError | null;
            };
            if (staleFindError) {
              console.error(
                `Error fetching stale doc by ID ${latestDocInDb.id} for ${tableName}:`,
                staleFindError
              );
              return null;
            }
            return mapAndShape(staleDoc); // mapAndShape handles null
          }
          // If fetch failed and no stale data, return null
          return null;
        }
      }
    }
  } // End of getOne

  // --- Service Method: Get All Records for a Specific Symbol (History) ---
  async function getAllForSymbol(symbol: string): Promise<Partial<ApiType>[]> {
    const filter = { symbol: symbol };
    const selectString = generateSelectString(apiFieldOrder);

    if (fetchMode === FetchMode.FullCollection) {
      console.warn(
        `getAllForSymbol called in fullCollection mode (${tableName}).`
      );
      // Add explicit cast
      const { data: doc, error } = (await supabase
        .from(tableName)
        .select(selectString)
        .match(filter)
        .maybeSingle()) as {
        data: RowType | null;
        error: PostgrestError | null;
      };
      if (error) {
        console.error(error);
        return [];
      }
      const shapedDoc = mapAndShape(doc);
      return shapedDoc ? [shapedDoc] : []; // Return single item array or empty
    } else {
      // FetchMode.BySymbol
      if (isSingleRecordPerSymbol) {
        const singleApiRecord = await getOne(symbol); // getOne already applies shaping
        return singleApiRecord ? [singleApiRecord] : [];
      } else {
        // Fetch history
        await getOne(symbol); // Ensure freshness of latest item
        const sortColumn = sortByFieldForLatest ?? "modified_at";
        if (!sortByFieldForLatest)
          console.warn(
            `getAllForSymbol (${tableName}): No sortByFieldForLatest specified.`
          );

        // Add explicit cast
        const { data: docs, error } = (await supabase
          .from(tableName)
          .select(selectString)
          .match(filter)
          .order(sortColumn as string, { ascending: false })) as {
          data: RowType[] | null;
          error: PostgrestError | null;
        };

        if (error) {
          console.error(error);
          throw error;
        } // Rethrow DB errors
        // Map and shape the array, handle null case from cast
        return mapAndShape(docs ?? []);
      }
    }
  } // End of getAllForSymbol

  // --- Service Method: Get All Records (List View / Full Collection Refresh Trigger) ---
  async function getAll(): Promise<Partial<ApiType>[]> {
    if (fetchMode === FetchMode.FullCollection) {
      // Add explicit cast for cache check
      const { data: latestDoc, error: latestError } = (await supabase
        .from(tableName)
        .select("modified_at")
        .order("modified_at", { ascending: false })
        .limit(1)
        .maybeSingle()) as {
        data: { modified_at: string } | null;
        error: PostgrestError | null;
      };

      if (latestError && latestError.code !== "PGRST116") {
        console.error(
          `Error fetching latest modified_at from ${tableName}:`,
          latestError
        );
        throw latestError;
      }
      const isFresh =
        latestDoc &&
        Date.now() - new Date(latestDoc.modified_at).getTime() < cacheTtlMs;

      if (!isFresh) {
        console.log(
          `Collection cache ${
            latestDoc ? "stale" : "miss"
          } for ${tableName}. Fetching...`
        );
        try {
          const freshData = await internalFetchAndUpsert(); // Already ordered/filtered/mapped
          if (!Array.isArray(freshData))
            throw new Error("Expected array result for FullCollection fetch.");
          return freshData;
        } catch (fetchError) {
          console.error(
            `Error fetching full collection ${tableName}: ${fetchError}`
          );
          return [];
        }
      } else {
        console.log(`Collection cache hit for ${tableName}.`);
        const selectString = generateSelectString(apiFieldOrder);
        // Add explicit cast
        const { data: docs, error } = (await supabase
          .from(tableName)
          .select(selectString)) as {
          data: RowType[] | null;
          error: PostgrestError | null;
        };
        if (error) {
          console.error(error);
          throw error;
        }
        return mapAndShape(docs ?? []); // Handle null from cast
      }
    } else {
      // FetchMode.BySymbol
      console.log(
        `getAll reading list for ${tableName} (bySymbol mode). Using apiFieldOrder for projection.`
      );
      const selectString = generateSelectString(apiFieldOrder);

      // Add explicit cast
      const { data: docs, error } = (await supabase
        .from(tableName)
        .select(selectString)
        .limit(1000)
        .order("symbol", { ascending: true })) as {
        data: RowType[] | null;
        error: PostgrestError | null;
      };

      if (error) {
        console.error(error);
        throw error;
      }
      // Map rows and apply final ordering/filtering. Input might be partial if selectString != '*'
      return mapAndShape((docs as Partial<RowType>[]) ?? []); // Handle null, cast input for mapAndShape
    }
  } // End of getAll

  // --- Return Public Service API ---
  // Exclude getCollection as it's MongoDB specific
  return { getAll, getOne, getAllForSymbol };
} // End of createGenericSupabaseService
