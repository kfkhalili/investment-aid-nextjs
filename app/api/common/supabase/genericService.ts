/* ──────────────────────────────────────────────────────────────────────
 * src/api/common/supabase/genericService.ts
 * Implementation of the generic service creator function for Supabase/Postgres.
 * Uses apiFieldOrder config for DB projection and API response shaping.
 * Uses fmpSymbolLocation config for FMP URL structure.
 * ---------------------------------------------------------------------*/
import { SupabaseClient, PostgrestError } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient"; // Adjust path as needed
import { BaseRow, GenericSupabaseServiceConfig, FetchMode } from "./types";
import { reorderAndFilterObjectKeys } from "./mappers";

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
  ApiType extends { id?: string }
>(config: GenericSupabaseServiceConfig<RawType, RowType, ApiType>) {
  // --- Config Destructuring & Defaults ---
  const {
    tableName,
    fetchMode,
    fmpBasePath = "v3", // Default base path
    fmpPath,
    fmpSymbolLocation = "path", // Default symbol location
    fmpParams = {},
    cacheTtlMs,
    uniqueKeyColumns,
    mapRawToRow,
    mapRowToApi, // Configured mapper (e.g., mapRowToPartialApi)
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

  // --- Supabase Client ---
  const supabase: SupabaseClient = getSupabaseServerClient(); // Using Service Role Client

  // --- Internal Helper to Apply Ordering & Filtering ---
  function applyOrderAndFilter(data: Partial<ApiType>): Partial<ApiType>;
  function applyOrderAndFilter(data: Partial<ApiType>[]): Partial<ApiType>[];
  function applyOrderAndFilter(data: null): null;
  function applyOrderAndFilter(
    data: Partial<ApiType> | Partial<ApiType>[] | null
  ): Partial<ApiType> | Partial<ApiType>[] | null {
    if (!apiFieldOrder || !data) {
      return data;
    }
    if (Array.isArray(data)) {
      return data.map((item) =>
        reorderAndFilterObjectKeys(item, apiFieldOrder)
      );
    } else {
      return reorderAndFilterObjectKeys(data, apiFieldOrder);
    }
  }

  // --- Internal Helper: Generate Supabase Select String ---
  function generateSelectString(order?: ReadonlyArray<keyof ApiType>): string {
    // Always select base fields needed internally if filtering, otherwise '*'
    const alwaysSelect: (keyof BaseRow)[] = ["id", "symbol", "modified_at"];
    if (!order || order.length === 0) {
      return "*";
    } // Select all if no specific filter/order needed
    const apiKeys = order.filter((k) => typeof k === "string") as string[];
    // Combine always needed fields with requested API fields, ensure uniqueness
    const columnsToSelect = [...new Set([...alwaysSelect, ...apiKeys])];
    return columnsToSelect.join(", ");
  }

  // --- Internal Helper: Map Row(s) to API Shape and Apply Order/Filter ---
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
    // Determine if input is array or single object
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

    // --- Corrected URL Construction ---
    let baseUrl: string;
    if (fmpBasePath === "stable") {
      // Check configured base path
      baseUrl = `https://financialmodelingprep.com/${fmpBasePath}/${fmpPath}`;
    } else {
      baseUrl = `https://financialmodelingprep.com/api/${fmpBasePath}/${fmpPath}`;
    }

    if (fetchMode === FetchMode.BySymbol) {
      if (!symbol)
        throw new Error(`Fetch Error (${tableName}): Symbol required.`);
      // Use the configured fmpSymbolLocation from config
      if (fmpSymbolLocation === "param") {
        const queryParams = new URLSearchParams({
          ...baseQueryParams,
          symbol,
        }).toString();
        actualUrl = `${baseUrl}?${queryParams}`;
      } else {
        // 'path' or default
        const queryParams = new URLSearchParams(baseQueryParams).toString();
        actualUrl = `${baseUrl}/${symbol}?${queryParams}`;
      }
    } else {
      // FullCollection
      const queryParams = new URLSearchParams(baseQueryParams).toString();
      actualUrl = `${baseUrl}?${queryParams}`;
    }
    // --- End URL Construction ---

    console.log(
      `Fetching from FMP [${fetchMode}]: ${actualUrl.replace(apiKey, "***")}`
    );
    const response = await fetch(actualUrl, { cache: "no-store" });
    // ... (Response handling, validation, data processing - simplified for brevity) ...
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
    if (validateRawData && !validateRawData(rawJsonData)) {
      console.error("Raw data validation failed:", rawJsonData);
      throw new Error(`Invalid data from FMP.`);
    }
    let rawArray: RawType[];
    if (Array.isArray(rawJsonData)) {
      rawArray = rawJsonData as RawType[];
    } else if (rawJsonData && typeof rawJsonData === "object") {
      rawArray = [rawJsonData as RawType];
    } else {
      throw new Error(`Unexpected raw data format from FMP.`);
    }
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
      // Asserting the type after adding modified_at before upsert
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
    const selectString = generateSelectString(apiFieldOrder);
    console.log(
      `Upserting ${rowsToUpsert.length} rows to ${tableName} on conflict (${conflictColumns}), selecting: ${selectString}`
    );

    // Apply explicit cast to the Supabase call result
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
    } // Return empty array on null
    if (
      upsertedData.length !== rowsToUpsert.length &&
      fetchMode === FetchMode.FullCollection
    ) {
      console.warn(
        `Upsert returned ${upsertedData.length} rows, expected based on input ${rowsToUpsert.length}.`
      );
    }

    // 4. Map DB rows to API shape and apply final ordering/filtering
    // Type assertion no longer needed here due to cast above
    const finalResult = mapAndShape(upsertedData);

    // 5. Return single or array based on fetch mode and config
    if (fetchMode === FetchMode.BySymbol) {
      if (isSingleRecordPerSymbol) {
        return finalResult[0] ?? null; // Return single item or null
      } else {
        // History: return latest based on sort field
        if (!sortByFieldForLatest)
          throw new Error("sortByFieldForLatest required.");
        // Sort the final shaped results
        const sorted = [...finalResult].sort((a, b) => {
          const key = sortByFieldForLatest as keyof ApiType;
          // Basic sort (assumes sortable values like dates or numbers)
          const valA = a[key] ?? ""; // Handle potential undefined
          const valB = b[key] ?? "";
          if (valA < valB) return 1;
          if (valA > valB) return -1;
          return 0;
        });
        return sorted[0] ?? null; // Return latest or null
      }
    } else {
      // FullCollection
      return finalResult;
    }
  } // End of internalFetchAndUpsert

  // --- Service Method: Get Single/Latest Record by Symbol ---
  async function getOne(symbol: string): Promise<Partial<ApiType> | null> {
    const filter = { symbol: symbol };
    const selectString = generateSelectString(apiFieldOrder);

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
      const selectForCacheCheck = [
        ...new Set(["id", "symbol", "modified_at"]),
      ].join(",");
      const sortColumn = sortByFieldForLatest ?? "modified_at";

      // Add explicit cast (adjust expected type based on selectForCacheCheck)
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
        // Fetch again with the *correct* projection based on apiFieldOrder
        // Add explicit cast
        const { data: freshDoc, error: freshFindError } = (await supabase
          .from(tableName)
          .select(selectString)
          .match(filter)
          .maybeSingle()) as {
          data: RowType | null;
          error: PostgrestError | null;
        };

        if (freshFindError) {
          console.error(
            `Error fetching fresh doc after cache hit ${tableName}:`,
            freshFindError
          );
          throw freshFindError;
        }
        return mapAndShape(freshDoc); // mapAndShape handles null
      } else {
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
          return result;
        } catch (fetchError) {
          const errorMessage =
            fetchError instanceof Error
              ? fetchError.message
              : String(fetchError);
          console.error(
            `Error fetching ${symbol} for ${tableName}: ${errorMessage}`
          );
          if (latestDocInDb) {
            console.warn(
              `Returning stale data for ${symbol} (${tableName}) due to fetch error.`
            );
            // Fetch stale doc with correct projection
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
                `Error fetching stale doc ${tableName}:`,
                staleFindError
              );
              return null;
            }
            return mapAndShape(staleDoc); // mapAndShape handles null
          }
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
      return shapedDoc ? [shapedDoc] : [];
    } else {
      // FetchMode.BySymbol
      if (isSingleRecordPerSymbol) {
        const singleApiRecord = await getOne(symbol); // getOne already applies shaping
        return singleApiRecord ? [singleApiRecord] : [];
      } else {
        await getOne(symbol); // Ensure freshness
        const sortColumn = sortByFieldForLatest ?? "modified_at";
        if (!sortByFieldForLatest)
          console.warn(
            `getAllForSymbol (${tableName}): No sortByFieldForLatest.`
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
        }
        // mapAndShape handles null/undefined array case implicitly if we pass docs ?? []
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
        console.error(latestError);
        throw latestError;
      }
      const isFresh =
        latestDoc &&
        Date.now() - new Date(latestDoc.modified_at).getTime() < cacheTtlMs;

      if (!isFresh) {
        /* ... fetch logic calling internalFetchAndUpsert ... */
        try {
          const freshData = await internalFetchAndUpsert();
          if (!Array.isArray(freshData))
            throw new Error("Expected array result.");
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
        return mapAndShape(docs ?? []); // Handle potential null from cast
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
      // Map potentially partial rows and apply final ordering/filtering
      // Cast input as Partial needed because select string might not be '*'
      return mapAndShape((docs as Partial<RowType>[]) ?? []); // Handle null, cast input
    }
  } // End of getAll

  // --- Return Public Service API ---
  return { getAll, getOne, getAllForSymbol }; // Exclude getCollection
} // End of createGenericSupabaseService
