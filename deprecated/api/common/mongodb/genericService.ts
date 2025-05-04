/* ──────────────────────────────────────────────────────────────────────
 * src/api/common/service/genericService.ts
 * Implementation of the generic service creator function.
 * Uses apiFieldOrder config for both DB projection and API response shaping.
 * ---------------------------------------------------------------------*/
import {
  Collection,
  Filter,
  Sort,
  Document as MongoDocument,
  FindOptions,
} from "mongodb";
import { ensureCollection } from "@/lib/mongodb/ensureCollection"; // Adjust path as needed
import { BaseDoc, GenericServiceConfig, FetchMode } from "./types";
// Import the FILTERING version of the reordering helper
import { reorderAndFilterObjectKeys } from "./mappers"; // Adjust path if needed (e.g. ./mappers)

// Helper function to safely get the API key from environment variables
function getFmpApiKey(): string {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    throw new Error("FMP_API_KEY environment variable is not set.");
  }
  return apiKey;
}

/**
 * Creates a generic service for fetching, caching (in MongoDB), and retrieving financial data from FMP.
 * Adapts behavior based on configuration.
 * Uses `apiFieldOrder` (if provided) to generate DB projection and filter/order API response fields.
 */
export function createGenericService<
  RawType,
  DocType extends BaseDoc & MongoDocument,
  ApiType
>(config: GenericServiceConfig<RawType, DocType, ApiType>) {
  // --- Config Destructuring & Defaults ---
  const {
    collectionName,
    collectionIndexes,
    fetchMode,
    fmpBasePath = "v3",
    fmpPath,
    fmpParams = {},
    cacheTtlMs,
    uniqueKeyFields,
    mapRawToDoc,
    mapDocToApi,
    apiFieldOrder, // Use this for projection AND ordering/filtering
    isSingleRecordPerSymbol = fetchMode === FetchMode.BySymbol,
    sortByFieldForLatest,
    validateRawData,
    processRawDataArray,
  } = config;

  // --- Configuration Validation ---
  // (Keep existing validation logic)
  if (
    fetchMode === FetchMode.BySymbol &&
    !isSingleRecordPerSymbol &&
    !sortByFieldForLatest
  ) {
    throw new Error(
      `Config Error (${collectionName}): sortByFieldForLatest must be provided when fetchMode='bySymbol' and isSingleRecordPerSymbol=false.`
    );
  }
  if (!uniqueKeyFields || uniqueKeyFields.length === 0) {
    throw new Error(
      `Config Error (${collectionName}): uniqueKeyFields array cannot be empty.`
    );
  }
  if (!uniqueKeyFields.includes("symbol")) {
    console.warn(
      `Config Warning (${collectionName}): uniqueKeyFields does not explicitly include 'symbol'. This might cause issues with 'getOne' or 'getAllForSymbol'.`
    );
  }

  // --- Collection Access (Memoized Promise) ---
  // (Keep existing getCollection logic)
  let _collectionPromise: Promise<Collection<DocType>> | null = null;
  function getCollection(): Promise<Collection<DocType>> {
    if (!_collectionPromise) {
      _collectionPromise = ensureCollection<DocType>(
        collectionName,
        ...collectionIndexes
      ).catch((err) => {
        _collectionPromise = null;
        console.error(`Failed to ensure collection ${collectionName}:`, err);
        throw err;
      });
    }
    return _collectionPromise;
  }

  // --- Helper: Build Unique Key Filter (Type-Safe) ---
  // (Keep existing buildKeyFilter logic)
  function buildKeyFilter(
    docData: Omit<DocType, "_id" | "modifiedAt"> | DocType
  ): Filter<DocType> {
    const filter: Filter<DocType> = {};
    for (const key of uniqueKeyFields) {
      const value = (docData as Record<keyof DocType, unknown>)[key];
      if (value === undefined) {
        throw new Error(
          `Config Error (${collectionName}): Value for unique key field '${String(
            key
          )}' is undefined in provided data.`
        );
      }
      filter[key as keyof Filter<DocType>] = value;
    }
    return filter;
  }

  // --- Internal Helper to Apply Ordering & Filtering ---
  // Renamed to reflect filtering action
  function applyOrderAndFilter(data: Partial<ApiType>): Partial<ApiType>;
  function applyOrderAndFilter(data: Partial<ApiType>[]): Partial<ApiType>[];
  function applyOrderAndFilter(data: null): null;
  function applyOrderAndFilter(
    data: Partial<ApiType> | Partial<ApiType>[] | null
  ): Partial<ApiType> | Partial<ApiType>[] | null {
    // Only reorder/filter if an order is specified AND data exists
    if (!apiFieldOrder || !data) {
      return data; // Return original if no order/filter specified or data is null
    }
    if (Array.isArray(data)) {
      // Use the FILTERING helper
      return data.map((item) =>
        reorderAndFilterObjectKeys(item, apiFieldOrder)
      );
    } else {
      // Use the FILTERING helper
      return reorderAndFilterObjectKeys(data, apiFieldOrder);
    }
  }

  // --- Internal Fetch & Upsert Logic ---
  async function internalFetchAndUpsert(
    symbol?: string
  ): Promise<Partial<ApiType> | Partial<ApiType>[]> {
    // ... (API Key, URL Construction, Fetch, Response Handling, Validation, Data Standardization, Processing) ...
    // --- Start: Simplified Fetch/Process/Upsert ---
    const apiKey = getFmpApiKey();
    const baseQueryParams = { ...fmpParams, apikey: apiKey };
    let actualUrl: string;
    // Construct URL
    if (fetchMode === FetchMode.BySymbol) {
      if (!symbol)
        throw new Error(
          `Fetch Error (${collectionName}): Symbol required for fetchMode='bySymbol'.`
        );
      if (fmpPath === "profile" || fmpPath === "company/profile") {
        const queryParams = new URLSearchParams({
          ...baseQueryParams,
          symbol,
        }).toString();
        actualUrl = `https://financialmodelingprep.com/api/${fmpBasePath}/${fmpPath}?${queryParams}`;
      } else {
        const queryParams = new URLSearchParams(baseQueryParams).toString();
        actualUrl = `https://financialmodelingprep.com/api/${fmpBasePath}/${fmpPath}/${symbol}?${queryParams}`;
      }
    } else {
      const queryParams = new URLSearchParams(baseQueryParams).toString();
      actualUrl = `https://financialmodelingprep.com/api/${fmpBasePath}/${fmpPath}?${queryParams}`;
    }
    console.log(
      `Fetching from FMP [${fetchMode}]: ${actualUrl.replace(apiKey, "***")}`
    );
    const response = await fetch(actualUrl, { cache: "no-store" });
    // Process Response
    if (!response.ok) {
      let errorBody = `(Status ${response.status})`;
      try {
        errorBody = await response.text();
      } catch {
        /*Ignore*/
      }
      console.error(
        `FMP Error Body (${response.status}) for ${actualUrl.replace(
          apiKey,
          "***"
        )}: ${errorBody}`
      );
      throw new Error(
        `FMP request failed (${response.status}) for ${fetchMode} fetch at ${fmpPath}.`
      );
    }
    const rawJsonData: unknown = await response.json();
    // Validate
    if (validateRawData && !validateRawData(rawJsonData)) {
      console.error("Raw data validation failed:", rawJsonData);
      throw new Error(
        `Invalid data structure received from FMP for ${fetchMode} fetch at ${fmpPath}.`
      );
    }
    // Standardize
    let rawArray: RawType[];
    if (Array.isArray(rawJsonData)) {
      rawArray = rawJsonData as RawType[];
    } else if (rawJsonData && typeof rawJsonData === "object") {
      rawArray = [rawJsonData as RawType];
    } else {
      throw new Error(`Unexpected raw data format from FMP.`);
    }
    // Process
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
        `No data after processing from FMP for ${fetchMode} at ${fmpPath}${
          symbol ? ` for ${symbol}` : ""
        }`
      );
      if (fetchMode === FetchMode.BySymbol)
        throw new Error(`No data found for symbol ${symbol}.`);
      return [];
    }
    // Upsert
    const col = await getCollection();
    const now = new Date();
    const bulk = col.initializeUnorderedBulkOp();
    for (const raw of rawArray) {
      try {
        let docData = mapRawToDoc(raw);
        if (
          fetchMode === FetchMode.BySymbol &&
          symbol &&
          docData.symbol !== symbol
        ) {
          console.warn(
            `Symbol mismatch: Req=${symbol}, Rsp=${docData.symbol}. Overriding.`
          );
          docData = { ...docData, symbol: symbol };
        }
        const replacement = { ...docData, modifiedAt: now } as Omit<
          DocType,
          "_id" | "modifiedAt"
        >;
        const filter = buildKeyFilter(replacement);
        bulk.find(filter).upsert().replaceOne(replacement);
      } catch (error) {
        console.error(`Error processing raw record: ${error}`, raw);
      }
    }
    if (bulk.length === 0) {
      console.warn(
        `No valid bulk ops generated for ${collectionName}${
          symbol ? ` for ${symbol}` : ""
        }`
      );
      if (fetchMode === FetchMode.BySymbol)
        throw new Error(`No processable data for symbol ${symbol}.`);
      return [];
    }
    try {
      const bulkResult = await bulk.execute();
      console.log(
        `Bulk upsert (${collectionName}): ${bulkResult.upsertedCount} upserted, ${bulkResult.modifiedCount} modified.`
      );
    } catch (error) {
      console.error(`Bulk write error: ${error}`);
      throw error;
    }
    // --- End: Simplified Fetch/Process/Upsert ---

    // Retrieve Final Results from DB and Return (Applying Order/Filter)
    if (fetchMode === FetchMode.FullCollection) {
      // Fetching all after a full collection update - projection less critical here
      const finalDocs = await col.find({} as Filter<DocType>).toArray();
      const mappedDocs = finalDocs.map((doc) => mapDocToApi(doc as DocType));
      return applyOrderAndFilter(mappedDocs); // Apply order/filter
    } else {
      // FetchMode.BySymbol
      const filterForSymbol = { symbol } as Filter<DocType>;
      if (isSingleRecordPerSymbol) {
        const finalDoc = await col.findOne(filterForSymbol);
        if (!finalDoc)
          throw new Error(
            `Consistency error: Could not retrieve upserted doc for ${symbol}.`
          );
        const mappedDoc = mapDocToApi(finalDoc as DocType);
        return applyOrderAndFilter(mappedDoc); // Apply order/filter
      } else {
        if (!sortByFieldForLatest)
          throw new Error("Assertion Failed: sortByFieldForLatest missing.");
        const sortCriteria: Sort = { [sortByFieldForLatest as string]: -1 };
        const finalLatestDoc = await col
          .find(filterForSymbol)
          .sort(sortCriteria)
          .limit(1)
          .next();
        if (!finalLatestDoc)
          throw new Error(
            `Consistency error: Could not retrieve latest upserted doc for ${symbol}.`
          );
        const mappedDoc = mapDocToApi(finalLatestDoc as DocType);
        return applyOrderAndFilter(mappedDoc); // Apply order/filter
      }
    }
  } // End of internalFetchAndUpsert

  // --- Service Method: Get Single/Latest Record by Symbol ---
  async function getOne(symbol: string): Promise<Partial<ApiType> | null> {
    const col = await getCollection();
    const filter = { symbol: symbol } as Filter<DocType>;

    if (fetchMode === FetchMode.FullCollection) {
      const doc = await col.findOne(filter);
      if (!doc) {
        return null;
      } // Check null before mapping
      const mappedDoc = mapDocToApi(doc as DocType);
      return applyOrderAndFilter(mappedDoc); // Apply order/filter
    } else {
      // FetchMode.BySymbol
      const sortOptions: Sort = {};
      if (!isSingleRecordPerSymbol && sortByFieldForLatest) {
        sortOptions[sortByFieldForLatest as string] = -1;
      }
      const latestDocInDb = await col
        .find(filter)
        .sort(sortOptions)
        .limit(1)
        .next();
      const isFresh =
        latestDocInDb &&
        Date.now() - latestDocInDb.modifiedAt.getTime() < cacheTtlMs;

      if (isFresh) {
        console.log(`Cache hit for ${symbol} (${collectionName})`);
        const mappedDoc = mapDocToApi(latestDocInDb as DocType); // Not null if fresh
        return applyOrderAndFilter(mappedDoc); // Apply order/filter
      } else {
        console.log(
          `Cache ${
            latestDocInDb ? "stale" : "miss"
          } for ${symbol} (${collectionName}). Fetching...`
        );
        try {
          // internalFetchAndUpsert already applies order/filter
          const result = await internalFetchAndUpsert(symbol);
          if (Array.isArray(result))
            throw new Error(
              "Internal Error: Expected single result for BySymbol fetch."
            );
          return result; // Return directly (already ordered/filtered)
        } catch (fetchError) {
          const errorMessage =
            fetchError instanceof Error
              ? fetchError.message
              : String(fetchError);
          console.error(
            `Error fetching ${symbol} for ${collectionName}: ${errorMessage}`
          );
          if (latestDocInDb) {
            console.warn(
              `Returning stale data for ${symbol} due to fetch error.`
            );
            const mappedStaleDoc = mapDocToApi(latestDocInDb as DocType);
            return applyOrderAndFilter(mappedStaleDoc); // Apply order/filter to stale data
          }
          return null;
        }
      }
    }
  } // End of getOne

  // --- Service Method: Get All Records for a Specific Symbol (History) ---
  async function getAllForSymbol(symbol: string): Promise<Partial<ApiType>[]> {
    const col = await getCollection();
    const filter = { symbol: symbol } as Filter<DocType>;

    if (fetchMode === FetchMode.FullCollection) {
      const doc = await col.findOne(filter);
      if (!doc) {
        return [];
      } // Return empty array if not found
      const mappedDoc = mapDocToApi(doc as DocType);
      const orderedDoc = applyOrderAndFilter(mappedDoc);
      return [orderedDoc]; // Return single item array (ordered/filtered)
    } else {
      // FetchMode.BySymbol
      if (isSingleRecordPerSymbol) {
        // getOne already applies order/filter
        const singleApiRecord = await getOne(symbol);
        return singleApiRecord ? [singleApiRecord] : [];
      } else {
        await getOne(symbol); // Ensure freshness (getOne handles order/filter)
        const sortOptions: Sort = {};
        if (sortByFieldForLatest) {
          sortOptions[sortByFieldForLatest as string] = -1;
        }
        // Fetch full docs for history - projection less critical here usually
        const docs = await col.find(filter).sort(sortOptions).toArray();
        const mappedDocs = docs.map((doc) => mapDocToApi(doc as DocType));
        // Apply order/filter to the array
        return applyOrderAndFilter(mappedDocs);
      }
    }
  } // End of getAllForSymbol

  // --- Service Method: Get All Records (List View / Full Collection Refresh Trigger) ---
  async function getAll(): Promise<Partial<ApiType>[]> {
    const col = await getCollection();

    if (fetchMode === FetchMode.FullCollection) {
      // ... (logic for checking freshness) ...
      const latestDocInCollection = await col.findOne(
        {},
        { sort: { modifiedAt: -1 } }
      );
      const isFresh =
        latestDocInCollection &&
        Date.now() - latestDocInCollection.modifiedAt.getTime() < cacheTtlMs;

      if (!isFresh) {
        console.log(
          `Collection cache ${
            latestDocInCollection ? "stale" : "miss"
          } for ${collectionName}. Fetching...`
        );
        try {
          // internalFetchAndUpsert already applies order/filter
          const freshData = await internalFetchAndUpsert();
          if (!Array.isArray(freshData))
            throw new Error(
              "Internal Error: Expected array result for FullCollection fetch."
            );
          return freshData;
        } catch (fetchError) {
          // ... error handling ...
          console.error(
            `Error fetching full collection ${collectionName}: ${fetchError}`
          );
          return [];
        }
      } else {
        console.log(`Collection cache hit for ${collectionName}.`);
        // Fetch all documents - projection less critical here
        const docs = await col.find({} as Filter<DocType>).toArray();
        const mappedDocs = docs.map((doc) => mapDocToApi(doc as DocType));
        // Apply order/filter
        return applyOrderAndFilter(mappedDocs);
      }
    } else {
      // FetchMode.BySymbol
      console.log(
        `getAll reading list for ${collectionName} (bySymbol mode). Using apiFieldOrder for projection if configured.`
      );

      // --- Dynamically Generate Projection from apiFieldOrder ---
      const findOptions: FindOptions<DocType> = {};
      if (apiFieldOrder && apiFieldOrder.length > 0) {
        // Create projection to include only specified fields
        // Type assertion needed for dynamic object keys
        const projection: Partial<Record<keyof DocType, 1>> = {};
        apiFieldOrder.forEach((key) => {
          // Assume keyof ApiType corresponds to keyof DocType for projection
          // Add _id explicitly if it's in apiFieldOrder and needed by the client,
          // otherwise MongoDB includes it by default unless excluded.
          // Our current mapper removes ObjectId _id, so including it here
          // only matters if the ApiType has _id: string and apiFieldOrder includes _id.
          projection[key as keyof DocType] = 1;
        });
        findOptions.projection = projection;
      } else {
        console.log(
          `No apiFieldOrder specified, fetching default document fields.`
        );
        // No projection applied by default (fetches all fields)
      }
      // --- End Projection Generation ---

      const docs = await col
        .find({} as Filter<DocType>, findOptions) // Use generated findOptions
        .limit(1000) // Keep reasonable limit
        .sort({ symbol: 1 }) // Default sort
        .toArray();

      // Map (input might be partial due to generated projection) and apply order/filter
      const mappedDocs = docs.map((doc) =>
        // Pass potentially partial doc to mapper
        mapDocToApi(doc as DocType | Partial<DocType>)
      );
      return applyOrderAndFilter(mappedDocs);
    }
  } // End of getAll

  // --- Return Public Service API ---
  return { getCollection, getAll, getOne, getAllForSymbol };
} // End of createGenericService
